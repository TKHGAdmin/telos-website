var { verifySession } = require('../lib/auth');
var { redis } = require('../lib/redis');
var { hashPassword, normalizeEmail } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - portal status + content for a client
  if (req.method === 'GET') {
    try {
      var clientId = req.query.clientId;
      if (!clientId) return res.status(400).json({ error: 'clientId required' });

      var raw = await redis('GET', 'client:' + clientId);
      if (!raw) return res.status(404).json({ error: 'Client not found' });
      var client = JSON.parse(raw);

      // Fetch all portal content in parallel
      var keys = [
        'client_nutrition_plan:' + clientId,
        'client_mindset:' + clientId,
        'client_resources:' + clientId,
        'client_545_goals:' + clientId,
        'client_545_routine:' + clientId,
        'client_training_program:' + clientId,
        'client_sidemenu:' + clientId,
      ];
      var results = await Promise.all(keys.map(function (k) { return redis('GET', k); }));

      var response = {
        portalEnabled: client.portalEnabled || false,
        passwordSetAt: client.passwordSetAt || null,
        nutritionPlan: results[0] ? JSON.parse(results[0]) : null,
        mindset: results[1] ? JSON.parse(results[1]) : null,
        resources: results[2] ? JSON.parse(results[2]) : null,
        ffsGoals: results[3] ? JSON.parse(results[3]) : null,
        ffsRoutine: results[4] ? JSON.parse(results[4]) : null,
        trainingProgram: results[5] ? JSON.parse(results[5]) : null,
        sidemenuConfig: results[6] ? JSON.parse(results[6]) : null,
      };

      // Fetch client logs if requested
      if (req.query.logs === 'true') {
        var logs = [];
        var trainingLogs = [];
        var nutritionLogs = [];
        var now = Date.now();
        var cmds = [];
        var trainingCmds = [];
        var nutritionCmds = [];
        for (var i = 0; i < 30; i++) {
          var d = new Date(now - i * 86400000).toISOString().split('T')[0];
          cmds.push(['GET', 'client_dailylog:' + clientId + ':' + d]);
          trainingCmds.push(['GET', 'client_training_log:' + clientId + ':' + d]);
          nutritionCmds.push(['GET', 'client_nutrition_log:' + clientId + ':' + d]);
        }
        var { redisPipeline } = require('../lib/redis');
        var allResults = await Promise.all([
          redisPipeline(cmds),
          redisPipeline(trainingCmds),
          redisPipeline(nutritionCmds)
        ]);
        allResults[0].forEach(function(r) {
          if (r.result) { try { logs.push(JSON.parse(r.result)); } catch(e) {} }
        });
        allResults[1].forEach(function(r) {
          if (r.result) { try { trainingLogs.push(JSON.parse(r.result)); } catch(e) {} }
        });
        allResults[2].forEach(function(r) {
          if (r.result) { try { nutritionLogs.push(JSON.parse(r.result)); } catch(e) {} }
        });
        response.logs = logs;
        response.trainingLogs = trainingLogs;
        response.nutritionLogs = nutritionLogs;
      }

      return res.status(200).json(response);
    } catch (err) {
      console.error('client-portal GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - enable portal / set password
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.clientId) return res.status(400).json({ error: 'clientId required' });

      var raw = await redis('GET', 'client:' + body.clientId);
      if (!raw) return res.status(404).json({ error: 'Client not found' });
      var client = JSON.parse(raw);

      // Set password if provided
      if (body.password) {
        if (body.password.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        var hashed = hashPassword(body.password);
        client.passwordHash = hashed.hash;
        client.passwordSalt = hashed.salt;
        client.passwordSetAt = new Date().toISOString();
      }

      // Enable/disable portal
      if (body.enabled !== undefined) {
        client.portalEnabled = !!body.enabled;
      }

      // Create/update email lookup
      if (client.portalEnabled && client.email) {
        var email = normalizeEmail(client.email);
        await redis('SET', 'client_email:' + email, String(client.id));
      }

      // Disable: remove email lookup
      if (body.enabled === false && client.email) {
        var email = normalizeEmail(client.email);
        await redis('DEL', 'client_email:' + email);
      }

      await redis('SET', 'client:' + body.clientId, JSON.stringify(client));
      return res.status(200).json({
        ok: true,
        portalEnabled: client.portalEnabled,
        passwordSetAt: client.passwordSetAt,
      });
    } catch (err) {
      console.error('client-portal POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update client portal content (nutrition, mindset, resources)
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.clientId) return res.status(400).json({ error: 'clientId required' });

      var promises = [];

      if (body.nutritionPlan !== undefined) {
        var data = body.nutritionPlan;
        data.clientId = body.clientId;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = 'coach';
        promises.push(redis('SET', 'client_nutrition_plan:' + body.clientId, JSON.stringify(data)));
      }

      if (body.mindset !== undefined) {
        var data = body.mindset;
        data.clientId = body.clientId;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = 'coach';
        promises.push(redis('SET', 'client_mindset:' + body.clientId, JSON.stringify(data)));
      }

      if (body.resources !== undefined) {
        var data = body.resources;
        data.clientId = body.clientId;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = 'coach';
        promises.push(redis('SET', 'client_resources:' + body.clientId, JSON.stringify(data)));
      }

      if (body.trainingProgram !== undefined) {
        var data = body.trainingProgram;
        data.clientId = body.clientId;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = 'coach';
        promises.push(redis('SET', 'client_training_program:' + body.clientId, JSON.stringify(data)));
      }

      if (body.sidemenuConfig !== undefined) {
        var data = body.sidemenuConfig;
        data.clientId = body.clientId;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = 'coach';
        promises.push(redis('SET', 'client_sidemenu:' + body.clientId, JSON.stringify(data)));
      }

      await Promise.all(promises);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('client-portal PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
