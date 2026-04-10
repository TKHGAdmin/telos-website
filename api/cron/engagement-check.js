var { redis, redisPipeline } = require('../lib/redis');

var RESEND_API_KEY = process.env.RESEND_API_KEY;
var SITE_URL = process.env.SITE_URL || 'https://www.telosathleticclub.com';

// Cron: runs daily - checks for inactive clients and sends engagement reminders
module.exports = async function handler(req, res) {
  // Verify cron secret (Vercel sends this automatically for scheduled runs)
  if (!process.env.CRON_SECRET || req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!RESEND_API_KEY) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  try {
    var ids = await redis('ZRANGE', 'clients_index', 0, -1);
    if (!ids || ids.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, checked: 0 });
    }

    var cmds = ids.map(function(id) { return ['GET', 'client:' + id]; });
    var results = await redisPipeline(cmds);
    var clients = [];
    results.forEach(function(r) {
      if (r.result) {
        try { clients.push(JSON.parse(r.result)); } catch(e) {}
      }
    });

    var sent = 0;
    var checked = 0;
    var now = Date.now();

    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      if (client.status !== 'active' || !client.portalEnabled) continue;
      if (client.emailEnabled === false) continue;
      if (!client.email) continue;
      checked++;

      // Check last 5 days of daily logs
      var logCmds = [];
      for (var d = 0; d < 5; d++) {
        var dateStr = new Date(now - d * 86400000).toISOString().split('T')[0];
        logCmds.push(['GET', 'client_dailylog:' + client.id + ':' + dateStr]);
      }
      var logResults = await redisPipeline(logCmds);

      // Find most recent log
      var lastLogDaysAgo = -1;
      for (var d = 0; d < 5; d++) {
        if (logResults[d] && logResults[d].result) {
          lastLogDaysAgo = d;
          break;
        }
      }

      // Send reminder if inactive for 3+ days
      if (lastLogDaysAgo === -1 || lastLogDaysAgo >= 3) {
        var daysSince = lastLogDaysAgo === -1 ? 5 : lastLogDaysAgo;
        var firstName = (client.name || '').split(' ')[0] || 'there';

        var emailHtml = '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#F2EFE9;background:#080808;">' +
          '<div style="text-align:center;margin-bottom:24px;"><span style="font-size:24px;letter-spacing:4px;color:#C9A84C;font-weight:bold;">TELOS</span></div>' +
          '<p>Hi ' + firstName + ',</p>' +
          '<p>It\'s been ' + daysSince + '+ days since your last check-in. Your consistency is what drives results.</p>' +
          '<p>Log in and get back on track today - even a quick check-in counts.</p>' +
          '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #222;text-align:center;">' +
          '<a href="' + SITE_URL + '/client-dashboard" style="display:inline-block;background:#C9A84C;color:#080808;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Your Portal</a>' +
          '</div>' +
          '<p style="color:#666;font-size:11px;text-align:center;margin-top:24px;">Telos Fitness - telosathleticclub.com</p>' +
          '</div>';

        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + RESEND_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Telos Fitness <noreply@telosathleticclub.com>',
              to: [client.email],
              subject: 'We miss you at Telos',
              html: emailHtml
            })
          });
          sent++;
        } catch(e) {
          console.error('Failed to send engagement email to', client.email, e.message);
        }
      }
    }

    return res.status(200).json({ ok: true, checked: checked, sent: sent });
  } catch (err) {
    console.error('engagement-check cron error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
