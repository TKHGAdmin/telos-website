var { redis } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    var raw = await redis('GET', 'client:' + clientId);
    if (!raw) {
      return res.status(404).json({ error: 'Client not found' });
    }
    var client = JSON.parse(raw);
    return res.status(200).json({
      id: client.id,
      name: client.name,
      email: client.email,
      tier: client.tier,
      tierName: client.tierName,
      startDate: client.startDate,
      status: client.status,
      everfitUrl: process.env.EVERFIT_URL || '',
    });
  } catch (err) {
    console.error('client me error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
