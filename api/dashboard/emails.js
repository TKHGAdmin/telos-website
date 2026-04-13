const { verifySession } = require('../lib/auth');
const { redis } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const source = req.query.source; // 'protein-calculator', 'hyrox-predictor', or undefined for all

    let emails = [];
    let total = 0;

    if (source === 'protein-calculator' || source === 'hyrox-predictor') {
      const key = `email_${source.replace('-', '_')}`;
      const raw = await redis('ZREVRANGE', key, offset, offset + limit - 1, 'WITHSCORES');
      for (let i = 0; i < raw.length; i += 2) {
        try { emails.push(JSON.parse(raw[i])); } catch (e) {}
      }
      total = await redis('ZCARD', key);
    } else {
      // Fetch from both sources and merge
      const [rawProtein, rawHyrox] = await Promise.all([
        redis('ZREVRANGE', 'email_protein_calculator', 0, -1, 'WITHSCORES'),
        redis('ZREVRANGE', 'email_hyrox_predictor', 0, -1, 'WITHSCORES'),
      ]);

      const all = [];
      for (let i = 0; i < rawProtein.length; i += 2) {
        try { all.push({ data: JSON.parse(rawProtein[i]), score: parseFloat(rawProtein[i + 1]) }); } catch (e) {}
      }
      for (let i = 0; i < rawHyrox.length; i += 2) {
        try { all.push({ data: JSON.parse(rawHyrox[i]), score: parseFloat(rawHyrox[i + 1]) }); } catch (e) {}
      }

      // Sort by timestamp descending
      all.sort((a, b) => b.score - a.score);
      total = all.length;
      emails = all.slice(offset, offset + limit).map((e) => e.data);
    }

    return res.status(200).json({ emails, total, limit, offset });
  } catch (err) {
    console.error('emails error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
