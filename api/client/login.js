var { redis } = require('../lib/redis');
var {
  verifyPassword,
  createClientToken,
  getClientSessionCookie,
  normalizeEmail,
} = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var body = req.body;
    if (!body.email || !body.password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    var email = normalizeEmail(body.email);
    var clientId = await redis('GET', 'client_email:' + email);
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    var raw = await redis('GET', 'client:' + clientId);
    if (!raw) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    var client = JSON.parse(raw);

    if (!client.portalEnabled) {
      return res.status(401).json({ error: 'Portal access not enabled' });
    }
    if (client.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }
    if (!client.passwordHash || !client.passwordSalt) {
      return res.status(401).json({ error: 'Password not set - contact your coach' });
    }

    if (!verifyPassword(body.password, client.passwordHash, client.passwordSalt)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    var token = createClientToken(String(client.id));
    res.setHeader('Set-Cookie', getClientSessionCookie(token));
    return res.status(200).json({
      ok: true,
      client: { name: client.name, tier: client.tier, tierName: client.tierName },
    });
  } catch (err) {
    console.error('client login error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
