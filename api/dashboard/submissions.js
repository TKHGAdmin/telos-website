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

    // Get submissions newest-first with scores
    const raw = await redis('ZREVRANGE', 'quiz_submissions', offset, offset + limit - 1, 'WITHSCORES');

    // raw comes back as [member, score, member, score, ...]
    const submissions = [];
    for (let i = 0; i < raw.length; i += 2) {
      try {
        const data = JSON.parse(raw[i]);
        submissions.push(data);
      } catch (e) {
        // skip malformed entries
      }
    }

    const total = await redis('ZCARD', 'quiz_submissions');

    return res.status(200).json({ submissions, total, limit, offset });
  } catch (err) {
    console.error('submissions error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
