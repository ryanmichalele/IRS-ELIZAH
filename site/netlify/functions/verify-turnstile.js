export default async (req, context) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Turnstile secret key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const token = body['cf-turnstile-response'];

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Turnstile token missing' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  formData.append('remoteip', ip.split(',')[0].trim());

  try {
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await verifyRes.json();
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
