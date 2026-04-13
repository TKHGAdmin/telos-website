var crypto = require('crypto');
var { redis } = require('../lib/redis');
var { hashPassword, normalizeEmail } = require('../lib/client-auth');

var RESEND_API_KEY = process.env.RESEND_API_KEY;
var SITE_URL = process.env.SITE_URL || 'https://www.telosathleticclub.com';

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var body = req.body;

    // Case 1: Request a reset email (has email, no token)
    if (body.email && !body.token) {
      var email = normalizeEmail(body.email);
      var clientId = await redis('GET', 'client_email:' + email);

      // Always return success to prevent email enumeration
      if (!clientId) {
        return res.status(200).json({ ok: true });
      }

      var raw = await redis('GET', 'client:' + clientId);
      if (!raw) {
        return res.status(200).json({ ok: true });
      }
      var client = JSON.parse(raw);
      if (!client.portalEnabled) {
        return res.status(200).json({ ok: true });
      }

      // Generate reset token
      var token = crypto.randomBytes(32).toString('hex');
      await redis('SETEX', 'password_reset:' + token, 3600, String(clientId));

      // Send email via Resend
      if (RESEND_API_KEY) {
        var resetUrl = SITE_URL + '/client-dashboard?reset=' + token;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + RESEND_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Telos Fitness <noreply@telosathleticclub.com>',
            to: [client.email],
            subject: 'Reset Your Telos Client Portal Password',
            html:
              '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">' +
              '<h2 style="color:#C9A84C;margin-bottom:20px;">Password Reset</h2>' +
              '<p>Hi ' + (client.name || '').split(' ')[0] + ',</p>' +
              '<p>Click the button below to reset your Telos Client Portal password. This link expires in 1 hour.</p>' +
              '<a href="' + resetUrl + '" style="display:inline-block;background:#C9A84C;color:#080808;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>' +
              '<p style="color:#888;font-size:13px;">If you didn\'t request this, you can safely ignore this email.</p>' +
              '</div>',
          }),
        });
      }

      return res.status(200).json({ ok: true });
    }

    // Case 2: Set new password (has token + password)
    if (body.token && body.password) {
      if (body.password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      var clientId = await redis('GET', 'password_reset:' + body.token);
      if (!clientId) {
        return res.status(400).json({ error: 'Invalid or expired reset link' });
      }

      var raw = await redis('GET', 'client:' + clientId);
      if (!raw) {
        return res.status(400).json({ error: 'Client not found' });
      }

      var client = JSON.parse(raw);
      var hashed = hashPassword(body.password);
      client.passwordHash = hashed.hash;
      client.passwordSalt = hashed.salt;
      client.passwordSetAt = new Date().toISOString();

      await redis('SET', 'client:' + clientId, JSON.stringify(client));
      await redis('DEL', 'password_reset:' + body.token);

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Email or token+password required' });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
