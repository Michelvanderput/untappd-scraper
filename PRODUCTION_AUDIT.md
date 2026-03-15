# Production Audit – Untappd Scraper / BeerMenu

**Datum:** maart 2025  
**Doel:** Project production-ready maken voor verkoop aan klant.

---

## 1. Samenvatting

Het project is al goed gestructureerd: duidelijke scheiding scraper/API/frontend, PWA, dagelijkse scraping via GitHub Actions, en een rijke frontend (filters, Beerdle, AI-chatbot, trends). Om het **production-ready** te verkopen zijn vooral verbeteringen nodig op: **configuratie & documentatie**, **foutafhandeling & robuustheid**, **security hardening**, **SEO/PWA-details** en **optioneel tests**.

---

## 2. Wat gaat al goed ✅

- **Scraper:** Retry, timeout, rate-limit handling, validatie en normalisatie van bierdata.
- **API:** Paginatie, filtering, sorting, health check, CORS headers, Cache-Control.
- **Frontend:** Lazy loading, PWA met service worker, theme (dark/light), IndexedDB-cache, toegankelijke knoppen (aria-label waar nodig).
- **CI/CD:** GitHub Actions 3× per dag, backup van `beers.json` voor change detection.
- **Design:** Eigen font (Distortion, Neue Montreal), Tailwind, Framer Motion/GSAP, duidelijke UX.

---

## 3. Verbeterpunten

### 3.1 Configuratie & Omgeving

| Item | Prioriteit | Actie |
|------|------------|--------|
| Geen `.env.example` | Hoog | Toevoegen met `VITE_OLLAMA_API_KEY`, `VITE_OLLAMA_CLOUD_MODEL` (en optioneel scraper contact-email). |
| Scraper User-Agent | Medium | `you@example.com` in `scrape.js` vervangen door env of placeholder; in README uitleggen. |
| package.json (root) | Laag | `description`, `author` en eventueel `repository` invullen voor professionaliteit. |

### 3.2 API – Security & Robuustheid

| Item | Prioriteit | Actie |
|------|------------|--------|
| Inputvalidatie `/api/beers` | Hoog | `sort` whitelisten (`name`, `brewery`, `abv`, `ibu`, `rating`, `style`); `order` alleen `asc`/`desc`. Nu kan een client ongeldige waarden sturen. |
| Inputvalidatie `/api/changelog` | Hoog | `limit` cap (bijv. max 30) en `parseInt` met fallback; nu kan `limit=999999` worden meegegeven. |
| Foutdetails in productie | Medium | In `api/health.js` en `api/ollama-proxy.js` geen stack/error.message naar client sturen; generieke boodschap retourneren. |
| CORS | Laag | Nu `*`; voor verkoop kan worden gedocumenteerd dat klant eigen origin kan beperken (Vercel env). |

### 3.3 Frontend – Foutafhandeling & UX

| Item | Prioriteit | Actie |
|------|------------|--------|
| Geen Error Boundary | Hoog | React Error Boundary toevoegen zodat een crash in één component niet de hele app wit maakt; vriendelijke foutpagina + “Herladen”. |
| Geen 404-pagina | Hoog | Route `*` met 404-pagina (en link terug naar home). |
| BeersPage bij fetch-fout | Hoog | Bij mislukte fetch nu alleen `setLoading(false)`; lijst blijft leeg. Toevoegen: error state + boodschap + “Opnieuw proberen”. |
| SEO-afbeelding | Medium | `SEO.tsx` gebruikt `image = '/icon-512.png'`; dat bestand bestaat niet. Gebruik `/icon.svg` of voeg icon-512 toe. |
| Manifest shortcuts | Medium | `manifest.json` verwijst naar `/icon-192.png`; die bestaat niet. Gebruik `icon.svg` of voeg PNG’s toe (PWA-installatie kan anders waarschuwingen geven). |

### 3.4 PWA & Styling

