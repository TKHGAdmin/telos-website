const { redis } = require('./lib/redis');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, scores, totalScore, page } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Rate limit: max 10 submissions per IP per hour
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const rateLimitKey = `ratelimit:quiz:${ip}`;
    const count = await redis('INCR', rateLimitKey);
    if (count === 1) await redis('EXPIRE', rateLimitKey, 3600);
    if (count > 10) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const submission = {
      name,
      email,
      phone: phone || '',
      scores: scores || [],
      totalScore: totalScore || 0,
      page: page || '/',
      submittedAt: new Date().toISOString(),
      ip,
    };

    const timestamp = Date.now();
    const member = JSON.stringify(submission);
    await redis('ZADD', 'quiz_submissions', timestamp, member);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-quiz error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
