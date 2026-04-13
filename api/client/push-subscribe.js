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
    var body = req.body;
    if (!body.subscription) {
      return res.status(400).json({ error: 'subscription required' });
    }

    // Store push subscription for this client
    await redis('SET', 'client_push_sub:' + clientId, JSON.stringify({
      subscription: body.subscription,
      clientId: clientId,
      subscribedAt: new Date().toISOString()
    }));

    // Update client record to indicate push enabled
    var clientRaw = await redis('GET', 'client:' + clientId);
    if (clientRaw) {
      var client = JSON.parse(clientRaw);
      client.pushEnabled = true;
      client.pushSubscribedAt = new Date().toISOString();
      await redis('SET', 'client:' + clientId, JSON.stringify(client));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('push-subscribe error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
