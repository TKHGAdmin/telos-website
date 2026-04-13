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
    const { email, source } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const validSources = ['protein-calculator', 'hyrox-predictor'];
    if (!source || !validSources.includes(source)) {
      return res.status(400).json({ error: 'Valid source required' });
    }

    // Rate limit: max 10 submissions per IP per hour
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const rateLimitKey = `ratelimit:email:${ip}`;
    const count = await redis('INCR', rateLimitKey);
    if (count === 1) await redis('EXPIRE', rateLimitKey, 3600);
    if (count > 10) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const entry = {
      email,
      source,
      submittedAt: new Date().toISOString(),
      ip,
    };

    const timestamp = Date.now();
    const redisKey = `email_${source.replace('-', '_')}`;
    await redis('ZADD', redisKey, timestamp, JSON.stringify(entry));

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-email error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
