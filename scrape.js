import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { setTimeout } from "timers/promises";

const MENUS = [
  { name: "Wisseltap bieren", url: "https://untappd.com/v/biertaverne-de-gouverneur/1826909?menu_id=141695" },
  { name: "Op=Op kaart",      url: "https://untappd.com/v/biertaverne-de-gouverneur/1826909?menu_id=141692" },
  // Vintage bewust weggelaten
  { name: "Vaste bieren van de tap", url: "https://untappd.com/v/biertaverne-de-gouverneur/1826909?menu_id=141694" },
  { name: "Bierbijbel",       url: "https://untappd.com/v/biertaverne-de-gouverneur/1826909?menu_id=141985" },
];

const HEADERS = {
  "User-Agent": "BeerMenuBot/1.0 (contact: you@example.com)",
  "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
};

const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

class ScraperError extends Error {
  constructor(message, url, originalError) {
    super(message);
    this.name = 'ScraperError';
    this.url = url;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    ...context
  };
  console.error('❌ ERROR:', JSON.stringify(errorLog, null, 2));
}

function logInfo(message, data = {}) {
  console.log(`ℹ️  ${message}`, Object.keys(data).length > 0 ? data : '');
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ScraperError(`Request timeout after ${FETCH_TIMEOUT}ms`, url, error);
    }
    throw error;
  }
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logInfo(`Fetching ${url} (attempt ${attempt}/${retries})`);
      const response = await fetchWithTimeout(url, options);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer
          const waitTime = RETRY_DELAY * attempt * 2;
          logInfo(`Rate limited, waiting ${waitTime}ms before retry`);
          await setTimeout(waitTime);
          continue;
        }
        throw new ScraperError(`HTTP ${response.status}`, url);
      }
      
      return response;
    } catch (error) {
      if (attempt === retries) {
        logError(error, { url, attempts: attempt });
        throw error;
      }
      
      logInfo(`Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
      await setTimeout(RETRY_DELAY * attempt);
    }
  }
}

function validateBeerData(beer) {
  const errors = [];
  
  if (!beer.name || beer.name.length < 2) {
    errors.push('Invalid beer name');
  }
  if (!beer.beer_url || !beer.beer_url.startsWith('https://untappd.com')) {
    errors.push('Invalid beer URL');
  }
  if (beer.abv !== null && (beer.abv < 0 || beer.abv > 100)) {
    errors.push('Invalid ABV value');
  }
  if (beer.ibu !== null && (beer.ibu < 0 || beer.ibu > 200)) {
    errors.push('Invalid IBU value');
  }
  if (beer.rating !== null && (beer.rating < 0 || beer.rating > 5)) {
    errors.push('Invalid rating value');
  }
  
  return errors;
}

function normalizeBeerData(beer) {
  return {
    ...beer,
    name: beer.name?.trim(),
    brewery: beer.brewery?.trim(),
    style: beer.style?.trim(),
    abv: beer.abv !== null ? Number(beer.abv.toFixed(2)) : null,
    ibu: beer.ibu !== null ? Math.round(beer.ibu) : null,
    rating: beer.rating !== null ? Number(beer.rating.toFixed(2)) : null,
    container: beer.container?.trim() || null,
    subcategory: beer.subcategory?.trim() || null
  };
}

function pickMenuRoot($) {
  // We proberen eerst een “menu container” te vinden.
  // Als Untappd classes veranderen, blijft fallback werken.
  return $(
    ".menu-items, .menu_section, .menu-section, #menu, .menu, .venue-menu, .content"
  ).first();
}

function extractBeersFromMenuPage(html, categoryName, pageUrl) {
  const $ = cheerio.load(html);

  const beers = [];
  const seen = new Set();
  let currentSubcategory = null;

  // Voor Bierbijbel: doorloop menu-sections om subcategorieën te tracken
  if (categoryName === "Bierbijbel") {
    $('.menu-section').each((_, section) => {
      const sectionEl = $(section);
      
      // Haal subcategorie uit de header
      const headerH4 = sectionEl.find('.menu-section-header h4').first();
      if (headerH4.length) {
        currentSubcategory = headerH4.text().replace(/\(\d+\s*Items?\)/i, '').trim();
      }
      
      // Verwerk alle menu-items in deze sectie
      sectionEl.find('li.menu-item').each((_, item) => {
        const beer = extractBeerFromMenuItem($, $(item), categoryName, pageUrl, currentSubcategory);
        if (beer && !seen.has(beer.beer_url)) {
          seen.add(beer.beer_url);
          beers.push(beer);
        }
      });
    });
  } else {
    // Voor andere menu's: pak alle menu-items direct
    $('li.menu-item').each((_, item) => {
      const itemEl = $(item);
      
      // Skip items in venue-activity
      if (itemEl.closest('.venue-activity, #venue-activity').length) return;
      
      const beer = extractBeerFromMenuItem($, itemEl, categoryName, pageUrl, null);
      if (beer && !seen.has(beer.beer_url)) {
        seen.add(beer.beer_url);
        beers.push(beer);
      }
    });
  }

  return beers;
}

function extractBeerFromMenuItem($, menuItem, categoryName, pageUrl, subcategory) {
  try {
    // Vind de beer-info container
    const beerInfo = menuItem.find('.beer-info').first();
    if (!beerInfo.length) return null;

    // Vind de bier link
    const beerLink = beerInfo.find('a[href^="/b/"]').first();
    if (!beerLink.length) return null;

    const href = beerLink.attr('href');
    if (!href) return null;

    const beerUrl = new URL(href, "https://untappd.com").toString();
    const beerName = beerLink.text().trim();
    if (!beerName || beerName.length < 2) return null;

    // Extract image URL
    const imgEl = beerInfo.find('.beer-label img').first();
    const imageUrl = imgEl.length ? imgEl.attr('src') : null;

    // Extract beer style from <em> tag
    const styleEm = beerInfo.find('em').first();
    const beerStyle = styleEm.length ? styleEm.text().trim() : null;

    // Extract brewery
    const breweryLink = beerInfo.find('a[href^="/w/"], a[href^="/brewery/"]').first();
    const brewery = breweryLink.length ? breweryLink.text().trim() : null;
    const breweryUrl = breweryLink.length ? breweryLink.attr('href') : null;

    // Extract ABV and IBU from text
    const text = beerInfo.text();
    const abvMatch = text.match(/(\d+(?:\.\d+)?)%\s*ABV/i);
    const ibuMatch = text.match(/(\d+(?:\.\d+)?)\s*IBU/i);

    // Extract rating
    const ratingEl = beerInfo.find('.caps[data-rating]').first();
    const rating = ratingEl.length ? parseFloat(ratingEl.attr('data-rating')) : null;

    // Extract container info (bottle size)
    const containerDiv = menuItem.find('.beer-containers p').first();
    const container = containerDiv.length ? containerDiv.text().trim() : null;

    const beer = {
      name: beerName,
      beer_url: beerUrl,
      image_url: imageUrl,
      style: beerStyle,
      brewery,
      brewery_url: breweryUrl ? new URL(breweryUrl, "https://untappd.com").toString() : null,
      category: categoryName,
      subcategory: subcategory,
      abv: abvMatch ? Number(abvMatch[1]) : null,
      ibu: ibuMatch ? Number(ibuMatch[1]) : null,
      rating: rating,
      container: container,
      source_menu_url: pageUrl,
    };
    
    // Validate beer data
    const validationErrors = validateBeerData(beer);
    if (validationErrors.length > 0) {
      logInfo(`⚠️  Validation warnings for ${beerName}:`, validationErrors);
    }
    
    // Normalize and return
    return normalizeBeerData(beer);
  } catch (error) {
    logError(error, { context: 'extractBeerFromMenuItem', category: categoryName });
    return null;
  }
}

async function main() {
  const startTime = Date.now();
  logInfo('🍺 Starting beer menu scraper...');
  
  const all = [];
  const seenGlobal = new Set();
  const stats = {
    totalFetched: 0,
    totalValid: 0,
    errors: 0,
    byCategory: {}
  };

  try {
    // Parallel scraping voor betere performance
    logInfo('Fetching all menus in parallel...');
    const fetchPromises = MENUS.map(async (menu) => {
      try {
        const res = await fetchWithRetry(menu.url, { headers: HEADERS });
        const html = await res.text();
        const beers = extractBeersFromMenuPage(html, menu.name, menu.url);
        
        logInfo(`✅ ${menu.name}: found ${beers.length} beers`);
        stats.byCategory[menu.name] = beers.length;
        stats.totalFetched += beers.length;
        
        return { menu, beers };
      } catch (error) {
        stats.errors++;
        logError(error, { menu: menu.name, url: menu.url });
        return { menu, beers: [] };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Process results
    for (const { beers } of results) {
      for (const b of beers) {
        // globale dedupe per (beer_url + category + subcategory)
        const k = `${b.beer_url}||${b.category}||${b.subcategory || ""}`;
        if (seenGlobal.has(k)) continue;
        seenGlobal.add(k);
        all.push(b);
        stats.totalValid++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const output = {
      source: "https://untappd.com/v/biertaverne-de-gouverneur/1826909",
      fetched_at: new Date().toISOString(),
      count: all.length,
      scrape_duration_seconds: parseFloat(duration),
      stats: {
        total_fetched: stats.totalFetched,
        total_valid: stats.totalValid,
        duplicates_removed: stats.totalFetched - stats.totalValid,
        errors: stats.errors,
        by_category: stats.byCategory
      },
      beers: all,
    };

    fs.writeFileSync("beers.json", JSON.stringify(output, null, 2));
    
    logInfo(`✅ Scraping completed in ${duration}s`);
    logInfo(`📊 Stats:`, {
      total: all.length,
      fetched: stats.totalFetched,
      duplicates: stats.totalFetched - stats.totalValid,
      errors: stats.errors
    });
    
    // Write scrape log
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: true,
      duration_seconds: parseFloat(duration),
      beers_count: all.length,
      stats
    };
    
    let scrapeLog = [];
    if (fs.existsSync('scrape-log.json')) {
      scrapeLog = JSON.parse(fs.readFileSync('scrape-log.json', 'utf-8'));
    }
    scrapeLog.unshift(logEntry);
    scrapeLog = scrapeLog.slice(0, 100); // Keep last 100 runs
    fs.writeFileSync('scrape-log.json', JSON.stringify(scrapeLog, null, 2));
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logError(error, { duration_seconds: duration });
    
    // Write error log
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: false,
      duration_seconds: parseFloat(duration),
      error: error.message,
      stack: error.stack
    };
    
    let scrapeLog = [];
    if (fs.existsSync('scrape-log.json')) {
      scrapeLog = JSON.parse(fs.readFileSync('scrape-log.json', 'utf-8'));
    }
    scrapeLog.unshift(logEntry);
    scrapeLog = scrapeLog.slice(0, 100);
    fs.writeFileSync('scrape-log.json', JSON.stringify(scrapeLog, null, 2));
    
    throw error;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
