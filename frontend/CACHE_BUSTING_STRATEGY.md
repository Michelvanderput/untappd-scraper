# Cache Busting & Immediate Deploy Visibility Strategy

## Probleem
Na een deploy blijft de oude versie van de app in de cache staan op iPhone en andere devices, waardoor gebruikers de nieuwe versie niet direct zien.

## Oplossing
Een multi-layered cache busting strategie die zorgt voor **immediate deploy visibility**.

---

## 1. Service Worker Strategie

### Automatic Versioning
```javascript
const VERSION = 'v2.2.0-' + new Date().getTime();
```
- Elke deploy krijgt automatisch een unieke timestamp
- Oude caches worden direct verwijderd bij activatie

### Network-First voor HTML/JS/CSS
```javascript
// HTML, JS, CSS altijd vers van netwerk
fetch(request, { cache: 'no-store' })
```
- **HTML, JS, CSS**: Altijd van netwerk, cache alleen als fallback
- **API calls**: Network-first met 5 minuten cache
- **Images**: Cache-first met background refresh

### Aggressive Cache Cleanup
- Bij activatie: Verwijder ALLE oude cache versies
- `skipWaiting()`: Nieuwe service worker neemt direct over
- `clients.claim()`: Controle over alle tabs direct

---

## 2. Meta Tags in HTML

```html
<!-- Force revalidation on every visit -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

Deze tags zorgen ervoor dat:
- Browser cache wordt genegeerd
- Elke page load checkt voor nieuwe versie
- Geen caching van HTML document

---

## 3. Service Worker Registration

```typescript
// updateViaCache: 'none' - Never use cached service worker
const registration = await navigator.serviceWorker.register('/sw.js', {
  updateViaCache: 'none'
});
```

### Update Checking
- **Immediate**: Check bij page load
- **Interval**: Elke 60 seconden
- **Aggressive**: Geen cache van service worker zelf

---

## 4. Update Notification

### Automatic Detection
Wanneer een nieuwe versie beschikbaar is:
1. Service worker detecteert nieuwe versie
2. Custom event `pwa-update-available` wordt gefired
3. `UpdateNotification` component toont melding
4. Gebruiker klikt "Updaten"
5. Alle caches worden gewist
6. Page reload met verse versie

### Manual Cache Clear
```typescript
// Clear all caches manually
await clearAllCaches();

// Force reload
await forceReload();
```

---

## 5. iPhone Specifieke Optimalisaties

### iOS Safari Cache
- Meta tags forceren revalidatie
- Service worker bypass voor HTML
- Network-first strategie voor alle code

### PWA Mode
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### Standalone Mode
- Update checking blijft actief in standalone
- Notification werkt ook in fullscreen mode
- Safe area insets voor notched devices

---

## 6. Deploy Checklist

### Bij Elke Deploy:
1. ✅ Service worker versie wordt automatisch ge-update (timestamp)
2. ✅ Vite build genereert nieuwe hashes voor JS/CSS
3. ✅ Meta tags forceren revalidatie
4. ✅ Network-first strategie haalt verse bestanden op

### Gebruiker Ervaring:
1. Gebruiker opent app
2. Service worker checkt voor updates (binnen 60 sec)
3. Nieuwe versie gedetecteerd
4. Notificatie verschijnt: "🎉 Nieuwe versie beschikbaar!"
5. Gebruiker klikt "Updaten"
6. Cache wordt gewist
7. Page reload met verse versie
8. **Totale tijd: < 2 minuten**

---

## 7. Testing

### Test Deploy Visibility:
```bash
# 1. Deploy nieuwe versie
npm run build
# Deploy naar hosting

# 2. Open app op iPhone
# 3. Wacht max 60 seconden
# 4. Update notificatie verschijnt
# 5. Klik "Updaten"
# 6. Verse versie is geladen
```

### Manual Cache Clear (Development):
```javascript
// In browser console
await clearAllCaches();
await forceReload();
```

### Check Service Worker Version:
```javascript
// In browser console
await getServiceWorkerVersion();
// Returns: "v2.2.0-1735567890123"
```

---

## 8. Cache Strategie per Resource Type

| Resource Type | Strategie | Cache Duration | Rationale |
|--------------|-----------|----------------|-----------|
| HTML | Network-first | No cache | Altijd verse versie |
| JS/CSS | Network-first | No cache | Code moet altijd up-to-date |
| API calls | Network-first | 5 minuten | Fresh data, offline fallback |
| Images | Cache-first | Indefinite | Performance, background refresh |
| Manifest | Precache | Per version | PWA metadata |

---

## 9. Troubleshooting

### "Ik zie nog steeds de oude versie"
1. Check of service worker actief is: `navigator.serviceWorker.controller`
2. Force reload: `Cmd/Ctrl + Shift + R`
3. Clear cache manually: `clearAllCaches()`
4. Unregister SW: `forceReload()`

### "Update notificatie verschijnt niet"
1. Check console voor `[PWA] New version available!`
2. Wacht 60 seconden (update check interval)
3. Refresh page manually
4. Check of service worker geregistreerd is

### "Cache wordt niet gewist"
1. Check browser console voor errors
2. Verify service worker heeft cache permissions
3. Try manual: `caches.keys().then(keys => keys.forEach(key => caches.delete(key)))`

---

## 10. Monitoring

### Console Logs
```
[SW] Installing version: v2.2.0-1735567890123
[SW] Activating version: v2.2.0-1735567890123
[SW] Deleting old cache: beermenu-v2.1.0-1735567890000
[SW] Taking control of all clients
[PWA] Checking for updates...
[PWA] New service worker found!
[PWA] New version available!
```

### Success Indicators
- ✅ Nieuwe versie binnen 2 minuten zichtbaar
- ✅ Update notificatie verschijnt automatisch
- ✅ Geen manual refresh nodig
- ✅ Werkt op iPhone in standalone mode
- ✅ Offline fallback blijft werken

---

## 11. Performance Impact

### Network Requests
- **+1 request** per page load (HTML revalidation)
- **+1 request** per 60 sec (SW update check)
- **Minimal impact**: Requests zijn klein en snel

### User Experience
- **Instant updates**: Binnen 2 minuten
- **No interruption**: Update in background
- **User control**: Keuze wanneer te updaten
- **Smooth transition**: GSAP animated notification

---

## Conclusie

Deze strategie zorgt ervoor dat:
- ✅ Nieuwe deploys **binnen 2 minuten** zichtbaar zijn
- ✅ **Geen hard refresh** nodig op iPhone
- ✅ **Automatische detectie** van updates
- ✅ **User-friendly** update flow met notificatie
- ✅ **Offline support** blijft werken
- ✅ **Performance** blijft optimaal

De combinatie van aggressive cache busting, network-first strategie, en automatic update checking garandeert dat gebruikers altijd de nieuwste versie zien zonder manual intervention.
