import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const beersPath = path.join(process.cwd(), 'beers.json');
    const data = JSON.parse(fs.readFileSync(beersPath, 'utf-8'));
    const beers = data.beers;
    
    // Calculate statistics
    const stats = {
      total_beers: beers.length,
      by_category: {},
      by_subcategory: {},
      breweries: {
        total: 0,
        top_10: []
      },
      styles: {
        total: 0,
        top_10: []
      },
      abv: {
        min: null,
        max: null,
        average: null,
        distribution: {
          'low (0-4%)': 0,
          'session (4-5.5%)': 0,
          'standard (5.5-7%)': 0,
          'strong (7-9%)': 0,
          'very_strong (9%+)': 0
        }
      },
      ibu: {
        min: null,
        max: null,
        average: null,
        distribution: {
          'low (0-20)': 0,
          'medium (20-40)': 0,
          'high (40-60)': 0,
          'very_high (60+)': 0
        }
      },
      rating: {
        min: null,
        max: null,
        average: null,
        distribution: {
          'poor (0-2.5)': 0,
          'fair (2.5-3.25)': 0,
          'good (3.25-3.75)': 0,
          'very_good (3.75-4.25)': 0,
          'excellent (4.25-5)': 0
        }
      },
      containers: {}
    };
    
    // Count by category
    beers.forEach(beer => {
      stats.by_category[beer.category] = (stats.by_category[beer.category] || 0) + 1;
      
      if (beer.subcategory) {
        stats.by_subcategory[beer.subcategory] = (stats.by_subcategory[beer.subcategory] || 0) + 1;
      }
      
      if (beer.container) {
        stats.containers[beer.container] = (stats.containers[beer.container] || 0) + 1;
      }
    });
    
    // Brewery statistics
    const breweryCount = {};
    beers.forEach(beer => {
      if (beer.brewery) {
        breweryCount[beer.brewery] = (breweryCount[beer.brewery] || 0) + 1;
      }
    });
    stats.breweries.total = Object.keys(breweryCount).length;
    stats.breweries.top_10 = Object.entries(breweryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    // Style statistics
    const styleCount = {};
    beers.forEach(beer => {
      if (beer.style) {
        styleCount[beer.style] = (styleCount[beer.style] || 0) + 1;
      }
    });
    stats.styles.total = Object.keys(styleCount).length;
    stats.styles.top_10 = Object.entries(styleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    // ABV statistics
    const abvValues = beers.filter(b => b.abv !== null).map(b => b.abv);
    if (abvValues.length > 0) {
      stats.abv.min = Math.min(...abvValues);
      stats.abv.max = Math.max(...abvValues);
      stats.abv.average = parseFloat((abvValues.reduce((a, b) => a + b, 0) / abvValues.length).toFixed(2));
      
      abvValues.forEach(abv => {
        if (abv < 4) stats.abv.distribution['low (0-4%)']++;
        else if (abv < 5.5) stats.abv.distribution['session (4-5.5%)']++;
        else if (abv < 7) stats.abv.distribution['standard (5.5-7%)']++;
        else if (abv < 9) stats.abv.distribution['strong (7-9%)']++;
        else stats.abv.distribution['very_strong (9%+)']++;
      });
    }
    
    // IBU statistics
    const ibuValues = beers.filter(b => b.ibu !== null).map(b => b.ibu);
    if (ibuValues.length > 0) {
      stats.ibu.min = Math.min(...ibuValues);
      stats.ibu.max = Math.max(...ibuValues);
      stats.ibu.average = parseFloat((ibuValues.reduce((a, b) => a + b, 0) / ibuValues.length).toFixed(2));
      
      ibuValues.forEach(ibu => {
        if (ibu < 20) stats.ibu.distribution['low (0-20)']++;
        else if (ibu < 40) stats.ibu.distribution['medium (20-40)']++;
        else if (ibu < 60) stats.ibu.distribution['high (40-60)']++;
        else stats.ibu.distribution['very_high (60+)']++;
      });
    }
    
    // Rating statistics
    const ratingValues = beers.filter(b => b.rating !== null).map(b => b.rating);
    if (ratingValues.length > 0) {
      stats.rating.min = Math.min(...ratingValues);
      stats.rating.max = Math.max(...ratingValues);
      stats.rating.average = parseFloat((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(2));
      
      ratingValues.forEach(rating => {
        if (rating < 2.5) stats.rating.distribution['poor (0-2.5)']++;
        else if (rating < 3.25) stats.rating.distribution['fair (2.5-3.25)']++;
        else if (rating < 3.75) stats.rating.distribution['good (3.25-3.75)']++;
        else if (rating < 4.25) stats.rating.distribution['very_good (3.75-4.25)']++;
        else stats.rating.distribution['excellent (4.25-5)']++;
      });
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      fetched_at: data.fetched_at,
      stats
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate statistics' });
  }
}
