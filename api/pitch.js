// Vercel serverless function: receives pitch form submissions and emails them via Resend.
//
// Environment variables required in the Vercel project:
//   RESEND_API_KEY   — API key from https://resend.com/api-keys
//   PITCH_TO         — (optional) destination address. Defaults to hello@macroshifts.com
//   PITCH_FROM       — (optional) from address. Defaults to pitch@macroshifts.com
//                      The from-address domain must be verified in Resend, or use the
//                      onboarding sandbox: onboarding@resend.dev

const escape = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
  const TO = (process.env.PITCH_TO || 'hello@macroshifts.com').trim();
  const FROM = (process.env.PITCH_FROM || 'Macroshifts Pitch <pitch@macroshifts.com>').trim();

  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY env var');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Vercel parses JSON bodies automatically when Content-Type: application/json
  const body = req.body || {};
  const { first = '', last = '', email = '', company = '', services = [], stage = '', idea = '' } = body;

  if (!first.trim() || !last.trim() || !email.trim() || !idea.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Very loose email shape check; Resend will reject bad addresses anyway.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const servicesList = Array.isArray(services) && services.length
    ? services.map((s) => escape(s)).join(', ')
    : '—';

  const ideaHtml = escape(idea).replace(/\n/g, '<br>');

  const subject = `New pitch: ${first} ${last}${company ? ' — ' + company : ''}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; padding: 24px; color: #0C173F;">
      <h2 style="margin: 0 0 6px; font-size: 22px;">New pitch · Macroshifts</h2>
      <p style="margin: 0 0 24px; color: #6b7280;">Submitted via macroshifts.com/Contact</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; color: #6b7280; width: 130px;">Name</td><td style="padding: 8px 0;"><strong>${escape(first)} ${escape(last)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Company / project</td><td style="padding: 8px 0;">${escape(company) || '—'}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Stage</td><td style="padding: 8px 0;">${escape(stage) || '—'}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Needs</td><td style="padding: 8px 0;">${servicesList}</td></tr>
      </table>

      <h3 style="margin: 0 0 8px; font-size: 16px;">The idea</h3>
      <div style="padding: 16px 18px; background: #FBF7EF; border-left: 3px solid #FF6A45; border-radius: 0 8px 8px 0; line-height: 1.55;">${ideaHtml}</div>

      <p style="margin-top: 28px; color: #6b7280; font-size: 13px;">Reply directly to this email to respond to the founder.</p>
    </div>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Resend send failed', r.status, text);
      return res.status(502).json({ error: 'Email delivery failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('pitch handler error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}
