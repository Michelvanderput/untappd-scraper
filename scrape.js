import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";

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

  return {
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
}

async function main() {
  const all = [];
  const seenGlobal = new Set();

  for (const menu of MENUS) {
    console.log("Fetching:", menu.name);
    const res = await fetch(menu.url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${menu.url}`);

    const html = await res.text();
    const beers = extractBeersFromMenuPage(html, menu.name, menu.url);

    console.log(`  -> found ${beers.length}`);
    for (const b of beers) {
      // globale dedupe per (beer_url + category + subcategory)
      const k = `${b.beer_url}||${b.category}||${b.subcategory || ""}`;
      if (seenGlobal.has(k)) continue;
      seenGlobal.add(k);
      all.push(b);
    }
  }

  const output = {
    source: "https://untappd.com/v/biertaverne-de-gouverneur/1826909",
    fetched_at: new Date().toISOString(),
    count: all.length,
    beers: all,
  };

  fs.writeFileSync("beers.json", JSON.stringify(output, null, 2));
  console.log("Saved beers.json with", all.length, "items");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
