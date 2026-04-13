const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

var TIERS = {
  rebuild: { name: 'Rebuild', rate: 1497 },
  growth: { name: 'Growth', rate: 1997 },
  lifestyle: { name: 'Lifestyle', rate: 2497 },
  lifestyle_plus: { name: 'Lifestyle+', rate: 6997 }
};

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list clients
  if (req.method === 'GET') {
    try {
      var ids = await redis('ZREVRANGE', 'clients_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ clients: [], tiers: TIERS });
      }
      var cmds = ids.map(function(id) { return ['GET', 'client:' + id]; });
      var results = await redisPipeline(cmds);
      var clients = [];
      results.forEach(function(r) {
        if (r.result) {
          try { clients.push(JSON.parse(r.result)); } catch(e) {}
        }
      });

      var status = req.query.status;
      if (status) {
        clients = clients.filter(function(c) { return c.status === status; });
      }
      var tier = req.query.tier;
      if (tier) {
        clients = clients.filter(function(c) { return c.tier === tier; });
      }

      // Calculate MRR from active clients
      var mrr = 0;
      var activeCount = 0;
      clients.forEach(function(c) {
        if (c.status === 'active') {
          mrr += c.monthlyRate || 0;
          activeCount++;
        }
      });

      return res.status(200).json({ clients: clients, tiers: TIERS, mrr: mrr, activeCount: activeCount });
    } catch (err) {
      console.error('clients GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - create client
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.name || !body.email || !body.tier) {
        return res.status(400).json({ error: 'Name, email, and tier required' });
      }
      var tierInfo = TIERS[body.tier];
      if (!tierInfo) return res.status(400).json({ error: 'Invalid tier' });

      var { normalizeEmail } = require('../lib/client-auth');
      var normalized = normalizeEmail(body.email);
      var existingEmailOwner = await redis('GET', 'client_email:' + normalized);
      if (existingEmailOwner) {
        return res.status(400).json({ error: 'Email already in use by another client' });
      }

      var id = await redis('INCR', 'id:clients');
      var client = {
        id: id,
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        tier: body.tier,
        tierName: tierInfo.name,
        monthlyRate: body.monthlyRate || tierInfo.rate,
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        status: body.status || 'active',
        notes: body.notes || '',
        source: body.source || 'manual',
        createdAt: new Date().toISOString()
      };
      await redis('SET', 'client:' + id, JSON.stringify(client));
      await redis('ZADD', 'clients_index', Date.now(), String(id));
      return res.status(200).json({ ok: true, client: client });
    } catch (err) {
      console.error('clients POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update client
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.id) return res.status(400).json({ error: 'ID required' });
      var existing = await redis('GET', 'client:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Client not found' });
      var client = JSON.parse(existing);
      if (body.name !== undefined) client.name = body.name;
      if (body.email !== undefined) client.email = body.email;
      if (body.phone !== undefined) client.phone = body.phone;
      if (body.tier !== undefined && TIERS[body.tier]) {
        client.tier = body.tier;
        client.tierName = TIERS[body.tier].name;
        if (!body.monthlyRate) client.monthlyRate = TIERS[body.tier].rate;
      }
      if (body.monthlyRate !== undefined) client.monthlyRate = body.monthlyRate;
      if (body.status !== undefined) client.status = body.status;
      if (body.notes !== undefined) client.notes = body.notes;
      if (body.startDate !== undefined) client.startDate = body.startDate;
      if (body.everfitUrl !== undefined) client.everfitUrl = body.everfitUrl;
      // Handle email change: update email lookup if portal is enabled
      if (body.email !== undefined && body.email !== JSON.parse(existing).email && client.portalEnabled) {
        var { normalizeEmail } = require('../lib/client-auth');
        var newNorm = normalizeEmail(body.email);
        var emailOwner = await redis('GET', 'client_email:' + newNorm);
        if (emailOwner && String(emailOwner) !== String(client.id)) {
          return res.status(400).json({ error: 'Email already in use by another client' });
        }
        var oldEmail = normalizeEmail(JSON.parse(existing).email);
        var newEmail = normalizeEmail(body.email);
        if (oldEmail) await redis('DEL', 'client_email:' + oldEmail);
        if (newEmail) await redis('SET', 'client_email:' + newEmail, String(client.id));
      }
      client.updatedAt = new Date().toISOString();
      await redis('SET', 'client:' + body.id, JSON.stringify(client));
      return res.status(200).json({ ok: true, client: client });
    } catch (err) {
      console.error('clients PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE - remove client
  if (req.method === 'DELETE') {
    try {
      var id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });
      await redis('DEL', 'client:' + id);
      await redis('ZREM', 'clients_index', String(id));
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('clients DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
