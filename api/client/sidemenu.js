var { redis } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

var DEFAULT_ITEMS = [
  { id: 'growth', type: 'builtin', enabled: true, order: 0 },
  { id: 'community', type: 'builtin', enabled: true, order: 1 },
  { id: 'calls', type: 'builtin', enabled: true, order: 2 },
  { id: 'resources', type: 'builtin', enabled: true, order: 3 }
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    var raw = await redis('GET', 'client_sidemenu:' + clientId);
    if (raw) {
      var config = JSON.parse(raw);
      return res.status(200).json({ items: config.items || DEFAULT_ITEMS });
    }
    return res.status(200).json({ items: DEFAULT_ITEMS });
  } catch (err) {
    console.error('sidemenu GET error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
