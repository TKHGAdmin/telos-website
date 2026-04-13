var { redis } = require('../lib/redis');
var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch progress for a module (or all)
  if (req.method === 'GET') {
    try {
      var moduleId = req.query.moduleId;
      if (moduleId) {
        var raw = await redis('GET', 'client_module_progress:' + clientId + ':' + moduleId);
        return res.status(200).json({ progress: raw ? JSON.parse(raw) : null });
      }

      // Return summary: watching + completed counts
      var watching = await redis('ZCARD', 'client_modules_watching:' + clientId) || 0;
      var completed = await redis('ZCARD', 'client_modules_completed:' + clientId) || 0;
      return res.status(200).json({ watching: watching, completed: completed });
    } catch (err) {
      console.error('module-progress GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - update watch progress
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.moduleId) {
        return res.status(400).json({ error: 'moduleId required' });
      }

      var moduleId = body.moduleId;
      var key = 'client_module_progress:' + clientId + ':' + moduleId;
      var now = new Date().toISOString();

      // Fetch existing progress
      var existingRaw = await redis('GET', key);
      var progress = existingRaw ? JSON.parse(existingRaw) : {
        clientId: clientId,
        moduleId: moduleId,
        watchedSeconds: 0,
        totalSeconds: 0,
        completed: false,
        completedAt: null,
        lastWatchedAt: null
      };

      // Update fields
      if (body.watchedSeconds !== undefined) {
        progress.watchedSeconds = Math.max(progress.watchedSeconds, body.watchedSeconds);
      }
      if (body.totalSeconds !== undefined) {
        progress.totalSeconds = body.totalSeconds;
      }
      progress.lastWatchedAt = now;

      // Check for completion (90% watched or explicitly marked)
      var wasCompleted = progress.completed;
      if (body.completed === true) {
        progress.completed = true;
      } else if (progress.totalSeconds > 0 && progress.watchedSeconds >= progress.totalSeconds * 0.9) {
        progress.completed = true;
      }

      if (progress.completed && !wasCompleted) {
        progress.completedAt = now;
      }

      // Save progress
      var promises = [
        redis('SET', key, JSON.stringify(progress))
      ];

      if (progress.completed && !wasCompleted) {
        // Move from watching to completed
        promises.push(redis('ZREM', 'client_modules_watching:' + clientId, String(moduleId)));
        promises.push(redis('ZADD', 'client_modules_completed:' + clientId, Date.now(), String(moduleId)));
      } else if (!progress.completed) {
        // Add to watching if not already completed
        promises.push(redis('ZADD', 'client_modules_watching:' + clientId, Date.now(), String(moduleId)));
      }

      await Promise.all(promises);

      return res.status(200).json({ ok: true, progress: progress });
    } catch (err) {
      console.error('module-progress POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
