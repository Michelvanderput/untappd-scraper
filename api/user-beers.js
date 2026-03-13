import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const HEADERS = {
  "User-Agent": "BeerMenuBot/1.0 (contact: you@example.com)",
  "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
};

const FETCH_TIMEOUT = 30000;
const MAX_PAGES = 20; // Safety limit: max 20 pages (25 beers per page = ~500 beers)

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
    throw error;
  }
}

function extractBeersFromPage(html) {
  const $ = cheerio.load(html);
  const beers = [];
  const seenUrls = new Set();

  // Find all beer-item divs (the main container for each beer)
  $('.beer-item').each((_, item) => {
    const $item = $(item);
    
    // Get the beer link from beer-details
    const beerLink = $item.find('.beer-details .name a').first();
    if (!beerLink.length) return;
    
    const href = beerLink.attr('href');
    if (!href || !href.match(/\/b\/[^/]+\/\d+/)) return;
    
    const beerUrl = new URL(href, 'https://untappd.com').toString();
    
    // Skip duplicates
    if (seenUrls.has(beerUrl)) return;
    seenUrls.add(beerUrl);
    
    const beerName = beerLink.text().trim();
    if (!beerName || beerName.length < 2) return;
    
    // Get brewery
    const breweryLink = $item.find('.beer-details .brewery a').first();
    const brewery = breweryLink.length ? breweryLink.text().trim() : null;
    
    // Get style
    const styleP = $item.find('.beer-details .style').first();
    const style = styleP.length ? styleP.text().trim() : null;
    
    // Get ABV from details section
    const detailsText = $item.find('.details').text();
    const abvMatch = detailsText.match(/(\d+(?:\.\d+)?)\s*%\s*ABV/i);
    const abv = abvMatch ? parseFloat(abvMatch[1]) : null;
    
    // Get IBU
    const ibuMatch = detailsText.match(/(\d+(?:\.\d+)?)\s*IBU/i);
    const ibu = ibuMatch ? parseFloat(ibuMatch[1]) : null;
    
    // Get user rating
    const ratingMatch = detailsText.match(/Their Rating\s*\((\d+(?:\.\d+)?)\)/i);
    const userRating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    
    beers.push({
      name: beerName,
      beer_url: beerUrl,
      brewery,
      style,
      abv,
      ibu,
      user_rating: userRating,
    });
  });

  return beers;
}

