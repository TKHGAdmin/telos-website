var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch nutrition log for a date
  if (req.method === 'GET') {
    try {
      var date = req.query.date;
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }
      var raw = await redis('GET', 'client_nutrition_log:' + clientId + ':' + date);
      return res.status(200).json({ log: raw ? JSON.parse(raw) : null });
    } catch (err) {
      console.error('nutrition-log GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - save nutrition log
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
        meals: body.meals || [],
        totals: body.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        updatedAt: new Date().toISOString(),
      };

      var key = 'client_nutrition_log:' + clientId + ':' + body.date;
      var epoch = new Date(body.date).getTime();
      await Promise.all([
        redis('SET', key, JSON.stringify(log)),
        redis('ZADD', 'client_nutrition_logs_index:' + clientId, epoch, body.date),
      ]);

      return res.status(200).json({ ok: true, log: log });
    } catch (err) {
      console.error('nutrition-log POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
