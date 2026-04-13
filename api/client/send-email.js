var { verifySession } = require('../lib/auth');
var { redis, redisPipeline } = require('../lib/redis');

var RESEND_API_KEY = process.env.RESEND_API_KEY;
var SITE_URL = process.env.SITE_URL || 'https://www.telosathleticclub.com';

// Admin-triggered email to client(s)
module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    var body = req.body;
    var template = body.template || 'custom';
    var clientId = body.clientId;

    // If clientId provided, send to that client
    if (clientId) {
      var clientRaw = await redis('GET', 'client:' + clientId);
      if (!clientRaw) return res.status(404).json({ error: 'Client not found' });
      var client = JSON.parse(clientRaw);

      // Check if client has email notifications enabled (default true)
      if (client.emailEnabled === false) {
        return res.status(200).json({ ok: true, skipped: true, reason: 'Client has email notifications disabled' });
      }

      var emailHtml = buildEmail(template, client, body);
      var subject = buildSubject(template, body);

      await sendResendEmail(client.email, subject, emailHtml);
      return res.status(200).json({ ok: true });
    }

    // If no clientId, send to all active clients (for bulk emails like weekly summary)
    if (body.sendToAll) {
      var ids = await redis('ZRANGE', 'clients_index', 0, -1);
      if (!ids || ids.length === 0) return res.status(200).json({ ok: true, sent: 0 });

      var cmds = ids.map(function(id) { return ['GET', 'client:' + id]; });
      var results = await redisPipeline(cmds);

      var sent = 0;
      for (var i = 0; i < results.length; i++) {
        if (!results[i].result) continue;
        var client = JSON.parse(results[i].result);
        if (client.status !== 'active' || !client.portalEnabled) continue;
        if (client.emailEnabled === false) continue;
        if (!client.email) continue;

        var emailHtml = buildEmail(template, client, body);
        var subject = buildSubject(template, body);

        try {
          await sendResendEmail(client.email, subject, emailHtml);
          sent++;
        } catch(e) {
          console.error('Failed to send email to', client.email, e.message);
        }
      }
      return res.status(200).json({ ok: true, sent: sent });
    }

    return res.status(400).json({ error: 'clientId or sendToAll required' });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

function sendResendEmail(to, subject, html) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Telos Fitness <noreply@telosathleticclub.com>',
      to: [to],
      subject: subject,
      html: html
    })
  });
}

function buildSubject(template, body) {
  var subjects = {
    weekly_summary: 'Your Weekly Telos Recap',
    engagement_reminder: 'We miss you at Telos',
    new_content: 'New content available in your Telos portal',
    streak_break: 'Your streak needs attention',
    custom: body.subject || 'Message from Telos Fitness'
  };
  return subjects[template] || subjects.custom;
}

function buildEmail(template, client, body) {
  var firstName = (client.name || '').split(' ')[0] || 'there';
  var wrap = function(content) {
    return '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#F2EFE9;background:#080808;">' +
      '<div style="text-align:center;margin-bottom:24px;"><span style="font-size:24px;letter-spacing:4px;color:#C9A84C;font-weight:bold;">TELOS</span></div>' +
      content +
      '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #222;text-align:center;">' +
      '<a href="' + SITE_URL + '/client-dashboard" style="display:inline-block;background:#C9A84C;color:#080808;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Your Portal</a>' +
      '</div>' +
      '<p style="color:#666;font-size:11px;text-align:center;margin-top:24px;">Telos Fitness - telosathleticclub.com</p>' +
      '</div>';
  };

  if (template === 'weekly_summary') {
    var stats = body.stats || {};
    return wrap(
      '<p>Hi ' + firstName + ',</p>' +
      '<p>Here\'s your week in review:</p>' +
      '<div style="background:#111;border-radius:8px;padding:16px;margin:16px 0;">' +
      '<p style="margin:4px 0;">Execution Score: <strong style="color:#C9A84C;">' + (stats.avgScore || '-') + '%</strong></p>' +
      '<p style="margin:4px 0;">Streak: <strong style="color:#C9A84C;">' + (stats.streak || 0) + ' days</strong></p>' +
      '<p style="margin:4px 0;">Workouts: <strong>' + (stats.workouts || 0) + '</strong></p>' +
      '<p style="margin:4px 0;">Days Logged: <strong>' + (stats.daysLogged || 0) + '</strong></p>' +
      '</div>' +
      '<p>Keep pushing. Every day counts.</p>'
    );
  }

  if (template === 'engagement_reminder') {
    var daysSince = body.daysSince || 3;
    return wrap(
      '<p>Hi ' + firstName + ',</p>' +
      '<p>It\'s been ' + daysSince + ' days since your last check-in. Your consistency is what drives results.</p>' +
      '<p>Log in and get back on track today - even a quick check-in counts.</p>'
    );
  }

  if (template === 'new_content') {
    return wrap(
      '<p>Hi ' + firstName + ',</p>' +
      '<p>New content is available in your Telos portal' + (body.contentTitle ? ': <strong>' + body.contentTitle + '</strong>' : '') + '.</p>' +
      '<p>Head to the Learn tab to check it out.</p>'
    );
  }

  if (template === 'streak_break') {
    return wrap(
      '<p>Hi ' + firstName + ',</p>' +
      '<p>Your streak just broke. It happens - what matters is getting back to it.</p>' +
      '<p>Log in today and start building again.</p>'
    );
  }

  // Custom template
  return wrap(
    '<p>Hi ' + firstName + ',</p>' +
    '<div>' + (body.html || body.body || '') + '</div>'
  );
}
