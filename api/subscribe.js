import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store subscriptions in a JSON file
const SUBSCRIPTIONS_FILE = path.join(__dirname, '..', 'subscriptions.json');

// Initialize subscriptions file if it doesn't exist
if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify({ subscriptions: [] }));
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Read existing subscriptions
    const data = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
    
    // Check if subscription already exists
    const existingIndex = data.subscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex === -1) {
      // Add new subscription with preferences
      data.subscriptions.push({
        ...subscription,
        preferences: {
          newBeers: true,
          beerdleUpdate: true,
          beerdleReminder: true
        },
        subscribedAt: new Date().toISOString()
      });
    } else {
      // Update existing subscription
      data.subscriptions[existingIndex] = {
        ...subscription,
        preferences: data.subscriptions[existingIndex].preferences || {
          newBeers: true,
          beerdleUpdate: true,
          beerdleReminder: true
        },
        updatedAt: new Date().toISOString()
      };
    }

    // Save subscriptions
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(data, null, 2));

    res.status(201).json({ 
      success: true,
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
}
