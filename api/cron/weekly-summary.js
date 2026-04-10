var { redis, redisPipeline } = require('../lib/redis');

var RESEND_API_KEY = process.env.RESEND_API_KEY;
var SITE_URL = process.env.SITE_URL || 'https://www.telosathleticclub.com';

// Cron: runs weekly (Monday 9am ET) - sends each active client a weekly summary
module.exports = async function handler(req, res) {
  // Verify cron secret (Vercel sends this automatically for scheduled runs)
  if (!process.env.CRON_SECRET || req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!RESEND_API_KEY) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  try {
    // Get all active clients
    var ids = await redis('ZRANGE', 'clients_index', 0, -1);
    if (!ids || ids.length === 0) {
      return res.status(200).json({ ok: true, sent: 0 });
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
    var now = Date.now();

    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      if (client.status !== 'active' || !client.portalEnabled) continue;
      if (client.emailEnabled === false) continue;
      if (!client.email) continue;

      // Fetch last 7 days of data for this client
      var logCmds = [];
      var trainingCmds = [];
      var ffsCmds = [];
      for (var d = 0; d < 7; d++) {
        var dateStr = new Date(now - d * 86400000).toISOString().split('T')[0];
        logCmds.push(['GET', 'client_dailylog:' + client.id + ':' + dateStr]);
        trainingCmds.push(['GET', 'client_training_log:' + client.id + ':' + dateStr]);
        ffsCmds.push(['GET', 'client_545_daily:' + client.id + ':' + dateStr]);
      }

      var weekData = await Promise.all([
        redisPipeline(logCmds),
        redisPipeline(trainingCmds),
        redisPipeline(ffsCmds)
      ]);

      var daysLogged = 0;
      var workouts = 0;
      var execScores = [];
      var streak = 0;

      for (var d = 0; d < 7; d++) {
        var hasLog = weekData[0][d] && weekData[0][d].result;
        var hasTraining = weekData[1][d] && weekData[1][d].result;
        var hasFfs = weekData[2][d] && weekData[2][d].result;

        if (hasLog) daysLogged++;
        if (hasTraining) workouts++;

        // Calculate execution score for the day
        var dayScore = 0;
        if (hasFfs) {
          try {
            var ffs = JSON.parse(weekData[2][d].result);
            if (ffs.routineCompleted) dayScore += 25;
            (ffs.tasks || []).forEach(function(t) { if (t.completed) dayScore += 10; });
          } catch(e) {}
        }
        if (hasLog) dayScore += 25;
        dayScore = Math.min(100, dayScore);
        execScores.push(dayScore);
      }

      // Count streak (from today backwards)
      for (var d = 0; d < 7; d++) {
        if (weekData[0][d] && weekData[0][d].result) streak++;
        else break;
      }

      var avgScore = execScores.length > 0 ? Math.round(execScores.reduce(function(a, b) { return a + b; }, 0) / execScores.length) : 0;

      var firstName = (client.name || '').split(' ')[0] || 'there';
      var emailHtml = buildWeeklySummary(firstName, { avgScore: avgScore, streak: streak, workouts: workouts, daysLogged: daysLogged });

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
            subject: 'Your Weekly Telos Recap',
            html: emailHtml
          })
        });
        sent++;
      } catch(e) {
        console.error('Failed to send weekly summary to', client.email, e.message);
      }
    }

    return res.status(200).json({ ok: true, sent: sent });
  } catch (err) {
    console.error('weekly-summary cron error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

function buildWeeklySummary(firstName, stats) {
  return '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#F2EFE9;background:#080808;">' +
    '<div style="text-align:center;margin-bottom:24px;"><span style="font-size:24px;letter-spacing:4px;color:#C9A84C;font-weight:bold;">TELOS</span></div>' +
    '<p>Hi ' + firstName + ',</p>' +
    '<p>Here\'s your week in review:</p>' +
    '<div style="background:#111;border-radius:8px;padding:16px;margin:16px 0;">' +
    '<p style="margin:4px 0;">Avg Execution Score: <strong style="color:#C9A84C;">' + stats.avgScore + '%</strong></p>' +
    '<p style="margin:4px 0;">Current Streak: <strong style="color:#C9A84C;">' + stats.streak + ' days</strong></p>' +
    '<p style="margin:4px 0;">Workouts Completed: <strong>' + stats.workouts + '</strong></p>' +
    '<p style="margin:4px 0;">Days Logged: <strong>' + stats.daysLogged + ' / 7</strong></p>' +
    '</div>' +
    '<p>Keep pushing. Every day counts.</p>' +
    '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #222;text-align:center;">' +
    '<a href="' + SITE_URL + '/client-dashboard" style="display:inline-block;background:#C9A84C;color:#080808;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Your Portal</a>' +
    '</div>' +
    '<p style="color:#666;font-size:11px;text-align:center;margin-top:24px;">Telos Fitness - telosathleticclub.com</p>' +
    '</div>';
}
