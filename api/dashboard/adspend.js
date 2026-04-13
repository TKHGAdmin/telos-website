const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list ad spend entries
  if (req.method === 'GET') {
    try {
      var ids = await redis('ZREVRANGE', 'adspend_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ entries: [], summary: { totalSpend: 0, totalLeads: 0, avgCPA: 0 } });
      }
      var cmds = ids.map(function(id) { return ['GET', 'adspend:' + id]; });
      var results = await redisPipeline(cmds);
      var entries = [];
      var totalSpend = 0;
      var totalLeads = 0;
      var totalClicks = 0;
      var totalImpressions = 0;
      results.forEach(function(r) {
        if (r.result) {
          try {
            var entry = JSON.parse(r.result);
            entries.push(entry);
            totalSpend += entry.spend || 0;
            totalLeads += entry.leads || 0;
            totalClicks += entry.clicks || 0;
            totalImpressions += entry.impressions || 0;
          } catch(e) {}
        }
      });

      var summary = {
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalLeads: totalLeads,
        totalClicks: totalClicks,
        totalImpressions: totalImpressions,
        avgCPA: totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0,
        avgCPC: totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0,
        ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
      };

      return res.status(200).json({ entries: entries, summary: summary });
    } catch (err) {
      console.error('adspend GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - log ad spend
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.date || body.spend === undefined) {
        return res.status(400).json({ error: 'Date and spend required' });
      }
      var id = await redis('INCR', 'id:adspend');
      var entry = {
        id: id,
        date: body.date,
        platform: body.platform || 'meta',
        campaignName: body.campaignName || '',
        spend: parseFloat(body.spend) || 0,
        impressions: parseInt(body.impressions) || 0,
        clicks: parseInt(body.clicks) || 0,
        leads: parseInt(body.leads) || 0,
        notes: body.notes || '',
        createdAt: new Date().toISOString()
      };
      await redis('SET', 'adspend:' + id, JSON.stringify(entry));
      var score = new Date(body.date).getTime() || Date.now();
      await redis('ZADD', 'adspend_index', score, String(id));
      return res.status(200).json({ ok: true, entry: entry });
    } catch (err) {
      console.error('adspend POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update entry
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.id) return res.status(400).json({ error: 'ID required' });
      var existing = await redis('GET', 'adspend:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Entry not found' });
      var entry = JSON.parse(existing);
      if (body.date !== undefined) entry.date = body.date;
      if (body.platform !== undefined) entry.platform = body.platform;
      if (body.campaignName !== undefined) entry.campaignName = body.campaignName;
      if (body.spend !== undefined) entry.spend = parseFloat(body.spend) || 0;
      if (body.impressions !== undefined) entry.impressions = parseInt(body.impressions) || 0;
      if (body.clicks !== undefined) entry.clicks = parseInt(body.clicks) || 0;
      if (body.leads !== undefined) entry.leads = parseInt(body.leads) || 0;
      if (body.notes !== undefined) entry.notes = body.notes;
      entry.updatedAt = new Date().toISOString();
      await redis('SET', 'adspend:' + body.id, JSON.stringify(entry));
      return res.status(200).json({ ok: true, entry: entry });
    } catch (err) {
      console.error('adspend PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    try {
      var id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });
      await redis('DEL', 'adspend:' + id);
      await redis('ZREM', 'adspend_index', String(id));
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('adspend DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
