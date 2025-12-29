# Push Notifications Setup Guide

## 📋 Overzicht

Het push notification systeem stuurt automatisch notificaties naar gebruikers voor:
1. **Nieuwe bieren** - Wanneer nieuwe bieren worden toegevoegd
2. **Beerdle update** - Wanneer er een nieuw Beerdle spel beschikbaar is
3. **Beerdle reminder** - Herinnering als gebruiker nog niet heeft gespeeld

## 🔧 Setup Stappen

### 1. Installeer Dependencies

```bash
npm install web-push
```

### 2. Genereer VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Dit genereert een public en private key. Bewaar deze veilig!

### 3. Update Environment Variables

Voeg toe aan je `.env` file (of Vercel environment variables):

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### 4. Update Frontend

Update `frontend/src/utils/notifications.ts`:

```typescript
const VAPID_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE'; // Vervang met je public key
```

### 5. Update Service Worker

De service worker (`frontend/public/sw.js`) is al geconfigureerd om notifications te ontvangen.

## 🚀 Gebruik

### Automatisch (via GitHub Actions)

Voeg toe aan `.github/workflows/scrape-daily.yml`:

```yaml
- name: Check for new beers and send notifications
  run: |
    # Compare old and new beer counts
    OLD_COUNT=$(jq '. | length' beers.old.json)
    NEW_COUNT=$(jq '. | length' beers.json)
    
    if [ $NEW_COUNT -gt $OLD_COUNT ]; then
      DIFF=$((NEW_COUNT - OLD_COUNT))
      echo "Found $DIFF new beers, sending notifications..."
      node send-notifications.js new-beers $DIFF
    fi

- name: Send Beerdle update notification
  run: node send-notifications.js beerdle
  # Run dit alleen als Beerdle is geupdate
```

### Handmatig Testen

```bash
# Test notificatie
node send-notifications.js test

# Nieuwe bieren notificatie (5 nieuwe bieren)
node send-notifications.js new-beers 5

# Beerdle update
node send-notifications.js beerdle

# Beerdle reminder
node send-notifications.js reminder
```

## 📱 Gebruiker Ervaring

### Toestemming Vragen

Gebruikers kunnen zich abonneren via:
1. Browser prompt wanneer ze de site bezoeken
2. Settings pagina (nog te implementeren)

### Notification Preferences

Gebruikers kunnen kiezen welke notificaties ze willen ontvangen:
- ✅ Nieuwe bieren
- ✅ Beerdle updates
- ✅ Beerdle reminders

## 🔔 Notification Types

### 1. Nieuwe Bieren
```javascript
{
  title: '🍺 Nieuwe Bieren Toegevoegd!',
  body: 'Er zijn 5 nieuwe bieren toegevoegd! NEIPA, Gingerbread Man, Playlist en meer...',
  icon: '/icon-192.png',
  url: '/'
}
```

### 2. Beerdle Update
```javascript
{
  title: '🎮 Nieuwe Beerdle Beschikbaar!',
  body: 'Er is een nieuw bier om te raden. Kun jij het vinden?',
  icon: '/icon-192.png',
  url: '/beerdle'
}
```

### 3. Beerdle Reminder
```javascript
{
  title: '⏰ Vergeet Beerdle Niet!',
  body: 'Je hebt vandaag nog niet gespeeld. Probeer het nieuwe bier te raden!',
  icon: '/icon-192.png',
  url: '/beerdle'
}
```

## 📊 Monitoring

Subscriptions worden opgeslagen in `subscriptions.json`:

```json
{
  "subscriptions": [
    {
      "endpoint": "https://...",
      "keys": { ... },
      "preferences": {
        "newBeers": true,
        "beerdleUpdate": true,
        "beerdleReminder": true
      },
      "subscribedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🔒 Security

- VAPID keys worden gebruikt voor authenticatie
- Private key moet **NOOIT** in de frontend komen
- Gebruik environment variables voor productie
- Subscriptions bevatten geen persoonlijke data

## 🐛 Troubleshooting

### Notifications werken niet

1. **Check VAPID keys**: Zijn ze correct ingesteld?
2. **HTTPS vereist**: Service workers werken alleen over HTTPS
3. **Browser support**: Test in Chrome/Edge/Firefox
4. **Permissions**: Heeft gebruiker toestemming gegeven?

### Subscriptions worden niet opgeslagen

1. Check of `subscriptions.json` bestaat en schrijfbaar is
2. Check API endpoints `/api/subscribe` en `/api/unsubscribe`
3. Check browser console voor errors

### Test Notifications

```bash
# Stuur test notificatie naar alle subscribers
node send-notifications.js test
```

## 📝 TODO

- [ ] UI voor notification preferences
- [ ] Unsubscribe optie in frontend
- [ ] Analytics voor notification engagement
- [ ] Scheduled reminders (bijv. elke avond om 20:00)
- [ ] Rich notifications met afbeeldingen
- [ ] Action buttons in notifications

## 🔗 Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
