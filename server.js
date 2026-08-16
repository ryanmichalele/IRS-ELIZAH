import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname, sep } from 'path';
import { URL } from 'url';
import { networkInterfaces } from 'os';

const ROOT = join(import.meta.dirname, 'site');
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
};

function sanitizePath(p) {
  // Prevent directory traversal
  const normalized = join('/', p);
  const resolved = join(ROOT, normalized);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

async function serveFile(res, filePath) {
  try {
    if (!existsSync(filePath)) return false;
    const stat = statSync(filePath);
    if (!stat.isFile()) return false;

    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': content.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || HOST}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Handle /review/* routes → serve report.html with cid query param
  const reviewMatch = pathname.match(/^\/review\/(.+)$/);
  if (reviewMatch) {
    const caseId = reviewMatch[1];
    const reportFile = join(ROOT, 'check-report', 'report.html');
    if (existsSync(reportFile)) {
      let html = readFileSync(reportFile, 'utf-8');
      // Inject cid param so report.html JS can read it
      const marker = 'var params = new URLSearchParams(window.location.search);';
      const inject = `var params = new URLSearchParams(window.location.search);
    if (!params.has('cid')) { params.set('cid', '${caseId.replace(/'/g, "\\'")}'); }`;
      html = html.replace(marker, inject);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(html);
      return;
    }
  }

  // Strip query strings and handle special paths
  if (pathname === '/' || pathname === '') {
    // Try index.html
    if (await serveFile(res, join(ROOT, 'index.html'))) return;
    if (await serveFile(res, join(ROOT, 'index.htm'))) return;
  }

  // Try exact file match
  let filePath = sanitizePath(pathname);
  if (filePath) {
    if (await serveFile(res, filePath)) return;
  }

  // Try appending index.html for directory-style paths
  if (!extname(pathname)) {
    const indexPath = sanitizePath(join(pathname, 'index.html'));
    if (indexPath && await serveFile(res, indexPath)) return;

    const indexHtmPath = sanitizePath(join(pathname, 'index.htm'));
    if (indexHtmPath && await serveFile(res, indexHtmPath)) return;
  }

  // Try adding .html
  const htmlPath = sanitizePath(pathname + '.html');
  if (htmlPath && await serveFile(res, htmlPath)) return;

  // Try adding .htm
  const htmPath = sanitizePath(pathname + '.htm');
  if (htmPath && await serveFile(res, htmPath)) return;

  // 404 - Return homepage as fallback
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  IRS.GOV Local Mirror Server');
  console.log('  ─────────────────────────────');
  console.log(`  Local:   http://${HOST}:${PORT}`);
  console.log(`  Network: http://${getLocalIp()}:${PORT}`);
  console.log(`  Root:    ${ROOT}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});

function getLocalIp() {
  try {
    const ifaces = networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {}
  return '0.0.0.0';
}
