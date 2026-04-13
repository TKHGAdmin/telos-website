const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

const STAGES = ['new', 'contacted', 'consultation', 'proposal', 'closed_won', 'closed_lost'];

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list leads
  if (req.method === 'GET') {
    try {
      var ids = await redis('ZREVRANGE', 'leads_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ leads: [], stages: STAGES });
      }
      var cmds = ids.map(function(id) { return ['GET', 'lead:' + id]; });
      var results = await redisPipeline(cmds);
      var leads = [];
      results.forEach(function(r) {
        if (r.result) {
          try { leads.push(JSON.parse(r.result)); } catch(e) {}
        }
      });
      // Filter by stage if requested
      var stage = req.query.stage;
      if (stage && STAGES.indexOf(stage) > -1) {
        leads = leads.filter(function(l) { return l.stage === stage; });
      }
      return res.status(200).json({ leads: leads, stages: STAGES });
    } catch (err) {
      console.error('pipeline GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - create lead
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.name || !body.email) {
        return res.status(400).json({ error: 'Name and email required' });
      }
      var id = await redis('INCR', 'id:leads');
      var lead = {
        id: id,
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        stage: body.stage || 'new',
        source: body.source || 'manual',
        quizScore: body.quizScore || null,
        notes: body.notes || '',
        followUpDate: body.followUpDate || '',
        value: body.value || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await redis('SET', 'lead:' + id, JSON.stringify(lead));
      await redis('ZADD', 'leads_index', Date.now(), String(id));
      return res.status(200).json({ ok: true, lead: lead });
    } catch (err) {
      console.error('pipeline POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update lead
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.id) return res.status(400).json({ error: 'ID required' });
      var existing = await redis('GET', 'lead:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Lead not found' });
      var lead = JSON.parse(existing);
      if (body.name !== undefined) lead.name = body.name;
      if (body.email !== undefined) lead.email = body.email;
      if (body.phone !== undefined) lead.phone = body.phone;
      if (body.stage !== undefined && STAGES.indexOf(body.stage) > -1) lead.stage = body.stage;
      if (body.notes !== undefined) lead.notes = body.notes;
      if (body.followUpDate !== undefined) lead.followUpDate = body.followUpDate;
      if (body.value !== undefined) lead.value = body.value;
      lead.updatedAt = new Date().toISOString();
      await redis('SET', 'lead:' + body.id, JSON.stringify(lead));
      return res.status(200).json({ ok: true, lead: lead });
    } catch (err) {
      console.error('pipeline PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE - remove lead
  if (req.method === 'DELETE') {
    try {
      var id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });
      await redis('DEL', 'lead:' + id);
      await redis('ZREM', 'leads_index', String(id));
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('pipeline DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
