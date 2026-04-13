var { redis } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Remove push subscription
    await redis('DEL', 'client_push_sub:' + clientId);

    // Update client record
    var clientRaw = await redis('GET', 'client:' + clientId);
    if (clientRaw) {
      var client = JSON.parse(clientRaw);
      client.pushEnabled = false;
      await redis('SET', 'client:' + clientId, JSON.stringify(client));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('push-unsubscribe error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
