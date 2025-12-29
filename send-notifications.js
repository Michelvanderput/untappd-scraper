import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VAPID keys - Generate with: npx web-push generate-vapid-keys
// Store these in environment variables in production!
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:your-email@example.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

/**
 * Send notification to all subscribed users
 * @param {string} type - Type of notification: 'newBeers', 'beerdleUpdate', 'beerdleReminder'
 * @param {object} data - Notification data
 */
export async function sendNotification(type, data) {
  try {
    // Check if subscriptions file exists
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      console.log('No subscriptions file found');
      return { sent: 0, failed: 0 };
    }

    const subscriptionsData = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
    const subscriptions = subscriptionsData.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log('No subscriptions found');
      return { sent: 0, failed: 0 };
    }

    // Filter subscriptions based on preferences
    const filteredSubscriptions = subscriptions.filter(sub => {
      const prefs = sub.preferences || {};
      switch (type) {
        case 'newBeers':
          return prefs.newBeers !== false;
        case 'beerdleUpdate':
          return prefs.beerdleUpdate !== false;
        case 'beerdleReminder':
          return prefs.beerdleReminder !== false;
        default:
          return true;
      }
    });

    console.log(`Sending ${type} notification to ${filteredSubscriptions.length} subscribers`);

    // Prepare notification payload
    const payload = JSON.stringify({
      type,
      ...data,
      timestamp: new Date().toISOString()
    });

    let sent = 0;
    let failed = 0;
    const failedEndpoints = [];

    // Send to all subscriptions
    const results = await Promise.allSettled(
      filteredSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload);
          sent++;
        } catch (error) {
          failed++;
          failedEndpoints.push(subscription.endpoint);
          
          // If subscription is no longer valid (410 Gone), remove it
          if (error.statusCode === 410) {
            console.log('Subscription expired, will be removed:', subscription.endpoint);
          }
          throw error;
        }
      })
    );

    // Remove failed subscriptions (expired/invalid)
    if (failedEndpoints.length > 0) {
      subscriptionsData.subscriptions = subscriptions.filter(
        sub => !failedEndpoints.includes(sub.endpoint)
      );
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptionsData, null, 2));
      console.log(`Removed ${failedEndpoints.length} invalid subscriptions`);
    }

    console.log(`Notification sent: ${sent} successful, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

/**
 * Send notification about new beers
 * @param {number} count - Number of new beers
 * @param {array} beers - Array of new beer objects
 */
export async function notifyNewBeers(count, beers = []) {
  const topBeers = beers.slice(0, 3).map(b => b.name).join(', ');
  
  return sendNotification('newBeers', {
    title: '🍺 Nieuwe Bieren Toegevoegd!',
    body: count === 1 
      ? `Er is 1 nieuw bier toegevoegd: ${topBeers}`
      : `Er zijn ${count} nieuwe bieren toegevoegd! ${topBeers}${count > 3 ? ' en meer...' : ''}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/'
  });
}

/**
 * Send notification about Beerdle update
 */
export async function notifyBeerdleUpdate() {
  return sendNotification('beerdleUpdate', {
    title: '🎮 Nieuwe Beerdle Beschikbaar!',
    body: 'Er is een nieuw bier om te raden. Kun jij het vinden?',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/beerdle'
  });
}

/**
 * Send reminder to play Beerdle
 */
export async function notifyBeerdleReminder() {
  return sendNotification('beerdleReminder', {
    title: '⏰ Vergeet Beerdle Niet!',
    body: 'Je hebt vandaag nog niet gespeeld. Probeer het nieuwe bier te raden!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/beerdle'
  });
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      console.log('Sending test notification...');
      sendNotification('test', {
        title: '🧪 Test Notificatie',
        body: 'Dit is een test notificatie van BeerMenu!',
        icon: '/icon-192.png',
        url: '/'
      }).then(result => {
        console.log('Result:', result);
        process.exit(0);
      });
      break;
      
    case 'new-beers':
      const count = parseInt(process.argv[3]) || 5;
      notifyNewBeers(count, [
        { name: 'Test Bier 1' },
        { name: 'Test Bier 2' },
        { name: 'Test Bier 3' }
      ]).then(result => {
        console.log('Result:', result);
        process.exit(0);
      });
      break;
      
    case 'beerdle':
      notifyBeerdleUpdate().then(result => {
        console.log('Result:', result);
        process.exit(0);
      });
      break;
      
    case 'reminder':
      notifyBeerdleReminder().then(result => {
        console.log('Result:', result);
        process.exit(0);
      });
      break;
      
    default:
      console.log('Usage: node send-notifications.js [test|new-beers|beerdle|reminder]');
      process.exit(1);
  }
}
