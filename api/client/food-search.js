var { verifyClientSession } = require('../lib/client-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var clientId = verifyClientSession(req);
  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  try {
    var url = 'https://world.openfoodfacts.org/cgi/search.pl?' +
      'search_terms=' + encodeURIComponent(query) +
      '&json=1&page_size=20' +
      '&fields=code,product_name,brands,nutriments,serving_size,serving_quantity';

    var resp = await fetch(url, {
      headers: { 'User-Agent': 'TelosFitness/1.0 (telosfitnessllc@gmail.com)' }
    });
    var data = await resp.json();

    var foods = (data.products || [])
      .filter(function(p) { return p.product_name; })
      .map(function(p) {
        var n = p.nutriments || {};
        var servingQty = parseFloat(p.serving_quantity) || 0;
        var hasSrv = servingQty > 0;

        var calories = Math.round(hasSrv ? (n['energy-kcal_serving'] || n['energy-kcal_100g'] * servingQty / 100 || 0) : (n['energy-kcal_100g'] || 0));
        var protein = Math.round(hasSrv ? (n['proteins_serving'] || n['proteins_100g'] * servingQty / 100 || 0) : (n['proteins_100g'] || 0));
        var carbs = Math.round(hasSrv ? (n['carbohydrates_serving'] || n['carbohydrates_100g'] * servingQty / 100 || 0) : (n['carbohydrates_100g'] || 0));
        var fat = Math.round(hasSrv ? (n['fat_serving'] || n['fat_100g'] * servingQty / 100 || 0) : (n['fat_100g'] || 0));

        return {
          id: p.code || '',
          name: p.product_name,
          brand: p.brands || null,
          servingSize: p.serving_size || (hasSrv ? servingQty + 'g' : '100g'),
          calories: calories,
          protein: protein,
          carbs: carbs,
          fat: fat,
          per100g: !hasSrv
        };
      });

    return res.status(200).json({ foods: foods });
  } catch (err) {
    console.error('food-search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
};
