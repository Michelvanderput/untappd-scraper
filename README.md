# 🍺 Untappd Beer Menu Scraper

Automatische scraper voor het biermenu van Biertaverne De Gouverneur op Untappd, met dagelijkse updates via GitHub Actions en API hosting op Vercel.

## Features

✅ **Dagelijkse automatische updates** via GitHub Actions  
✅ **Change tracking** - houdt bij welke bieren zijn toegevoegd/verwijderd  
✅ **API endpoints** op Vercel voor eenvoudige integratie  
✅ **Volledige bierdata**: naam, brewery, ABV, IBU, rating, afbeelding, style, etc.  
✅ **Categorieën & subcategorieën** voor Bierbijbel menu  

## Setup

### 1. GitHub Repository

1. Maak een nieuwe GitHub repository
2. Push deze code naar GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Untappd scraper"
git branch -M main
git remote add origin https://github.com/JOUW-USERNAME/untappd-scraper.git
git push -u origin main
```

3. **Belangrijk**: Ga naar repository Settings → Actions → General
   - Scroll naar "Workflow permissions"
   - Selecteer "Read and write permissions"
   - Klik "Save"

### 2. Vercel Deployment

1. Ga naar [vercel.com](https://vercel.com) en log in
2. Klik "Add New..." → "Project"
3. Import je GitHub repository
4. Vercel detecteert automatisch de configuratie
5. Klik "Deploy"

Je API is nu live op: `https://jouw-project.vercel.app/api/beers`

### 3. Test de Setup

De GitHub Action draait automatisch elke dag om 06:00 UTC. Je kunt hem ook handmatig triggeren:

1. Ga naar je repository op GitHub
2. Klik op "Actions" tab
3. Selecteer "Daily Beer Menu Scraper"
4. Klik "Run workflow"

## API Endpoints

### GET `/api/beers`

Haal alle bieren op (of filter ze).

**Query parameters:**
- `category` - Filter op categorie (bijv. "Bierbijbel", "Wisseltap bieren")
- `subcategory` - Filter op subcategorie (bijv. "Wit - Weizen", "IPA")
- `search` - Zoek in naam, brewery of style

**Voorbeelden:**

```bash
# Alle bieren
https://jouw-project.vercel.app/api/beers

# Alleen Bierbijbel
https://jouw-project.vercel.app/api/beers?category=Bierbijbel

# Alleen Wit-bieren uit Bierbijbel
https://jouw-project.vercel.app/api/beers?category=Bierbijbel&subcategory=Wit%20-%20Weizen

# Zoek naar "IPA"
https://jouw-project.vercel.app/api/beers?search=IPA
```

**Response:**

```json
{
  "source": "https://untappd.com/v/biertaverne-de-gouverneur/1826909",
  "fetched_at": "2025-12-23T12:34:55.520Z",
  "count": 396,
  "total": 396,
  "beers": [
    {
      "name": "Blanche de Namur",
      "beer_url": "https://untappd.com/b/brasserie-du-bocq-blanche-de-namur/222",
      "image_url": "https://labels.untappd.com/222",
      "style": "Wheat Beer - Witbier / Blanche",
      "brewery": "Brasserie du Bocq",
      "brewery_url": "https://untappd.com/w/brasserie-du-bocq/187",
      "category": "Bierbijbel",
      "subcategory": "Wit - Weizen",
      "abv": 4.5,
      "ibu": 11,
      "rating": 3.39711,
      "container": "25cl Bottle",
      "source_menu_url": "https://untappd.com/v/biertaverne-de-gouverneur/1826909?menu_id=141985"
    }
  ]
}
```

### GET `/api/changelog`

Haal de changelog op met alle wijzigingen.

**Query parameters:**
- `limit` - Aantal dagen (default: 10, max: 30)

**Voorbeeld:**

```bash
https://jouw-project.vercel.app/api/changelog?limit=5
```

**Response:**

```json
{
  "changes": [
    {
      "date": "2025-12-23T06:00:00.000Z",
      "summary": {
        "added": 5,
        "removed": 2,
        "updated": 3,
        "total_beers": 396
      },
      "added": [
        {
          "name": "Nieuwe IPA",
          "beer_url": "https://untappd.com/b/...",
          "category": "Wisseltap bieren",
          "brewery": "Brouwerij X"
        }
      ],
      "removed": [...],
      "updated": [...]
    }
  ],
  "total": 30
}
```

## Lokaal Draaien

```bash
# Installeer dependencies
npm install

# Draai scraper
node scrape.js

# Test change detection
node detect-changes.js
```

## Bestanden

- `scrape.js` - Hoofdscraper script
- `detect-changes.js` - Detecteert wijzigingen en maakt changelog
- `beers.json` - Huidige bierdata
- `changelog.json` - Geschiedenis van wijzigingen (laatste 30 dagen)
- `.github/workflows/scrape-daily.yml` - GitHub Actions workflow
- `api/beers.js` - Vercel API endpoint voor bieren
- `api/changelog.js` - Vercel API endpoint voor changelog

## Categorieën

De scraper haalt 4 menu's op:

1. **Wisseltap bieren** - Roterende tap selectie
2. **Op=Op kaart** - Beperkte voorraad items
3. **Vaste bieren van de tap** - Vaste tap selectie
4. **Bierbijbel** - Volledige flessencollectie (met subcategorieën)

## Changelog Tracking

Het systeem houdt automatisch bij:

- ✅ **Toegevoegde bieren** - Nieuwe items op het menu
- ❌ **Verwijderde bieren** - Items die niet meer beschikbaar zijn
- 🔄 **Gewijzigde bieren** - Updates in ABV, IBU, rating, container, of categorie

Alle wijzigingen worden opgeslagen met timestamp in `changelog.json`.

## Licentie

MIT