| Item | Prioriteit | Actie |
|------|------------|--------|
| theme-color | Laag | `index.html` heeft `#f59e0b`, manifest `theme_color` is `#d97706`; één waarde kiezen (bijv. amber-500) voor consistentie. |
| Focus zichtbaar | Medium | Controleren of alle interactieve elementen `focus-visible` ring hebben (toegankelijkheid/toetsenbord). |
| Apple touch icon | Laag | Momenteel `icon.svg`; voor oudere iOS kan een 180×180 PNG beter worden toegevoegd. |

### 3.5 Tests & Kwaliteit

| Item | Prioriteit | Actie |
|------|------------|--------|
| Geen tests | Medium | Root `npm test` is stub. Opties: (1) Vitest + 1–2 API smoke tests (bijv. `/api/health`, `/api/beers?limit=1`), of (2) in README expliciet vermelden dat v1 geen geautomatiseerde tests heeft en dat dit voor een volgende fase is. |

### 3.6 Documentatie

| Item | Prioriteit | Actie |
|------|------------|--------|
| Production checklist | Hoog | In README sectie “Production / Verkoop”: env variabelen, Vercel env, (optioneel) CORS, rate limits, wat te doen als scraper faalt. |
| .env.example | Hoog | Bestand toevoegen + in README verwijzen naar “Kopieer naar .env en vul in”. |

---

## 4. Features – Toevoegen / Verbeteren / Verwijderen

### Aanbevolen om toe te voegen

1. **Offline-duidelijke melding**  
   Bij geen netwerk nu mogelijk generieke fout. Een duidelijke “Je bent offline – data wordt geladen wanneer je weer verbinding hebt” verbetert de PWA-ervaring.

2. **Skeleton loaders**  
   In plaats van alleen een spinner op BeersPage/Trends: skeleton cards geven sneller het gevoel van structuur en verminderen perceived latency.

3. **Bevestiging bij “Vergelijk”**  
   Duidelijke feedback wanneer een bier aan de vergelijkbalk wordt toegevoegd (toast of korte melding).

### Verbeteren (geen verwijderen nodig)

- **AI-chatbot:** Al goed afgeschermd (API key server-side). Optioneel: rate limit per IP/session in proxy als klant veel verkeer verwacht.
- **Menu-builder:** Handig om te behouden; eventueel “Exporteer als PDF/afbeelding” als verkoopargument.
- **Beerdle:** Blijft een sterke differentiator; geen wijziging nodig voor production.

### Niets verwijderen

- Geen features hoeven te worden verwijderd voor production. Alles draagt bij aan de waarde (PWA, trends, surprise, compare, install-pagina).

---

## 5. Styling – Optionele verfijningen

- **Consistentie:** Eén `theme_color` / primary amber (bijv. `#f59e0b`) in HTML, manifest en eventueel favicon.
- **Focus:** In Tailwind overal waar `hover:` wordt gebruikt ook `focus-visible:ring-2 focus-visible:ring-amber-500` (of vergelijkbaar) voor toetsenbordgebruikers.
- **Contrast:** Controleren of alle tekst op amber/grays voldoet aan WCAG AA (vooral bij “De Bob”-achtige tags en dark mode).
- **Loading states:** Knoppen tijdens submit (bijv. AI-chat) disabled + spinner; voorkomt dubbele requests.

Deze zijn geen blokkers; wel fijn voor een “af” gevoel bij verkoop.

---

## 6. Prioriteiten voor implementatie

**Must-have voor “production ready”:**

1. `.env.example` + README production/env-sectie  
2. API: sort/order whitelist (beers), limit cap (changelog), generieke foutmeldingen (health, ollama-proxy)  
3. Error Boundary + 404-pagina  
4. BeersPage: error state + retry bij mislukte fetch  
5. SEO image en manifest icons corrigeren (icon.svg of echte PNG’s)

**Nice-to-have:**

- Theme-color en focus-visible consistent maken  
- Eén of twee API smoke tests of duidelijke vermelding in README dat tests in v1 ontbreiken  

---

## 7. Conclusie

Het project is inhoudelijk en technisch sterk. De aanbevolen aanpassingen zijn vooral **configuratie**, **foutafhandeling**, **lichte API-hardening** en **SEO/PWA-details**. Na doorvoeren van de must-have punten is het geschikt om als **production-ready** product aan een klant te verkopen, met duidelijke documentatie over omgeving en deployment.
