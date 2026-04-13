const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list content
  if (req.method === 'GET') {
    try {
      var ids = await redis('ZREVRANGE', 'content_index', 0, -1);
      if (!ids || ids.length === 0) {
        return res.status(200).json({ content: [] });
      }
      var cmds = ids.map(function(id) { return ['GET', 'content:' + id]; });
      var results = await redisPipeline(cmds);
      var content = [];
      results.forEach(function(r) {
        if (r.result) {
          try { content.push(JSON.parse(r.result)); } catch(e) {}
        }
      });

      var status = req.query.status;
      if (status) {
        content = content.filter(function(c) { return c.status === status; });
      }

      // Sort by scheduled date
      content.sort(function(a, b) {
        var da = new Date(a.scheduledDate || a.createdAt);
        var db = new Date(b.scheduledDate || b.createdAt);
        return da - db;
      });

      return res.status(200).json({ content: content });
    } catch (err) {
      console.error('content GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - create content
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (!body.caption) {
        return res.status(400).json({ error: 'Caption required' });
      }
      var id = await redis('INCR', 'id:content');
      var item = {
        id: id,
        platform: body.platform || 'instagram',
        type: body.type || 'post',
        caption: body.caption,
        imageUrl: body.imageUrl || '',
        scheduledDate: body.scheduledDate || '',
        status: body.status || 'draft',
        hashtags: body.hashtags || '',
        notes: body.notes || '',
        createdAt: new Date().toISOString()
      };
      await redis('SET', 'content:' + id, JSON.stringify(item));
      var score = item.scheduledDate ? new Date(item.scheduledDate).getTime() : Date.now();
      await redis('ZADD', 'content_index', score, String(id));
      return res.status(200).json({ ok: true, content: item });
    } catch (err) {
      console.error('content POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // PUT - update content
  if (req.method === 'PUT') {
    try {
      var body = req.body;
      if (!body.id) return res.status(400).json({ error: 'ID required' });
      var existing = await redis('GET', 'content:' + body.id);
      if (!existing) return res.status(404).json({ error: 'Content not found' });
      var item = JSON.parse(existing);
      if (body.platform !== undefined) item.platform = body.platform;
      if (body.type !== undefined) item.type = body.type;
      if (body.caption !== undefined) item.caption = body.caption;
      if (body.imageUrl !== undefined) item.imageUrl = body.imageUrl;
      if (body.scheduledDate !== undefined) item.scheduledDate = body.scheduledDate;
      if (body.status !== undefined) item.status = body.status;
      if (body.hashtags !== undefined) item.hashtags = body.hashtags;
      if (body.notes !== undefined) item.notes = body.notes;
      item.updatedAt = new Date().toISOString();
      await redis('SET', 'content:' + body.id, JSON.stringify(item));
      return res.status(200).json({ ok: true, content: item });
    } catch (err) {
      console.error('content PUT error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    try {
      var id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'ID required' });
      await redis('DEL', 'content:' + id);
      await redis('ZREM', 'content_index', String(id));
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('content DELETE error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
