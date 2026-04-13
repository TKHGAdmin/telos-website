var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch daily log(s)
  if (req.method === 'GET') {
    try {
      var date = req.query.date;
      var range = parseInt(req.query.range, 10);

      // Single date
      if (date && !range) {
        var raw = await redis('GET', 'client_dailylog:' + clientId + ':' + date);
        return res.status(200).json({ log: raw ? JSON.parse(raw) : null });
      }

      // Range: last N days
      var days = range || 7;
      var now = Date.now();
      var dates = [];
      for (var i = 0; i < days; i++) {
        var d = new Date(now - i * 86400000);
        dates.push(d.toISOString().split('T')[0]);
      }

      var cmds = dates.map(function (d) {
        return ['GET', 'client_dailylog:' + clientId + ':' + d];
      });
      var results = await redisPipeline(cmds);
      var logs = [];
      results.forEach(function (r, idx) {
        if (r.result) {
          try { logs.push(JSON.parse(r.result)); } catch (e) {}
        } else {
          logs.push({ date: dates[idx], empty: true });
        }
      });

      return res.status(200).json({ logs: logs });
    } catch (err) {
      console.error('daily-log GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - save daily log
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.date) {
        return res.status(400).json({ error: 'Date required' });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
      }

      var key = 'client_dailylog:' + clientId + ':' + body.date;
      var existing = await redis('GET', key);
      var log = existing ? JSON.parse(existing) : {};

      log.clientId = clientId;
      log.date = body.date;
      if (body.sleep !== undefined) log.sleep = Math.max(1, Math.min(5, parseInt(body.sleep, 10) || 0));
      if (body.energy !== undefined) log.energy = Math.max(1, Math.min(5, parseInt(body.energy, 10) || 0));
      if (body.stress !== undefined) log.stress = Math.max(1, Math.min(5, parseInt(body.stress, 10) || 0));
      if (body.mood !== undefined) log.mood = Math.max(1, Math.min(5, parseInt(body.mood, 10) || 0));
      if (body.weight !== undefined) log.weight = parseFloat(body.weight) || null;
      if (body.water !== undefined) log.water = parseFloat(body.water) || null;
      if (body.steps !== undefined) log.steps = parseInt(body.steps, 10) || null;
      if (body.notes !== undefined) log.notes = body.notes;

      if (!existing) {
        log.createdAt = new Date().toISOString();
      }
      log.updatedAt = new Date().toISOString();

      var epoch = new Date(body.date).getTime();
      await Promise.all([
        redis('SET', key, JSON.stringify(log)),
        redis('ZADD', 'client_dailylogs_index:' + clientId, epoch, body.date),
      ]);

      return res.status(200).json({ ok: true, log: log });
    } catch (err) {
      console.error('daily-log POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
