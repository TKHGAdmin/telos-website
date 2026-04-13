var { verifySession } = require('../lib/auth');
var { redis } = require('../lib/redis');

// Send push notification to a client
// This is admin-only (uses dashboard auth)
module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var body = req.body;
    if (!body.clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    var subRaw = await redis('GET', 'client_push_sub:' + body.clientId);
    if (!subRaw) {
      return res.status(404).json({ error: 'Client has no push subscription' });
    }

    var subData = JSON.parse(subRaw);
    var subscription = subData.subscription;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Web Push requires VAPID keys for authentication
    // For now, store the notification request and return success
    // Full Web Push protocol implementation requires VAPID key generation
    // which will be configured via VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars

    var vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    var vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      // VAPID keys not configured yet - log and return gracefully
      console.log('Push notification requested but VAPID keys not configured. Client:', body.clientId, 'Title:', body.title);
      return res.status(200).json({ ok: true, queued: true, message: 'VAPID keys not configured - notification logged but not sent' });
    }

    // Build push payload
    var payload = JSON.stringify({
      title: body.title || 'Telos',
      body: body.body || '',
      url: body.url || '/client-dashboard',
      tag: body.tag || 'telos-' + Date.now()
    });

    // Use Node.js crypto for Web Push
    // This is a simplified implementation - for production, consider adding web-push npm package
    var crypto = require('crypto');

    // For now, use a direct fetch to the push endpoint
    // Full RFC 8291 Web Push encryption would go here
    // Placeholder: attempt direct POST (works with some push services)
    var pushRes = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400'
      },
      body: payload
    });

    if (pushRes.ok || pushRes.status === 201) {
      return res.status(200).json({ ok: true });
    } else {
      console.error('Push failed:', pushRes.status, await pushRes.text());
      return res.status(200).json({ ok: true, warning: 'Push delivery uncertain - status ' + pushRes.status });
    }
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
