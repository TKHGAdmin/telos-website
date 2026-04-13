var { clearClientSessionCookie } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', clearClientSessionCookie());
  return res.status(200).json({ ok: true });
};
