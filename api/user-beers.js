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

  // Each beer item in the beer list
  $('.beer-item, .distinct-list-list .beer-details').each((_, item) => {
    const el = $(item);

    // Get beer link - try multiple selectors
    const beerLink = el.find('a[href*="/b/"]').first();
    if (!beerLink.length) return;

    const href = beerLink.attr('href');
    if (!href) return;

    const beerUrl = new URL(href, 'https://untappd.com').toString();
    const beerName = beerLink.text().trim();

    // Get brewery
    const breweryLink = el.find('a[href*="/w/"], a[href^="/brewery/"]').first();
    const brewery = breweryLink.length ? breweryLink.text().trim() : null;

    // Get style
    const styleText = el.find('.style, .beer-style').first().text().trim();
    const style = styleText || null;

    // Get ABV
    const text = el.text();
    const abvMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*ABV/i);
    const abv = abvMatch ? parseFloat(abvMatch[1]) : null;

    // Get user rating
    const ratingMatch = text.match(/Their Rating\s*\((\d+(?:\.\d+)?)\)/i);
    const userRating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    if (beerName && beerUrl) {
      beers.push({
        name: beerName,
        beer_url: beerUrl,
        brewery,
        style,
        abv,
        user_rating: userRating,
      });
    }
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
    // We'll fetch additional pages if needed
    const $beersPage = cheerio.load(beersHtml);
    let hasMore = hasNextPage($beersPage);

    while (hasMore && pageCount < MAX_PAGES) {
      offset += 25; // Untappd uses 25 beers per page
      const nextUrl = `https://untappd.com/user/${cleanUsername}/beers?offset=${offset}&type=distinct`;

      try {
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

        const nextRes = await fetchWithTimeout(nextUrl, { headers: HEADERS });
        if (!nextRes.ok) break;

        const nextHtml = await nextRes.text();
        const nextBeers = extractBeersFromPage(nextHtml);

        if (nextBeers.length === 0) break;

        for (const beer of nextBeers) {
          if (!seenUrls.has(beer.beer_url)) {
            seenUrls.add(beer.beer_url);
            allBeers.push(beer);
          }
        }

        pageCount++;
        const $next = cheerio.load(nextHtml);
        hasMore = hasNextPage($next) && nextBeers.length >= 25;
      } catch {
        break;
      }
    }

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
    });
  } catch (error) {
    console.error('Error fetching user beers:', error);
    return res.status(500).json({
      error: 'Failed to fetch user beers',
      message: error.message
    });
  }
}
