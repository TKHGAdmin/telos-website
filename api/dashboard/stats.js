const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const results = await redisPipeline([
      ['ZCARD', 'quiz_submissions'],
      ['ZCARD', 'email_protein_calculator'],
      ['ZCARD', 'email_hyrox_predictor'],
      ['ZCOUNT', 'quiz_submissions', weekAgo, '+inf'],
      ['ZCOUNT', 'email_protein_calculator', weekAgo, '+inf'],
      ['ZCOUNT', 'email_hyrox_predictor', weekAgo, '+inf'],
      ['ZCOUNT', 'quiz_submissions', dayAgo, '+inf'],
      ['ZCOUNT', 'email_protein_calculator', dayAgo, '+inf'],
      ['ZCOUNT', 'email_hyrox_predictor', dayAgo, '+inf'],
    ]);

    const stats = {
      totalQuizSubmissions: results[0].result || 0,
      totalProteinEmails: results[1].result || 0,
      totalHyroxEmails: results[2].result || 0,
      quizThisWeek: results[3].result || 0,
      proteinEmailsThisWeek: results[4].result || 0,
      hyroxEmailsThisWeek: results[5].result || 0,
      quizToday: results[6].result || 0,
      proteinEmailsToday: results[7].result || 0,
      hyroxEmailsToday: results[8].result || 0,
    };

    stats.totalLeads = stats.totalQuizSubmissions + stats.totalProteinEmails + stats.totalHyroxEmails;
    stats.leadsThisWeek = stats.quizThisWeek + stats.proteinEmailsThisWeek + stats.hyroxEmailsThisWeek;
    stats.leadsToday = stats.quizToday + stats.proteinEmailsToday + stats.hyroxEmailsToday;

    return res.status(200).json(stats);
  } catch (err) {
    console.error('stats error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
