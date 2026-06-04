// Lighter lead capture — used by the popup modal on non-Contact pages.
// Sends a "New lead" email via Resend (same RESEND_API_KEY env var as /api/pitch).

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

  const body = req.body || {};
  const { name = '', email = '', message = '', page = '' } = body;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const messageHtml = escape(message).replace(/\n/g, '<br>');
  const subject = `New lead: ${name}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; padding: 24px; color: #0C173F;">
      <h2 style="margin: 0 0 6px; font-size: 20px;">New lead · popup form</h2>
      <p style="margin: 0 0 20px; color: #6b7280;">Captured from <code style="background:#FBF7EF;padding:2px 6px;border-radius:4px;">${escape(page) || '/'}</code></p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">
        <tr><td style="padding:6px 0; color:#6b7280; width:100px;">Name</td><td style="padding:6px 0;"><strong>${escape(name)}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
      </table>
      <h3 style="margin: 16px 0 8px; font-size: 15px;">What they're working on</h3>
      <div style="padding: 14px 16px; background: #FBF7EF; border-left: 3px solid #FF6A45; border-radius: 0 8px 8px 0; line-height: 1.55;">${messageHtml}</div>
      <p style="margin-top: 22px; color: #6b7280; font-size: 13px;">Reply directly to this email to respond to the lead.</p>
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
    console.error('lead handler error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
}
