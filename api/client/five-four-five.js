var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch 545 data (goals, routine, daily tasks)
  if (req.method === 'GET') {
    try {
      var date = req.query.date || new Date().toISOString().split('T')[0];
      var range = parseInt(req.query.range, 10);

      // Always fetch goals + routine
      var results = await Promise.all([
        redis('GET', 'client_545_goals:' + clientId),
        redis('GET', 'client_545_routine:' + clientId),
      ]);

      var response = {
        goals: results[0] ? JSON.parse(results[0]) : null,
        routine: results[1] ? JSON.parse(results[1]) : null,
      };

      // Fetch daily data
      if (range) {
        var now = Date.now();
        var cmds = [];
        var dates = [];
        for (var i = 0; i < range; i++) {
          var d = new Date(now - i * 86400000).toISOString().split('T')[0];
          dates.push(d);
          cmds.push(['GET', 'client_545_daily:' + clientId + ':' + d]);
        }
        var dailyResults = await redisPipeline(cmds);
        var days = [];
        dailyResults.forEach(function(r, idx) {
          if (r.result) {
            try { days.push(JSON.parse(r.result)); } catch(e) {}
          } else {
            days.push({ date: dates[idx], empty: true });
          }
        });
        response.days = days;
      } else {
        var daily = await redis('GET', 'client_545_daily:' + clientId + ':' + date);
        response.daily = daily ? JSON.parse(daily) : null;
      }

      return res.status(200).json(response);
    } catch (err) {
      console.error('545 GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - save 545 data
  if (req.method === 'POST') {
    try {
      var body = req.body;
      var type = body.type; // 'goals', 'routine', or 'daily'

      if (type === 'goals') {
        var goals = (body.goals || []).slice(0, 5).map(function(g) {
          return {
            text: (g.text || '').substring(0, 500),
            category: g.category || '',
            deadline: g.deadline || '',
            completed: !!g.completed,
          };
        });
        var data = { clientId: clientId, goals: goals, updatedAt: new Date().toISOString() };
        await redis('SET', 'client_545_goals:' + clientId, JSON.stringify(data));
        return res.status(200).json({ ok: true, goals: data });
      }

      if (type === 'routine') {
        var steps = (body.steps || []).slice(0, 4).map(function(s, i) {
          return { text: (s.text || '').substring(0, 300), order: i + 1 };
        });
        var data = { clientId: clientId, steps: steps, updatedAt: new Date().toISOString() };
        await redis('SET', 'client_545_routine:' + clientId, JSON.stringify(data));
        return res.status(200).json({ ok: true, routine: data });
      }

      if (type === 'daily') {
        if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
          return res.status(400).json({ error: 'Date required (YYYY-MM-DD)' });
        }
        var key = 'client_545_daily:' + clientId + ':' + body.date;
        var existing = await redis('GET', key);
        var daily = existing ? JSON.parse(existing) : {};

        daily.clientId = clientId;
        daily.date = body.date;

        if (body.tasks !== undefined) {
          daily.tasks = (body.tasks || []).slice(0, 5).map(function(t) {
            return {
              text: (t.text || '').substring(0, 500),
              completed: !!t.completed,
              goalIndex: t.goalIndex != null ? t.goalIndex : null,
            };
          });
        }
        if (body.routineCompleted !== undefined) {
          daily.routineCompleted = !!body.routineCompleted;
        }
        if (body.routineSteps !== undefined) {
          daily.routineSteps = (body.routineSteps || []).map(function(s) {
            return { text: s.text || '', completed: !!s.completed };
          });
        }

        daily.updatedAt = new Date().toISOString();
        if (!existing) daily.createdAt = new Date().toISOString();

        var epoch = new Date(body.date).getTime();
        await Promise.all([
          redis('SET', key, JSON.stringify(daily)),
          redis('ZADD', 'client_545_index:' + clientId, epoch, body.date),
        ]);
        return res.status(200).json({ ok: true, daily: daily });
      }

      return res.status(400).json({ error: 'Type must be goals, routine, or daily' });
    } catch (err) {
      console.error('545 POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
