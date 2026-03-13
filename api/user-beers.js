import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
};

const AJAX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html, */*; q=0.01',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
  'X-Requested-With': 'XMLHttpRequest',
};

const FETCH_TIMEOUT = 30000;
const MAX_PAGES = 20;

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

  $('.beer-item').each((_, item) => {
    const $item = $(item);
    const beerLink = $item.find('.beer-details .name a').first();
    if (!beerLink.length) return;
    
    const href = beerLink.attr('href');
    if (!href || !href.match(/\/b\/[^/]+\/\d+/)) return;
    
    const beerUrl = new URL(href, 'https://untappd.com').toString();
    if (seenUrls.has(beerUrl)) return;
    seenUrls.add(beerUrl);
    
    const beerName = beerLink.text().trim();
    if (!beerName || beerName.length < 2) return;
    
    const breweryLink = $item.find('.beer-details .brewery a').first();
    const brewery = breweryLink.length ? breweryLink.text().trim() : null;
    
    const styleP = $item.find('.beer-details .style').first();
    const style = styleP.length ? styleP.text().trim() : null;
    
    const detailsText = $item.find('.details').text();
    const abvMatch = detailsText.match(/(\d+(?:\.\d+)?)\s*%\s*ABV/i);
    const abv = abvMatch ? parseFloat(abvMatch[1]) : null;
    
    const ibuMatch = detailsText.match(/(\d+(?:\.\d+)?)\s*IBU/i);
    const ibu = ibuMatch ? parseFloat(ibuMatch[1]) : null;
    
    const ratingText = $item.text();
    const ratingMatch = ratingText.match(/(?:Their|You) Rating\s*\((\d+(?:\.\d+)?)\)/i);
    const userRating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    
    beers.push({ name: beerName, beer_url: beerUrl, brewery, style, abv, ibu, user_rating: userRating });
  });

  return beers;
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

  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUsername) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  try {
    const allBeers = [];
    const seenUrls = new Set();

    // Step 1: Fetch the profile page to get user info + total count
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

    const statsText = $profile('.stats').text();
    const totalMatch = statsText.match(/([\d,]+)\s*Total/i);
    const uniqueMatch = statsText.match(/([\d,]+)\s*Unique/i);
    const totalCheckins = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : null;
    const totalUnique = uniqueMatch ? parseInt(uniqueMatch[1].replace(/,/g, '')) : 0;

    const displayName = $profile('.user .info h1').first().text().trim() ||
                        $profile('h1').first().text().trim() ||
                        cleanUsername;
    const avatarUrl = $profile('.user .avatar img, .user-avatar img').first().attr('src') || null;

    // Step 2: Fetch first beers page (always returns 25 beers)
    const beersPageUrl = `https://untappd.com/user/${cleanUsername}/beers`;
    const beersRes = await fetchWithTimeout(beersPageUrl, { headers: HEADERS });

    if (!beersRes.ok) {
      return res.status(502).json({ error: `Failed to fetch beers page: ${beersRes.status}` });
    }

    // Grab cookies from the beers page response for AJAX requests
    const cookies = beersRes.headers.raw()['set-cookie'];
    const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

    const beersHtml = await beersRes.text();
    const firstPageBeers = extractBeersFromPage(beersHtml);

    for (const beer of firstPageBeers) {
      if (!seenUrls.has(beer.beer_url)) {
        seenUrls.add(beer.beer_url);
        allBeers.push(beer);
      }
    }

    console.log(`First page: ${allBeers.length} beers. Total unique: ${totalUnique}. Cookies: ${cookieString ? 'yes' : 'no'}`);

    // Step 3: Fetch remaining pages via AJAX endpoint using cookies from step 2
    if (allBeers.length < totalUnique) {
      let offset = 25;
      let consecutiveEmpty = 0;
      let pageCount = 1;

      while (offset < totalUnique && pageCount < MAX_PAGES && consecutiveEmpty < 3) {
        const ajaxUrl = `https://untappd.com/profile/more_beer/${cleanUsername}/${offset}?sort=date`;
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));

          const ajaxRes = await fetchWithTimeout(ajaxUrl, {
            headers: {
              ...AJAX_HEADERS,
              'Referer': `https://untappd.com/user/${cleanUsername}/beers`,
              ...(cookieString ? { 'Cookie': cookieString } : {}),
            }
          });

          if (!ajaxRes.ok) {
            console.log(`AJAX page offset=${offset} status: ${ajaxRes.status}`);
            consecutiveEmpty++;
            offset += 25;
            continue;
          }

          const ajaxHtml = await ajaxRes.text();
          
          if (!ajaxHtml || ajaxHtml.length < 50) {
            console.log(`AJAX page offset=${offset} empty (${ajaxHtml.length} chars)`);
            consecutiveEmpty++;
            offset += 25;
            continue;
          }

          const pageBeers = extractBeersFromPage(ajaxHtml);
          
          if (pageBeers.length === 0) {
            console.log(`AJAX page offset=${offset} - no beers parsed from ${ajaxHtml.length} chars`);
            consecutiveEmpty++;
            offset += 25;
            continue;
          }

          consecutiveEmpty = 0;
          let newCount = 0;
          for (const beer of pageBeers) {
            if (!seenUrls.has(beer.beer_url)) {
              seenUrls.add(beer.beer_url);
              allBeers.push(beer);
              newCount++;
            }
          }

          console.log(`AJAX offset=${offset}: ${pageBeers.length} beers, ${newCount} new. Total: ${allBeers.length}/${totalUnique}`);
          pageCount++;
          offset += 25;
        } catch (error) {
          console.error(`AJAX error offset=${offset}:`, error.message);
          consecutiveEmpty++;
          offset += 25;
        }
      }
    }

    return res.status(200).json({
      username: cleanUsername,
      display_name: displayName,
      avatar_url: avatarUrl,
      total_checkins: totalCheckins,
      total_unique: totalUnique,
      fetched_beers: allBeers.length,
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
