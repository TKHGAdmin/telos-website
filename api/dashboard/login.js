const { verifyPassword, createToken, getSessionCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password || !verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = createToken();
  res.setHeader('Set-Cookie', getSessionCookie(token));
  return res.status(200).json({ ok: true });
};