function hasNextPage($) {
  // Check for "Show More" button or next page link
  const showMore = $('a.more-list, .more_checkins a, a[href*="offset="], .show-more a, a.show_more_beers').first();
  return showMore.length > 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Sanitize username
  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUsername) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  try {
    const allBeers = [];
    const seenUrls = new Set();
    let offset = 0;
    let pageCount = 0;
    let totalUnique = 0;

    // First, fetch the profile page to verify the user exists and get total count
    const profileUrl = `https://untappd.com/user/${cleanUsername}`;
    const profileRes = await fetchWithTimeout(profileUrl, { headers: HEADERS });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return res.status(404).json({ error: 'User not found', username: cleanUsername });
      }
      return res.status(502).json({ error: `Untappd returned status ${profileRes.status}` });
    }

    const profileHtml = await profileRes.text();
    const $profile = cheerio.load(profileHtml);

    // Extract user stats
    const statsText = $profile('.stats').text();
    const totalMatch = statsText.match(/([\d,]+)\s*Total/i);
    const uniqueMatch = statsText.match(/([\d,]+)\s*Unique/i);
    const totalCheckins = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : null;
    totalUnique = uniqueMatch ? parseInt(uniqueMatch[1].replace(/,/g, '')) : null;

    // Extract user display name and avatar
    const displayName = $profile('.user .info h1').first().text().trim() ||
                        $profile('h1').first().text().trim() ||
                        cleanUsername;
    const avatarUrl = $profile('.user .avatar img, .user-avatar img').first().attr('src') || null;

    // Now fetch the beers page(s)
    const beersPageUrl = `https://untappd.com/user/${cleanUsername}/beers`;
    const beersRes = await fetchWithTimeout(beersPageUrl, { headers: HEADERS });

    if (!beersRes.ok) {
      return res.status(502).json({ error: `Failed to fetch beers page: ${beersRes.status}` });
    }

    const beersHtml = await beersRes.text();
    const beersFromFirstPage = extractBeersFromPage(beersHtml);

    for (const beer of beersFromFirstPage) {
      if (!seenUrls.has(beer.beer_url)) {
        seenUrls.add(beer.beer_url);
        allBeers.push(beer);
      }
    }
    pageCount = 1;

    // The beers page uses AJAX pagination with offset parameter
    // Continue fetching until we have all beers or hit the limit
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmpty = 3;

    console.log(`Starting pagination. Total unique: ${totalUnique}, First page beers: ${allBeers.length}`);

    // Keep fetching pages until we reach the total unique count or max pages
    while (pageCount < MAX_PAGES && consecutiveEmptyPages < maxConsecutiveEmpty) {
      // If we know the total and have reached it, stop
      if (totalUnique && allBeers.length >= totalUnique) {
        console.log(`Reached target: ${allBeers.length}/${totalUnique} beers`);
        break;
      }

      offset += 25; // Untappd uses 25 beers per page
      const nextUrl = `https://untappd.com/user/${cleanUsername}/beers?offset=${offset}&type=distinct`;

      try {
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 600));

        console.log(`Fetching page ${pageCount + 1}, offset ${offset}...`);
        const nextRes = await fetchWithTimeout(nextUrl, { headers: HEADERS });
        if (!nextRes.ok) {
          console.log(`Page ${pageCount + 1} returned status ${nextRes.status}`);
          consecutiveEmptyPages++;
          continue;
        }

        const nextHtml = await nextRes.text();
        const nextBeers = extractBeersFromPage(nextHtml);

        console.log(`Page ${pageCount + 1}: Found ${nextBeers.length} beers on page`);

        if (nextBeers.length === 0) {
          consecutiveEmptyPages++;
          console.log(`Empty page ${consecutiveEmptyPages}/${maxConsecutiveEmpty}`);
          continue;
        }

        // Reset empty page counter if we found beers
        consecutiveEmptyPages = 0;

        let newBeersFound = 0;
        for (const beer of nextBeers) {
          if (!seenUrls.has(beer.beer_url)) {
            seenUrls.add(beer.beer_url);
            allBeers.push(beer);
            newBeersFound++;
          }
        }

        console.log(`Page ${pageCount + 1}: ${newBeersFound} new beers added. Total: ${allBeers.length}/${totalUnique}`);

        // If no new beers were found on this page, increment empty counter
        if (newBeersFound === 0) {
          consecutiveEmptyPages++;
          console.log(`No new beers on page ${pageCount + 1}. Empty count: ${consecutiveEmptyPages}`);
        }

        pageCount++;
      } catch (error) {
        console.error(`Error fetching page ${pageCount + 1}:`, error.message);
        consecutiveEmptyPages++;
      }
    }

    console.log(`Pagination complete. Fetched ${allBeers.length}/${totalUnique} beers across ${pageCount} pages`);

    return res.status(200).json({
      username: cleanUsername,
      display_name: displayName,
      avatar_url: avatarUrl,
      total_checkins: totalCheckins,
      total_unique: totalUnique,
      fetched_beers: allBeers.length,
      pages_fetched: pageCount,
      beer_urls: allBeers.map(b => b.beer_url),
      beers: allBeers,
      fetched_at: new Date().toISOString(),
      debug: {
        expected_unique: totalUnique,
        actual_fetched: allBeers.length,
        coverage_percentage: totalUnique ? Math.round((allBeers.length / totalUnique) * 100) : null,
        pages_scraped: pageCount,
        stopped_reason: consecutiveEmptyPages >= maxConsecutiveEmpty 
          ? 'consecutive_empty_pages' 
          : (totalUnique && allBeers.length >= totalUnique) 
            ? 'all_beers_fetched' 
            : 'max_pages_reached'
      }
    });
  } catch (error) {
    console.error('Error fetching user beers:', error);
    return res.status(500).json({
      error: 'Failed to fetch user beers',
      message: error.message
    });
  }
}
