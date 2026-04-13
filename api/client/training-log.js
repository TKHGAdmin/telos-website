var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Recent logs mode - return last N logs
      if (req.query.mode === 'recent') {
        var limit = parseInt(req.query.limit) || 7;
        var dates = await redis('ZREVRANGE', 'client_training_logs_index:' + clientId, 0, limit - 1);
        if (!dates || dates.length === 0) {
          return res.status(200).json({ logs: [] });
        }
        var cmds = dates.map(function(d) { return ['GET', 'client_training_log:' + clientId + ':' + d]; });
        var results = await redisPipeline(cmds);
        var logs = [];
        results.forEach(function(r) {
          if (r.result) { try { logs.push(JSON.parse(r.result)); } catch(e) {} }
        });
        return res.status(200).json({ logs: logs });
      }

      var date = req.query.date;
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }
      var raw = await redis('GET', 'client_training_log:' + clientId + ':' + date);
      return res.status(200).json({ log: raw ? JSON.parse(raw) : null });
    } catch (err) {
      console.error('training-log GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.date) {
        return res.status(400).json({ error: 'Date required' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
      }

      var log = {
        clientId: clientId,
        date: body.date,
        completedSets: body.completedSets || {},
        notes: (body.notes || '').slice(0, 1000),
        updatedAt: new Date().toISOString(),
      };

      var key = 'client_training_log:' + clientId + ':' + body.date;
      var epoch = new Date(body.date).getTime();
      await Promise.all([
        redis('SET', key, JSON.stringify(log)),
        redis('ZADD', 'client_training_logs_index:' + clientId, epoch, body.date),
      ]);

      return res.status(200).json({ ok: true, log: log });
    } catch (err) {
      console.error('training-log POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
