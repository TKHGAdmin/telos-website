var { verifySession } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var { del } = require('@vercel/blob');

    var url = (req.body && req.body.url) || req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'url required' });
    }

    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete-video error:', err);
    return res.status(500).json({ error: 'Delete failed: ' + (err.message || 'Unknown error') });
  }
};
