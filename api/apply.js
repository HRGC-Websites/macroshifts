// Vercel serverless function: receives job applications from /careers/<role> pages
// and emails them via Resend to careers@macroshifts.com.

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
  const TO = (process.env.APPLY_TO || 'careers@macroshifts.com').trim();
  const FROM = (process.env.PITCH_FROM || 'Macroshifts Pitch <pitch@macroshifts.com>').trim();

  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY env var');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const body = req.body || {};
  const {
    name = '',
    email = '',
    phone = '',
    role = '',
    roleTitle = '',
    linkedin = '',
    portfolio = '',
    why = '',
  } = body;

  if (!name.trim() || !email.trim() || !phone.trim() || !role.trim() || !why.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (phone.replace(/[^0-9]/g, '').length < 7) {
    return res.status(400).json({ error: 'Invalid phone' });
  }

  const phoneHref = 'tel:' + phone.replace(/[^0-9+]/g, '');
  const titleLabel = roleTitle || role;
  const subject = `Application: ${titleLabel} — ${name}`;
  const whyHtml = escape(why).replace(/\n/g, '<br>');

  const linkedinRow = linkedin.trim()
    ? `<tr><td style="padding:6px 0; color:#6b7280;">LinkedIn</td><td style="padding:6px 0;"><a href="${escape(linkedin)}" target="_blank" rel="noopener noreferrer">${escape(linkedin)}</a></td></tr>`
    : '';
  const portfolioRow = portfolio.trim()
    ? `<tr><td style="padding:6px 0; color:#6b7280;">Portfolio / CV</td><td style="padding:6px 0;"><a href="${escape(portfolio)}" target="_blank" rel="noopener noreferrer">${escape(portfolio)}</a></td></tr>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; padding: 24px; color: #0C173F;">
      <h2 style="margin: 0 0 6px; font-size: 22px;">New application · Macroshifts</h2>
      <p style="margin: 0 0 18px; color: #6b7280;">Role: <strong style="color:#0C173F;">${escape(titleLabel)}</strong></p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
        <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">Name</td><td style="padding: 6px 0;"><strong>${escape(name)}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Phone</td><td style="padding: 6px 0;"><a href="${escape(phoneHref)}">${escape(phone)}</a></td></tr>
        ${linkedinRow}
        ${portfolioRow}
      </table>

      <h3 style="margin: 0 0 8px; font-size: 16px;">Why this role</h3>
      <div style="padding: 16px 18px; background: #FBF7EF; border-left: 3px solid #FF6A45; border-radius: 0 8px 8px 0; line-height: 1.55;">${whyHtml}</div>

      <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">Reply directly to this email to respond to the candidate.</p>
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
    console.error('apply handler error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
}
