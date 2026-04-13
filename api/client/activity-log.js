var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch activity log(s)
  if (req.method === 'GET') {
    try {
      var date = req.query.date;
      var range = parseInt(req.query.range, 10);

      // Single date
      if (date && !range) {
        var raw = await redis('GET', 'client_activity_log:' + clientId + ':' + date);
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
        return ['GET', 'client_activity_log:' + clientId + ':' + d];
      });
      var results = await redisPipeline(cmds);
      var logs = [];
      results.forEach(function (r) {
        if (r.result) {
          try { logs.push(JSON.parse(r.result)); } catch (e) {}
        }
      });

      return res.status(200).json({ logs: logs });
    } catch (err) {
      console.error('activity-log GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - save activity log
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.date) {
        return res.status(400).json({ error: 'Date required' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
      }

      var key = 'client_activity_log:' + clientId + ':' + body.date;
      var existing = await redis('GET', key);
      var log = existing ? JSON.parse(existing) : { clientId: clientId, date: body.date, activities: [] };

      // Append new activity or replace full list
      if (body.activity) {
        log.activities.push(body.activity);
      } else if (body.activities) {
        log.activities = body.activities;
      }

      log.updatedAt = new Date().toISOString();

      var epoch = new Date(body.date).getTime();
      await Promise.all([
        redis('SET', key, JSON.stringify(log)),
        redis('ZADD', 'client_activity_logs_index:' + clientId, epoch, body.date),
      ]);

      return res.status(200).json({ ok: true, log: log });
    } catch (err) {
      console.error('activity-log POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
