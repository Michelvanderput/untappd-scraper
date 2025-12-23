import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { category, subcategory, search } = req.query;
  
  try {
    const beersPath = path.join(process.cwd(), 'beers.json');
    const data = JSON.parse(fs.readFileSync(beersPath, 'utf-8'));
    
    let beers = data.beers;
    
    // Filter op category
    if (category) {
      beers = beers.filter(b => b.category === category);
    }
    
    // Filter op subcategory
    if (subcategory) {
      beers = beers.filter(b => b.subcategory === subcategory);
    }
    
    // Zoek functie
    if (search) {
      const searchLower = search.toLowerCase();
      beers = beers.filter(b => 
        b.name.toLowerCase().includes(searchLower) ||
        (b.brewery && b.brewery.toLowerCase().includes(searchLower)) ||
        (b.style && b.style.toLowerCase().includes(searchLower))
      );
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      source: data.source,
      fetched_at: data.fetched_at,
      count: beers.length,
      total: data.count,
      beers
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load beer data' });
  }
}
