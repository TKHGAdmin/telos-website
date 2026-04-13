var { redis } = require('../lib/redis');
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
    var moduleId = req.query.id;
    if (!moduleId) {
      return res.status(400).json({ error: 'id query param required' });
    }

    // Fetch module and client in parallel
    var results = await Promise.all([
      redis('GET', 'course_module:' + moduleId),
      redis('GET', 'client:' + clientId),
      redis('GET', 'client_module_progress:' + clientId + ':' + moduleId)
    ]);

    var moduleRaw = results[0];
    var clientRaw = results[1];
    var progressRaw = results[2];

    if (!moduleRaw) {
      return res.status(404).json({ error: 'Module not found' });
    }
    if (!clientRaw) {
      return res.status(404).json({ error: 'Client not found' });
    }

    var mod = JSON.parse(moduleRaw);
    var client = JSON.parse(clientRaw);

    // Check tier access
    var clientTierLevel = tierLevel(client.tier);
    var minTier = 999;
    (mod.tierAccess || []).forEach(function(t) {
      var lvl = tierLevel(t);
      if (lvl < minTier) minTier = lvl;
    });

    if (clientTierLevel < minTier) {
      return res.status(403).json({
        error: 'Upgrade required',
        requiredTier: TIER_ORDER[minTier] || 'lifestyle_plus'
      });
    }

    // Check published
    if (mod.status !== 'published') {
      return res.status(404).json({ error: 'Module not available' });
    }

    // Attach progress
    var progress = progressRaw ? JSON.parse(progressRaw) : {
      watchedSeconds: 0,
      totalSeconds: mod.duration || 0,
      completed: false,
      completedAt: null,
      lastWatchedAt: null
    };

    // Find next module in series
    var nextModule = null;
    if (mod.seriesName) {
      var seriesIds = await redis('ZRANGE', 'course_series:' + mod.seriesName, 0, -1);
      if (seriesIds && seriesIds.length > 0) {
        var currentIdx = seriesIds.indexOf(String(mod.id));
        if (currentIdx !== -1 && currentIdx < seriesIds.length - 1) {
          var nextId = seriesIds[currentIdx + 1];
          var nextRaw = await redis('GET', 'course_module:' + nextId);
          if (nextRaw) {
            var nextMod = JSON.parse(nextRaw);
            if (nextMod.status === 'published') {
              nextModule = { id: nextMod.id, title: nextMod.title };
            }
          }
        }
      }
    }

    return res.status(200).json({
      module: mod,
      progress: progress,
      nextModule: nextModule
    });
  } catch (err) {
    console.error('client module GET error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
