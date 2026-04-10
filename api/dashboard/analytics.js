var https = require('https');
var url = require('url');
var { verifySession } = require('../lib/auth');

// Vercel project ID from .vercel/project.json
var PROJECT_ID = 'prj_dfnyWZyIiFSPuIvCAreFxwPNYpdY';

module.exports = function(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (!verifySession(req)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  var token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'VERCEL_API_TOKEN not configured' }));
  }

  var parsed = url.parse(req.url, true);
  var range = parsed.query.range || '7d';

  // Calculate date range
  var now = new Date();
  var from = new Date();
  switch (range) {
    case '1d':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setDate(from.getDate() - 7);
  }

  var fromISO = from.toISOString();
  var toISO = now.toISOString();

  // Fetch all analytics data in parallel
  var teamId = process.env.VERCEL_TEAM_ID || '';
  var teamParam = teamId ? '&teamId=' + teamId : '';

  var requests = [
    // Pageviews
    vercelApi('/v1/web/analytics/pageviews?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + '&limit=20' + teamParam, token),
    // Visitors (using same endpoint, different grouping if available, fallback to pageviews)
    vercelApi('/v1/web/analytics/visitors?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + teamParam, token),
    // Top pages
    vercelApi('/v1/web/analytics/top-pages?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + '&limit=15' + teamParam, token),
    // Referrers
    vercelApi('/v1/web/analytics/top-referrers?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + '&limit=10' + teamParam, token),
    // Devices
    vercelApi('/v1/web/analytics/devices?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + teamParam, token),
    // Countries
    vercelApi('/v1/web/analytics/countries?projectId=' + PROJECT_ID + '&from=' + fromISO + '&to=' + toISO + '&limit=10' + teamParam, token)
  ];

  Promise.all(requests).then(function(results) {
    var pageviewsData = results[0] || {};
    var visitorsData = results[1] || {};
    var topPagesData = results[2] || {};
    var referrersData = results[3] || {};
    var devicesData = results[4] || {};
    var countriesData = results[5] || {};

    // Normalize pageviews - sum from series or use total
    var pageviews = 0;
    if (pageviewsData.total != null) {
      pageviews = pageviewsData.total;
    } else if (Array.isArray(pageviewsData.data)) {
      pageviewsData.data.forEach(function(d) { pageviews += (d.pageviews || d.views || d.value || 0); });
    } else if (pageviewsData.pageviews != null) {
      pageviews = pageviewsData.pageviews;
    }

    // Normalize visitors
    var visitors = 0;
    if (visitorsData.total != null) {
      visitors = visitorsData.total;
    } else if (Array.isArray(visitorsData.data)) {
      visitorsData.data.forEach(function(d) { visitors += (d.visitors || d.value || 0); });
    } else if (visitorsData.visitors != null) {
      visitors = visitorsData.visitors;
    }

    // Bounce rate and avg duration - extract if available
    var bounceRate = pageviewsData.bounce_rate || pageviewsData.bounceRate || visitorsData.bounce_rate || visitorsData.bounceRate || 0;
    var avgDuration = pageviewsData.avg_duration || pageviewsData.avgDuration || visitorsData.avg_duration || visitorsData.avgDuration || 0;

    // Top pages
    var topPages = [];
    var pagesArr = topPagesData.data || topPagesData.pages || topPagesData.top_pages || [];
    if (Array.isArray(pagesArr)) {
      topPages = pagesArr.map(function(p) {
        return {
          path: p.path || p.page || p.key || p.name || '/',
          views: p.views || p.pageviews || p.value || p.count || 0
        };
      });
    }

    // Referrers
    var referrers = [];
    var refsArr = referrersData.data || referrersData.referrers || referrersData.top_referrers || [];
    if (Array.isArray(refsArr)) {
      referrers = refsArr.map(function(r) {
        return {
          referrer: r.referrer || r.key || r.name || r.source || 'Direct',
          views: r.views || r.pageviews || r.value || r.count || 0
        };
      });
    }

    // Devices
    var devices = { desktop: 0, mobile: 0, tablet: 0 };
    var devArr = devicesData.data || devicesData.devices || [];
    if (Array.isArray(devArr)) {
      devArr.forEach(function(d) {
        var name = (d.device || d.key || d.name || '').toLowerCase();
        var count = d.views || d.visitors || d.value || d.count || 0;
        if (name.indexOf('desktop') !== -1) devices.desktop += count;
        else if (name.indexOf('mobile') !== -1) devices.mobile += count;
        else if (name.indexOf('tablet') !== -1) devices.tablet += count;
        else devices.desktop += count; // fallback
      });
    }

    // Countries
    var countries = [];
    var geoArr = countriesData.data || countriesData.countries || [];
    if (Array.isArray(geoArr)) {
      countries = geoArr.map(function(c) {
        return {
          country: c.country || c.key || c.name || 'Unknown',
          views: c.views || c.visitors || c.value || c.count || 0
        };
      });
    }

    var result = {
      pageviews: pageviews,
      visitors: visitors,
      bounce_rate: bounceRate,
      avg_duration: avgDuration,
      top_pages: topPages,
      referrers: referrers,
      devices: devices,
      countries: countries
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));

  }).catch(function(err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch analytics: ' + (err.message || 'Unknown error') }));
  });
};

function vercelApi(path, token) {
  return new Promise(function(resolve, reject) {
    var options = {
      hostname: 'api.vercel.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };

    var req = https.request(options, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        try {
          var data = JSON.parse(body);
          if (res.statusCode >= 400) {
            // Don't reject - return empty data so partial failures don't break everything
            resolve({});
          } else {
            resolve(data);
          }
        } catch (e) {
          // Parse error - return empty
          resolve({});
        }
      });
    });

    req.on('error', function(err) {
      // Don't reject - return empty so other requests can still succeed
      resolve({});
    });

    req.setTimeout(8000, function() {
      req.destroy();
      resolve({});
    });

    req.end();
  });
}

