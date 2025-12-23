import fs from "fs";

function detectChanges() {
  const now = new Date().toISOString();
  
  // Lees oude en nieuwe data
  let oldBeers = [];
  if (fs.existsSync("beers.old.json")) {
    const oldData = JSON.parse(fs.readFileSync("beers.old.json", "utf-8"));
    oldBeers = oldData.beers || [];
  }
  
  const newData = JSON.parse(fs.readFileSync("beers.json", "utf-8"));
  const newBeers = newData.beers || [];
  
  // Maak maps voor snelle lookup
  const oldMap = new Map(oldBeers.map(b => [b.beer_url, b]));
  const newMap = new Map(newBeers.map(b => [b.beer_url, b]));
  
  // Detecteer wijzigingen
  const added = [];
  const removed = [];
  const updated = [];
  
  // Nieuwe bieren
  for (const beer of newBeers) {
    if (!oldMap.has(beer.beer_url)) {
      added.push({
        name: beer.name,
        beer_url: beer.beer_url,
        category: beer.category,
        subcategory: beer.subcategory,
        brewery: beer.brewery,
        style: beer.style,
        abv: beer.abv,
        image_url: beer.image_url
      });
    } else {
      // Check voor updates in bestaande bieren
      const oldBeer = oldMap.get(beer.beer_url);
      const changes = {};
      
      if (oldBeer.abv !== beer.abv) changes.abv = { old: oldBeer.abv, new: beer.abv };
      if (oldBeer.ibu !== beer.ibu) changes.ibu = { old: oldBeer.ibu, new: beer.ibu };
      if (oldBeer.rating !== beer.rating) changes.rating = { old: oldBeer.rating, new: beer.rating };
      if (oldBeer.container !== beer.container) changes.container = { old: oldBeer.container, new: beer.container };
      if (oldBeer.category !== beer.category) changes.category = { old: oldBeer.category, new: beer.category };
      
      if (Object.keys(changes).length > 0) {
        updated.push({
          name: beer.name,
          beer_url: beer.beer_url,
          changes
        });
      }
    }
  }
  
  // Verwijderde bieren
  for (const beer of oldBeers) {
    if (!newMap.has(beer.beer_url)) {
      removed.push({
        name: beer.name,
        beer_url: beer.beer_url,
        category: beer.category,
        subcategory: beer.subcategory,
        brewery: beer.brewery
      });
    }
  }
  
  // Lees bestaande changelog of maak nieuwe
  let changelog = { changes: [] };
  if (fs.existsSync("changelog.json")) {
    changelog = JSON.parse(fs.readFileSync("changelog.json", "utf-8"));
  }
  
  // Voeg nieuwe entry toe als er wijzigingen zijn
  if (added.length > 0 || removed.length > 0 || updated.length > 0) {
    changelog.changes.unshift({
      date: now,
      summary: {
        added: added.length,
        removed: removed.length,
        updated: updated.length,
        total_beers: newBeers.length
      },
      added,
      removed,
      updated
    });
    
    // Bewaar alleen laatste 30 dagen
    changelog.changes = changelog.changes.slice(0, 30);
    
    fs.writeFileSync("changelog.json", JSON.stringify(changelog, null, 2));
    
    console.log(`\n📊 Wijzigingen gedetecteerd:`);
    console.log(`   ✅ Toegevoegd: ${added.length}`);
    console.log(`   ❌ Verwijderd: ${removed.length}`);
    console.log(`   🔄 Gewijzigd: ${updated.length}`);
    console.log(`   📦 Totaal: ${newBeers.length} bieren\n`);
    
    if (added.length > 0) {
      console.log("Nieuwe bieren:");
      added.slice(0, 5).forEach(b => console.log(`   + ${b.name} (${b.brewery})`));
      if (added.length > 5) console.log(`   ... en ${added.length - 5} meer`);
    }
    
    if (removed.length > 0) {
      console.log("\nVerwijderde bieren:");
      removed.slice(0, 5).forEach(b => console.log(`   - ${b.name} (${b.brewery})`));
      if (removed.length > 5) console.log(`   ... en ${removed.length - 5} meer`);
    }
  } else {
    console.log("✨ Geen wijzigingen gedetecteerd");
  }
  
  // Cleanup
  if (fs.existsSync("beers.old.json")) {
    fs.unlinkSync("beers.old.json");
  }
}

detectChanges();
