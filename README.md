# 🍺 Untappd Beer Menu Scraper

Automatische scraper voor het biermenu van Biertaverne De Gouverneur op Untappd, met dagelijkse updates via GitHub Actions en API hosting op Vercel.

## Features

✅ **Dagelijkse automatische updates** via GitHub Actions  
✅ **Change tracking** - houdt bij welke bieren zijn toegevoegd/verwijderd  
✅ **API endpoints** op Vercel voor eenvoudige integratie  
✅ **Volledige bierdata**: naam, brewery, ABV, IBU, rating, afbeelding, style, etc.  
✅ **Categorieën & subcategorieën** voor Bierbijbel menu  
✅ **Error handling & retry mechanisme** - robuuste scraping met automatische retries  
✅ **Parallel scraping** - snellere data ophaling  
✅ **Data validatie & normalisatie** - consistente en betrouwbare data  
✅ **Health checks & monitoring** - real-time status van de scraper  
✅ **Paginatie & sorting** - efficiënt werken met grote datasets  
✅ **Advanced filtering** - filter op ABV, IBU, rating ranges  
✅ **Statistics endpoint** - uitgebreide statistieken over het biermenu  

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
- `sort` - Sorteer op: `name`, `brewery`, `abv`, `ibu`, `rating`, `style` (default: `name`)
- `order` - Sorteer richting: `asc` of `desc` (default: `asc`)
- `page` - Paginanummer (default: `1`)
- `limit` - Resultaten per pagina (default: `50`, max: `500`)
- `abv_min` - Minimum ABV percentage
- `abv_max` - Maximum ABV percentage
- `ibu_min` - Minimum IBU waarde
- `ibu_max` - Maximum IBU waarde
- `rating_min` - Minimum rating (0-5)
- `rating_max` - Maximum rating (0-5)

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

# Hoogste ABV eerst, pagina 2
https://jouw-project.vercel.app/api/beers?sort=abv&order=desc&page=2

# Bieren tussen 5-7% ABV met rating > 4.0
https://jouw-project.vercel.app/api/beers?abv_min=5&abv_max=7&rating_min=4.0

# Top rated IPAs
https://jouw-project.vercel.app/api/beers?search=IPA&sort=rating&order=desc&limit=10
```

**Response:**

```json
{
  "source": "https://untappd.com/v/biertaverne-de-gouverneur/1826909",
  "fetched_at": "2025-12-23T12:34:55.520Z",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_results": 396,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "category": null,
    "subcategory": null,
    "search": null,
    "abv_min": null,
    "abv_max": null,
    "ibu_min": null,
    "ibu_max": null,
    "rating_min": null,
    "rating_max": null
  },
  "sort": {
    "by": "name",
    "order": "asc"
  },
  "total_beers": 396,
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
      "rating": 3.4,
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

### GET `/api/stats`

Haal uitgebreide statistieken op over het biermenu.

**Voorbeeld:**

```bash
https://jouw-project.vercel.app/api/stats
```

**Response:**

```json
{
  "fetched_at": "2025-12-29T08:45:00.000Z",
  "stats": {
    "total_beers": 396,
    "by_category": {
      "Bierbijbel": 350,
      "Wisseltap bieren": 30,
      "Vaste bieren van de tap": 10,
      "Op=Op kaart": 6
    },
    "breweries": {
      "total": 150,
      "top_10": [
        { "name": "Brouwerij X", "count": 15 },
        { "name": "Brouwerij Y", "count": 12 }
      ]
    },
    "styles": {
      "total": 75,
      "top_10": [
        { "name": "IPA - American", "count": 45 },
        { "name": "Stout - Imperial", "count": 30 }
      ]
    },
    "abv": {
      "min": 2.5,
      "max": 14.5,
      "average": 7.2,
      "distribution": {
        "low (0-4%)": 25,
        "session (4-5.5%)": 80,
        "standard (5.5-7%)": 150,
        "strong (7-9%)": 100,
        "very_strong (9%+)": 41
      }
    },
    "ibu": {
      "min": 5,
      "max": 120,
      "average": 35.5,
      "distribution": {
        "low (0-20)": 120,
        "medium (20-40)": 150,
        "high (40-60)": 80,
        "very_high (60+)": 46
      }
    },
    "rating": {
      "min": 2.1,
      "max": 4.8,
      "average": 3.65,
      "distribution": {
        "poor (0-2.5)": 5,
        "fair (2.5-3.25)": 80,
        "good (3.25-3.75)": 180,
        "very_good (3.75-4.25)": 110,
        "excellent (4.25-5)": 21
      }
    }
  }
}
```

### GET `/api/health`

Check de status van de scraper en data freshness.

**Voorbeeld:**

```bash
https://jouw-project.vercel.app/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "data": {
    "last_fetch": "2025-12-29T06:00:00.000Z",
    "hours_since_last_fetch": 2.75,
    "beers_count": 396,
    "last_scrape_duration": 8.5,
    "last_scrape_status": {
      "timestamp": "2025-12-29T06:00:00.000Z",
      "success": true,
      "duration_seconds": 8.5,
      "beers_count": 396
    }
  },
  "timestamp": "2025-12-29T08:45:00.000Z"
}
```

### GET `/api/logs`

Haal scraper logs op voor monitoring.

**Query parameters:**
- `limit` - Aantal logs (default: 10, max: 100)

**Voorbeeld:**

```bash
https://jouw-project.vercel.app/api/logs?limit=5
```

**Response:**

```json
{
  "logs": [
    {
      "timestamp": "2025-12-29T06:00:00.000Z",
      "success": true,
      "duration_seconds": 8.5,
      "beers_count": 396,
      "stats": {
        "totalFetched": 400,
        "totalValid": 396,
        "errors": 0,
        "byCategory": { ... }
      }
    }
  ],
  "total": 50
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

- `scrape.js` - Hoofdscraper script met error handling en retry mechanisme
- `detect-changes.js` - Detecteert wijzigingen en maakt changelog
- `beers.json` - Huidige bierdata met scrape statistieken
- `changelog.json` - Geschiedenis van wijzigingen (laatste 30 dagen)
- `scrape-log.json` - Scraper logs (laatste 100 runs)
- `.github/workflows/scrape-daily.yml` - GitHub Actions workflow
- `api/beers.js` - Vercel API endpoint voor bieren (met paginatie & sorting)
- `api/changelog.js` - Vercel API endpoint voor changelog
- `api/stats.js` - Vercel API endpoint voor statistieken
- `api/health.js` - Vercel API endpoint voor health checks
- `api/logs.js` - Vercel API endpoint voor scraper logs

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
