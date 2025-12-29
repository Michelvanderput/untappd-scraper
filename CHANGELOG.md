# Changelog

Alle belangrijke wijzigingen aan dit project worden gedocumenteerd in dit bestand.

## [2.0.0] - 2025-12-29

### 🚀 Nieuwe Features

#### API Uitbreidingen
- **Paginatie**: Efficiënt werken met grote datasets via `page` en `limit` parameters
- **Sorting**: Sorteer bieren op naam, brewery, ABV, IBU, rating of style
- **Advanced Filtering**: Filter op ABV, IBU en rating ranges
- **Stats Endpoint** (`/api/stats`): Uitgebreide statistieken over het biermenu
  - Totaal aantal bieren per categorie en subcategorie
  - Top 10 brouwerijen en bierstijlen
  - ABV, IBU en rating distributies
  - Min, max en gemiddelde waarden
- **Health Check Endpoint** (`/api/health`): Real-time status monitoring
  - Data freshness check
  - Laatste scrape status
  - Uptime monitoring
- **Logs Endpoint** (`/api/logs`): Scraper logs voor debugging en monitoring

#### Scraper Verbeteringen
- **Error Handling**: Robuuste error handling met gestructureerde logging
- **Retry Mechanisme**: Automatische retries bij netwerkfouten (max 3 pogingen)
- **Timeout Handling**: 30 seconden timeout voor fetch requests
- **Rate Limiting Detection**: Intelligente handling van rate limits met exponential backoff
- **Parallel Scraping**: Alle menu's worden parallel opgehaald voor betere performance
- **Data Validatie**: Valideer beer data op correctheid (ABV, IBU, rating ranges)
- **Data Normalisatie**: Consistente formatting van alle data
- **Scrape Logging**: Alle scrape runs worden gelogd in `scrape-log.json`

### 📊 Data Verbeteringen
- Scrape duration wordt nu bijgehouden
- Uitgebreide statistieken per scrape run
- Duplicaten tracking
- Error counting en reporting

### 🔧 Technische Verbeteringen
- Custom `ScraperError` class voor betere error tracking
- Structured logging met timestamps en context
- Performance metrics tracking
- Scrape history (laatste 100 runs)

### 📝 Documentatie
- Uitgebreide API documentatie met voorbeelden
- Nieuwe endpoints gedocumenteerd
- Query parameters volledig beschreven
- Response voorbeelden toegevoegd

### 🐛 Bug Fixes
- Betere handling van ontbrekende data velden
- Verbeterde error recovery
- Consistente data formatting

---

## [1.0.0] - 2025-12-23

### Initiële Release

- Dagelijkse automatische scraping via GitHub Actions
- Change tracking voor toegevoegde/verwijderde bieren
- API endpoints voor bieren en changelog
- Support voor 4 menu categorieën
- Subcategorieën voor Bierbijbel
- Volledige bierdata: naam, brewery, ABV, IBU, rating, etc.
