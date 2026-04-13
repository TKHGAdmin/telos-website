var { verifySession } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var { put } = require('@vercel/blob');

    var contentType = req.headers['content-type'] || '';
    var filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ error: 'filename query param required' });
    }

    // Validate file type
    var allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];
    var fileType = req.query.type || contentType;
    var isAllowed = allowedTypes.some(function(t) { return fileType.indexOf(t) !== -1; });
    if (!isAllowed && !filename.match(/\.(mp4|webm|mov|jpg|jpeg|png|webp)$/i)) {
      return res.status(400).json({ error: 'File type not allowed. Accepted: mp4, webm, mov, jpg, png, webp' });
    }

    var blob = await put('courses/' + filename, req, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: fileType || undefined
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size
    });
  } catch (err) {
    console.error('upload-video error:', err);
    return res.status(500).json({ error: 'Upload failed: ' + (err.message || 'Unknown error') });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
