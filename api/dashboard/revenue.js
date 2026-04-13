const { verifySession } = require('../lib/auth');
const { redis, redisPipeline } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (!verifySession(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - revenue overview
  if (req.method === 'GET') {
    try {
      // Get all active clients for MRR
      var clientIds = await redis('ZREVRANGE', 'clients_index', 0, -1);
      var clients = [];
      if (clientIds && clientIds.length > 0) {
        var cmds = clientIds.map(function(id) { return ['GET', 'client:' + id]; });
        var results = await redisPipeline(cmds);
        results.forEach(function(r) {
          if (r.result) {
            try { clients.push(JSON.parse(r.result)); } catch(e) {}
          }
        });
      }

      var mrr = 0;
      var activeClients = 0;
      var tierBreakdown = {};
      clients.forEach(function(c) {
        if (c.status === 'active') {
          mrr += c.monthlyRate || 0;
          activeClients++;
          var t = c.tier || 'unknown';
          if (!tierBreakdown[t]) tierBreakdown[t] = { count: 0, revenue: 0 };
          tierBreakdown[t].count++;
          tierBreakdown[t].revenue += c.monthlyRate || 0;
        }
      });

      // Get revenue goal
      var goal = await redis('GET', 'revenue_goal');
      goal = goal ? parseInt(goal) : 100000;

      // Get pipeline value
      var leadIds = await redis('ZREVRANGE', 'leads_index', 0, -1);
      var pipelineValue = 0;
      var pipelineCount = 0;
      if (leadIds && leadIds.length > 0) {
        var leadCmds = leadIds.map(function(id) { return ['GET', 'lead:' + id]; });
        var leadResults = await redisPipeline(leadCmds);
        leadResults.forEach(function(r) {
          if (r.result) {
            try {
              var lead = JSON.parse(r.result);
              if (lead.stage !== 'closed_won' && lead.stage !== 'closed_lost') {
                pipelineValue += lead.value || 0;
                pipelineCount++;
              }
            } catch(e) {}
          }
        });
      }

      // Get ad spend for current month
      var now = new Date();
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      var adIds = await redis('ZRANGEBYSCORE', 'adspend_index', monthStart, '+inf');
      var monthlyAdSpend = 0;
      if (adIds && adIds.length > 0) {
        var adCmds = adIds.map(function(id) { return ['GET', 'adspend:' + id]; });
        var adResults = await redisPipeline(adCmds);
        adResults.forEach(function(r) {
          if (r.result) {
            try {
              var ad = JSON.parse(r.result);
              monthlyAdSpend += ad.spend || 0;
            } catch(e) {}
          }
        });
      }

      // Average client value
      var avgClientValue = activeClients > 0 ? Math.round(mrr / activeClients) : 0;

      // Clients needed for goal
      var clientsNeeded = avgClientValue > 0 ? Math.ceil((goal - mrr) / avgClientValue) : 0;
      if (clientsNeeded < 0) clientsNeeded = 0;

      return res.status(200).json({
        mrr: mrr,
        goal: goal,
        goalProgress: goal > 0 ? Math.round((mrr / goal) * 100) : 0,
        activeClients: activeClients,
        avgClientValue: avgClientValue,
        clientsNeeded: clientsNeeded,
        pipelineValue: pipelineValue,
        pipelineCount: pipelineCount,
        monthlyAdSpend: monthlyAdSpend,
        tierBreakdown: tierBreakdown,
        totalClients: clients.length
      });
    } catch (err) {
      console.error('revenue GET error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // POST - set revenue goal
  if (req.method === 'POST') {
    try {
      var body = req.body;
      if (body.goal !== undefined) {
        await redis('SET', 'revenue_goal', String(body.goal));
        return res.status(200).json({ ok: true, goal: body.goal });
      }
      return res.status(400).json({ error: 'Goal value required' });
    } catch (err) {
      console.error('revenue POST error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
