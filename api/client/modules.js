var { redis, redisPipeline } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

var TIER_ORDER = ['rebuild', 'growth', 'lifestyle', 'lifestyle_plus'];

function tierLevel(tier) {
  var idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? 0 : idx;
}

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client record for tier check
    var clientRaw = await redis('GET', 'client:' + clientId);
    if (!clientRaw) return res.status(404).json({ error: 'Client not found' });
    var client = JSON.parse(clientRaw);
    var clientTierLevel = tierLevel(client.tier);

    // Fetch all module IDs
    var ids = await redis('ZRANGE', 'course_modules_index', 0, -1);
    if (!ids || ids.length === 0) {
      return res.status(200).json({ modules: [], watching: [], completed: [] });
    }

    // Fetch all modules + client progress in parallel
    var moduleCmds = ids.map(function(id) { return ['GET', 'course_module:' + id]; });
    var results = await redisPipeline(moduleCmds);

    var modules = [];
    results.forEach(function(r) {
      if (r.result) {
        try { modules.push(JSON.parse(r.result)); } catch(e) {}
      }
    });

    // Filter: only published modules
    modules = modules.filter(function(m) { return m.status === 'published'; });

    // Filter by pillar if requested
    var pillar = req.query.pillar;
    if (pillar && pillar !== 'all') {
      modules = modules.filter(function(m) { return m.pillar === pillar; });
    }

    // Filter by series if requested
    var series = req.query.series;
    if (series) {
      modules = modules.filter(function(m) { return m.seriesName === series; });
    }

    // Mark tier access for each module
    modules.forEach(function(m) {
      var minTier = 999;
      (m.tierAccess || []).forEach(function(t) {
        var lvl = tierLevel(t);
        if (lvl < minTier) minTier = lvl;
      });
      m.accessible = clientTierLevel >= minTier;
      m.locked = !m.accessible;
    });

    // Fetch client's watching and completed lists
    var watchingIds = await redis('ZREVRANGE', 'client_modules_watching:' + clientId, 0, -1) || [];
    var completedIds = await redis('ZREVRANGE', 'client_modules_completed:' + clientId, 0, -1) || [];

    // Fetch progress for watching modules
    var progressMap = {};
    if (watchingIds.length > 0) {
      var progCmds = watchingIds.map(function(mid) {
        return ['GET', 'client_module_progress:' + clientId + ':' + mid];
      });
      var progResults = await redisPipeline(progCmds);
      progResults.forEach(function(r, i) {
        if (r.result) {
          try { progressMap[watchingIds[i]] = JSON.parse(r.result); } catch(e) {}
        }
      });
    }

    // Attach progress to modules
    modules.forEach(function(m) {
      var mid = String(m.id);
      if (completedIds.indexOf(mid) !== -1) {
        m.progress = 100;
        m.completed = true;
      } else if (progressMap[mid]) {
        var prog = progressMap[mid];
        m.progress = prog.totalSeconds > 0 ? Math.round((prog.watchedSeconds / prog.totalSeconds) * 100) : 0;
        m.completed = false;
      } else {
        m.progress = 0;
        m.completed = false;
      }
    });

    // Group by series for easier frontend rendering
    var seriesMap = {};
    modules.forEach(function(m) {
      var sn = m.seriesName || 'Uncategorized';
      if (!seriesMap[sn]) seriesMap[sn] = [];
      seriesMap[sn].push(m);
    });

    // Sort within each series by seriesOrder
    Object.keys(seriesMap).forEach(function(sn) {
      seriesMap[sn].sort(function(a, b) { return (a.seriesOrder || 0) - (b.seriesOrder || 0); });
    });

    // Build watching list (in-progress modules)
    var watching = modules.filter(function(m) {
      return watchingIds.indexOf(String(m.id)) !== -1 && !m.completed;
    });

    return res.status(200).json({
      modules: modules,
      series: seriesMap,
      watching: watching,
      completedCount: completedIds.length
    });
  } catch (err) {
    console.error('client modules GET error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
