import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { URL } from 'url';
import * as cheerio from 'cheerio';

const ROOT = 'https://www.irs.gov';
const OUTPUT = join(import.meta.dirname, 'site');
const CONCURRENCY = 8;
const CRAWL_DEPTH = 1;

const downloaded = new Set();       
const queued = new Set();            
const pageUrls = new Set();          
const crawlerQueue = [];            
let activeWorkers = 0;
let totalDownloaded = 0;

const LOGFILE = join(import.meta.dirname, 'mirror.log');

function log(msg) {
  const t = new Date().toTimeString().slice(0, 8);
  const line = `[${t}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOGFILE, line + '\n'); } catch {}
}

function urlToPath(urlStr) {
  const u = new URL(urlStr);
  let path = decodeURIComponent(u.pathname);
  if (!extname(path) || path.endsWith('/')) {
    if (!path.endsWith('/')) path += '/';
    path += 'index.html';
  }
  if (path.startsWith('/')) path = path.slice(1);
  return join(OUTPUT, path);
}

function ensureDir(fp) {
  const dir = dirname(fp);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function normalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    u.hash = '';
    return u.href;
  } catch { return urlStr; }
}

function isSameOrigin(urlStr) {
  try {
    const u = new URL(urlStr, ROOT);
    return u.hostname === 'www.irs.gov' || u.hostname === 'irs.gov' || u.hostname === 'static.addtoany.com';
  } catch { return false; }
}

async function fetchUrl(urlStr, referer) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': referer || ROOT
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000)
      });
      if (!resp.ok) {
        log(`  FAIL ${resp.status} ${urlStr}`);
        return null;
      }
      const contentType = resp.headers.get('content-type') || '';
      const buffer = Buffer.from(await resp.arrayBuffer());
      return { buffer, contentType, url: resp.url };
    } catch (err) {
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      else {
        log(`  ERR ${err.message} ${urlStr}`);
        return null;
      }
    }
  }
  return null;
}

async function downloadAsset(urlStr, referer) {
  const norm = normalizeUrl(urlStr);
  if (downloaded.has(norm)) return;
  downloaded.add(norm);

  const result = await fetchUrl(urlStr, referer);
  if (!result) return null;

  const { buffer, contentType, url: finalUrl } = result;
  const fp = urlToPath(finalUrl);
  ensureDir(fp);
  writeFileSync(fp, buffer);
  totalDownloaded++;
  log(`  OK ${buffer.length.toString().padStart(8)}b  ${finalUrl}`);

  // If CSS, scan for @import and url() references
  if (contentType.includes('text/css') || finalUrl.endsWith('.css')) {
    await processCSSReferences(buffer, finalUrl);
  }

  return { buffer, contentType };
}

async function processCSSReferences(buffer, cssUrl) {
  const css = buffer.toString('utf-8');
  const base = cssUrl.substring(0, cssUrl.lastIndexOf('/') + 1);

  const urlPattern = /url\(['"]?(?!data:)([^)'"]+)['"]?\)/g;
  let match;
  while ((match = urlPattern.exec(css)) !== null) {
    try {
      const abs = new URL(match[1].trim(), base).href;
      enqueueAsset(abs, cssUrl);
    } catch {}
  }

  const importSimple = /@import\s+['"]([^'"]+)['"]/g;
  while ((match = importSimple.exec(css)) !== null) {
    try {
      const abs = new URL(match[1].trim(), base).href;
      enqueueAsset(abs, cssUrl);
    } catch {}
  }

  const importUrl = /@import\s+url\(['"]?([^)'"]+)['"]?\)/g;
  while ((match = importUrl.exec(css)) !== null) {
    try {
      const abs = new URL(match[1].trim(), base).href;
      enqueueAsset(abs, cssUrl);
    } catch {}
  }
}

function enqueueAsset(urlStr, referer) {
  const norm = normalizeUrl(urlStr);
  if (downloaded.has(norm) || queued.has(norm)) return;
  if (!isSameOrigin(norm)) return;
  queued.add(norm);
  crawlerQueue.push({ url: norm, referer, isAsset: true });
}

async function downloadPage(urlStr) {
  const norm = normalizeUrl(urlStr);
  if (downloaded.has(norm)) return;
  downloaded.add(norm);

  const result = await fetchUrl(urlStr, ROOT);
  if (!result) return;

  const { buffer, contentType, url: finalUrl } = result;
  const fp = urlToPath(finalUrl);
  ensureDir(fp);
  writeFileSync(fp, buffer);
  totalDownloaded++;
  log(`  PAGE ${buffer.length.toString().padStart(8)}b  ${finalUrl}`);

  if (contentType.includes('text/html')) {
    const html = buffer.toString('utf-8');
    const $ = cheerio.load(html);
    const base = $('base').attr('href') || finalUrl;
    extractAssets($, base, finalUrl);
  }
}

function extractAssets($, base, pageUrl) {
  // <link> tags
  $('link[href]').each((_, el) => {
    const href = $(el).attr('href');
    const rel = ($(el).attr('rel') || '').toLowerCase();
    try {
      const abs = new URL(href, base).href;
      if (['stylesheet', 'preload', 'icon', 'apple-touch-icon', 'manifest', 'modulepreload', 'prefetch'].includes(rel)) {
        enqueueAsset(abs, pageUrl);
      }
    } catch {}
  });

  // <script> tags
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    try {
      enqueueAsset(new URL(src, base).href, pageUrl);
    } catch {}
  });

  // <img> tags
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    try { enqueueAsset(new URL(src, base).href, pageUrl); } catch {}

    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(part => {
        const url = part.trim().split(/\s+/)[0];
        if (url) {
          try { enqueueAsset(new URL(url, base).href, pageUrl); } catch {}
        }
      });
    }
  });

  // <source> tags (picture, video, audio)
  $('source[src]').each((_, el) => {
    const src = $(el).attr('src');
    try { enqueueAsset(new URL(src, base).href, pageUrl); } catch {}

    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(part => {
        const url = part.trim().split(/\s+/)[0];
        if (url) {
          try { enqueueAsset(new URL(url, base).href, pageUrl); } catch {}
        }
      });
    }
  });

  // <video> tags
  $('video[src]').each((_, el) => {
    try { enqueueAsset(new URL($(el).attr('src'), base).href, pageUrl); } catch {}
  });
  $('video[poster]').each((_, el) => {
    try { enqueueAsset(new URL($(el).attr('poster'), base).href, pageUrl); } catch {}
  });

  // <audio> tags
  $('audio[src]').each((_, el) => {
    try { enqueueAsset(new URL($(el).attr('src'), base).href, pageUrl); } catch {}
  });

  // <a> links to downloadable files
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const abs = new URL(href, base).href;
      const u = new URL(abs);
      const ext = extname(u.pathname).toLowerCase();
      if (['.pdf', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.xml', '.json', '.txt', '.epub', '.mobi'].includes(ext)) {
        enqueueAsset(abs, pageUrl);
      }
    } catch {}
  });

  // <meta> tags with image content
  $('meta[content]').each((_, el) => {
    const content = $(el).attr('content');
    const prop = $(el).attr('property') || $(el).attr('name') || '';
    if (!content) return;
    if (prop.includes('image') || prop === 'twitter:image') {
      if (content.startsWith('http://') || content.startsWith('https://')) {
        try { enqueueAsset(new URL(content).href, pageUrl); } catch {}
      }
    }
  });

  // Collect crawl targets from navigation areas
  // Main navigation links (top-level only for depth control)
  const navSelectors = [
    '#accessible-megamenu-navigation > li > a',
    'nav[id*="mainnavigation"] a[href]',
    '.menu--pup-info-menu a[href]',
    'footer a[href]',
    '#block-pup-irs-mainnavigation a[href]',
    '.accordion_menus_block_container a[href]'
  ];

  for (const sel of navSelectors) {
    $(sel).each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const abs = new URL(href, base).href;
        const u = new URL(abs);
        if (u.hostname === 'www.irs.gov' || u.hostname === 'irs.gov') {
          const ext = extname(u.pathname).toLowerCase();
          if (!ext || ext === '.html' || ext === '.htm' || ext === '.shtml' || ext === '') {
            let norm = u.origin + u.pathname.replace(/\/+$/, '') || '/';
            if (!norm.endsWith('/')) norm += '/';
            if (!pageUrls.has(norm)) {
              pageUrls.add(norm);
              if (crawlerQueue.length < 100) {
                crawlerQueue.push({ url: norm, isAsset: false, fromNav: true });
              }
            }
          }
        }
      } catch {}
    });
  }
}

async function worker() {
  while (true) {
    const task = crawlerQueue.shift();
    if (!task) {
      if (activeWorkers === 0) break;
      await new Promise(r => setTimeout(r, 200));
      continue;
    }

    activeWorkers++;
    try {
      if (task.isAsset) {
        await downloadAsset(task.url, task.referer || ROOT);
      } else {
        await downloadPage(task.url);
      }
    } finally {
      activeWorkers--;
    }
  }
}

async function main() {
  try {
    if (existsSync(LOGFILE)) require('fs').unlinkSync(LOGFILE);
  } catch {}
  log('=== IRS.GOV Website Mirror ===');
  log(`Output: ${OUTPUT}`);
  log('');

  // Seed the crawler
  const seedPages = [
    ROOT + '/',
    ROOT + '/filing',
    ROOT + '/payments',
    ROOT + '/refunds',
    ROOT + '/credits-and-deductions',
    ROOT + '/forms-instructions',
    ROOT + '/help/report-fraud',
    ROOT + '/help/let-us-help-you',
    ROOT + '/newsroom',
    ROOT + '/tax-professionals',
    ROOT + '/individual-tax-filing',
    ROOT + '/businesses',
    ROOT + '/charities-and-nonprofits',
    ROOT + '/your-account',
    ROOT + '/about-irs',
    ROOT + '/statistics',
    ROOT + '/identity-theft-central',
    ROOT + '/help/tax-scams',
    ROOT + '/compliance/criminal-investigation',
    ROOT + '/privacy-disclosure/irs-privacy-policy',
    ROOT + '/accessibility',
    ROOT + '/es',
    ROOT + '/zh-hans',
    ROOT + '/zh-hant',
    ROOT + '/ko',
    ROOT + '/ru',
    ROOT + '/vi',
    ROOT + '/ht'
  ];

  for (const url of seedPages) {
    if (!pageUrls.has(url)) {
      pageUrls.add(url);
      crawlerQueue.push({ url, isAsset: false });
    }
  }

  // Launch workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  log('');
  log(`=== Done! Downloaded ${totalDownloaded} files ===`);
  log(`=== Directory listing saved to mirror.log ===`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
