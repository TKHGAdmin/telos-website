var { verifySession } = require('../lib/auth');
var { redis, redisPipeline } = require('../lib/redis');

var TIER_ORDER = ['rebuild', 'growth', 'lifestyle', 'lifestyle_plus'];

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list all modules
  if (req.method === 'GET') {
    try {
      var ids = await redis('ZREVRANGE', 'course_modules_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ modules: [] });
      }
      var cmds = ids.map(function(id) { return ['GET', 'course_module:' + id]; });
      var results = await redisPipeline(cmds);
      var modules = [];
      results.forEach(function(r) {
        if (r.result) {
          try { modules.push(JSON.parse(r.result)); } catch(e) {}
        }
      });

      // Optional filters
      var pillar = req.query.pillar;
      if (pillar) {
        modules = modules.filter(function(m) { return m.pillar === pillar; });
      }
      var series = req.query.series;
      if (series) {
        modules = modules.filter(function(m) { return m.seriesName === series; });
      }
      var tier = req.query.tier;
      if (tier) {
        modules = modules.filter(function(m) {
          return m.tierAccess && m.tierAccess.indexOf(tier) !== -1;
        });
      }
      var status = req.query.status;
      if (status) {
        modules = modules.filter(function(m) { return m.status === status; });
      }

      // Get unique series names
      var seriesNames = [];
      modules.forEach(function(m) {
        if (m.seriesName && seriesNames.indexOf(m.seriesName) === -1) {
          seriesNames.push(m.seriesName);
        }
      });

      return res.status(200).json({ modules: modules, seriesNames: seriesNames });
    } catch (err) {
      console.error('modules GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - create module
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.title) {
        return res.status(400).json({ error: 'Title required' });
      }

      var id = await redis('INCR', 'id:course_modules');
      var mod = {
        id: id,
        title: body.title,
        description: body.description || '',
        pillar: body.pillar || 'training',
        seriesName: body.seriesName || '',
        seriesOrder: body.seriesOrder || 0,
        tierAccess: body.tierAccess || TIER_ORDER.slice(),
        videoUrl: body.videoUrl || '',
        thumbnailUrl: body.thumbnailUrl || '',
        duration: body.duration || 0,
        status: body.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      var promises = [
        redis('SET', 'course_module:' + id, JSON.stringify(mod)),
        redis('ZADD', 'course_modules_index', Date.now(), String(id))
      ];
      if (mod.seriesName) {
        promises.push(redis('ZADD', 'course_series:' + mod.seriesName, mod.seriesOrder || 0, String(id)));
      }
      if (mod.pillar) {
        promises.push(redis('ZADD', 'course_pillars:' + mod.pillar, Date.now(), String(id)));
      }
      await Promise.all(promises);

      return res.status(200).json({ ok: true, module: mod });
    } catch (err) {
      console.error('modules POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update module
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.id) return res.status(400).json({ error: 'ID required' });

      var existing = await redis('GET', 'course_module:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Module not found' });
      var mod = JSON.parse(existing);

      var oldSeries = mod.seriesName;
      var oldPillar = mod.pillar;

      if (body.title !== undefined) mod.title = body.title;
      if (body.description !== undefined) mod.description = body.description;
      if (body.pillar !== undefined) mod.pillar = body.pillar;
      if (body.seriesName !== undefined) mod.seriesName = body.seriesName;
      if (body.seriesOrder !== undefined) mod.seriesOrder = body.seriesOrder;
      if (body.tierAccess !== undefined) mod.tierAccess = body.tierAccess;
      if (body.videoUrl !== undefined) mod.videoUrl = body.videoUrl;
      if (body.thumbnailUrl !== undefined) mod.thumbnailUrl = body.thumbnailUrl;
      if (body.duration !== undefined) mod.duration = body.duration;
      if (body.status !== undefined) mod.status = body.status;
      mod.updatedAt = new Date().toISOString();

      var promises = [
        redis('SET', 'course_module:' + body.id, JSON.stringify(mod))
      ];

      // Update series indexes if series changed
      if (oldSeries && oldSeries !== mod.seriesName) {
        promises.push(redis('ZREM', 'course_series:' + oldSeries, String(body.id)));
      }
      if (mod.seriesName) {
        promises.push(redis('ZADD', 'course_series:' + mod.seriesName, mod.seriesOrder || 0, String(body.id)));
      }

      // Update pillar indexes if pillar changed
      if (oldPillar && oldPillar !== mod.pillar) {
        promises.push(redis('ZREM', 'course_pillars:' + oldPillar, String(body.id)));
      }
      if (mod.pillar) {
        promises.push(redis('ZADD', 'course_pillars:' + mod.pillar, Date.now(), String(body.id)));
      }

      await Promise.all(promises);
      return res.status(200).json({ ok: true, module: mod });
    } catch (err) {
      console.error('modules PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE - remove module
  if (req.method === 'DELETE') {
    try {
      var id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });

      var existing = await redis('GET', 'course_module:' + id);
      if (existing) {
        var mod = JSON.parse(existing);
        var promises = [
          redis('DEL', 'course_module:' + id),
          redis('ZREM', 'course_modules_index', String(id))
        ];
        if (mod.seriesName) {
          promises.push(redis('ZREM', 'course_series:' + mod.seriesName, String(id)));
        }
        if (mod.pillar) {
          promises.push(redis('ZREM', 'course_pillars:' + mod.pillar, String(id)));
        }
        await Promise.all(promises);
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('modules DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
