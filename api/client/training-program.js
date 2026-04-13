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
    var raw = await redis('GET', 'client_training_program:' + clientId);
    return res.status(200).json({ program: raw ? JSON.parse(raw) : null });
  } catch (err) {
    console.error('training-program GET error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
