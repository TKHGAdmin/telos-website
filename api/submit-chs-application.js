const crypto = require('crypto');
const { redis } = require('./lib/redis');

const VALID_SERVICES = ['private', 'semi-private', 'mobile', 'event', 'corporate'];

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
    const body = req.body || {};
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const goals = (body.goals || '').trim();
    const history = (body.history || '').trim();
    const availability = (body.availability || '').trim();
    const services = Array.isArray(body.services)
      ? body.services.filter(function (s) { return VALID_SERVICES.indexOf(s) > -1; })
      : [];

    if (!name || !email || !phone || !goals || !history || !availability) {
      return res.status(400).json({ ok: false, error: 'All fields are required' });
    }

    // Simple email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid email' });
    }

    // Rate limit: max 5 applications per IP per hour
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const rateLimitKey = `ratelimit:chs:${ip}`;
    const count = await redis('INCR', rateLimitKey);
    if (count === 1) await redis('EXPIRE', rateLimitKey, 3600);
    if (count > 5) {
      return res.status(429).json({ ok: false, error: 'Too many requests' });
    }

    const id = `chs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const application = {
      id,
      name,
      email,
      phone,
      goals,
      history,
      availability,
      services,
      source: 'chs-landing',
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ip,
    };

    await redis('SET', `chs_application:${id}`, JSON.stringify(application));
    await redis('ZADD', 'chs_applications_index', Date.now(), id);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('submit-chs-application error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
};
