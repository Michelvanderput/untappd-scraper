import fs from 'fs';
import path from 'path';

function sortBeers(beers, sortBy, order = 'asc') {
  const sortFunctions = {
    name: (a, b) => (a.name || '').localeCompare(b.name || ''),
    brewery: (a, b) => (a.brewery || '').localeCompare(b.brewery || ''),
    abv: (a, b) => (a.abv || 0) - (b.abv || 0),
    ibu: (a, b) => (a.ibu || 0) - (b.ibu || 0),
    rating: (a, b) => (a.rating || 0) - (b.rating || 0),
    style: (a, b) => (a.style || '').localeCompare(b.style || '')
  };
  
  const sortFn = sortFunctions[sortBy] || sortFunctions.name;
  const sorted = [...beers].sort(sortFn);
  
  return order === 'desc' ? sorted.reverse() : sorted;
}

export default function handler(req, res) {
  const { 
    category, 
    subcategory, 
    search, 
    sort = 'name', 
    order = 'asc',
    page = '1',
    limit = '50',
    abv_min,
    abv_max,
    ibu_min,
    ibu_max,
    rating_min,
    rating_max
  } = req.query;
  
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
    
    // Filter op ABV range
    if (abv_min) {
      const min = parseFloat(abv_min);
      beers = beers.filter(b => b.abv !== null && b.abv >= min);
    }
    if (abv_max) {
      const max = parseFloat(abv_max);
      beers = beers.filter(b => b.abv !== null && b.abv <= max);
    }
    
    // Filter op IBU range
    if (ibu_min) {
      const min = parseFloat(ibu_min);
      beers = beers.filter(b => b.ibu !== null && b.ibu >= min);
    }
    if (ibu_max) {
      const max = parseFloat(ibu_max);
      beers = beers.filter(b => b.ibu !== null && b.ibu <= max);
    }
    
    // Filter op rating range
    if (rating_min) {
      const min = parseFloat(rating_min);
      beers = beers.filter(b => b.rating !== null && b.rating >= min);
    }
    if (rating_max) {
      const max = parseFloat(rating_max);
      beers = beers.filter(b => b.rating !== null && b.rating <= max);
    }
    
    // Sorteer resultaten
    beers = sortBeers(beers, sort, order);
    
    // Paginatie
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const totalResults = beers.length;
    const totalPages = Math.ceil(totalResults / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBeers = beers.slice(startIndex, endIndex);
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      source: data.source,
      fetched_at: data.fetched_at,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_results: totalResults,
        total_pages: totalPages,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      },
      filters: {
        category,
        subcategory,
        search,
        abv_min,
        abv_max,
        ibu_min,
        ibu_max,
        rating_min,
        rating_max
      },
      sort: {
        by: sort,
        order
      },
      total_beers: data.count,
      beers: paginatedBeers
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load beer data' });
  }
}
