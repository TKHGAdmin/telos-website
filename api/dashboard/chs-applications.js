const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

const STATUSES = ['new', 'contacted', 'consultation', 'closed_won', 'closed_lost'];

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list applications (newest first), optional ?status= filter
  if (req.method === 'GET') {
    try {
      const ids = await redis('ZREVRANGE', 'chs_applications_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ applications: [], statuses: STATUSES, total: 0 });
      }

      const cmds = ids.map(function (id) { return ['GET', 'chs_application:' + id]; });
      const results = await redisPipeline(cmds);
      let applications = [];
      results.forEach(function (r) {
        if (r && r.result) {
          try { applications.push(JSON.parse(r.result)); } catch (e) {}
        }
      });

      const status = req.query.status;
      if (status && STATUSES.indexOf(status) > -1) {
        applications = applications.filter(function (a) { return a.status === status; });
      }

      return res.status(200).json({
        applications: applications,
        statuses: STATUSES,
        total: applications.length,
      });
    } catch (err) {
      console.error('chs-applications GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PATCH - update status and/or notes
  if (req.method === 'PATCH') {
    try {
      const body = req.body || {};
      if (!body.id) return res.status(400).json({ error: 'ID required' });

      const existing = await redis('GET', 'chs_application:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Application not found' });

      const application = JSON.parse(existing);
      if (body.status !== undefined && STATUSES.indexOf(body.status) > -1) {
        application.status = body.status;
      }
      if (body.notes !== undefined) {
        application.notes = String(body.notes).slice(0, 4000);
      }
      application.updatedAt = new Date().toISOString();

      await redis('SET', 'chs_application:' + body.id, JSON.stringify(application));
      return res.status(200).json({ ok: true, application: application });
    } catch (err) {
      console.error('chs-applications PATCH error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE - remove application
  if (req.method === 'DELETE') {
    try {
      const id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });
      await redis('DEL', 'chs_application:' + id);
      await redis('ZREM', 'chs_applications_index', id);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('chs-applications DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
