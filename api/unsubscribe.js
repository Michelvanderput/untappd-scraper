import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUBSCRIPTIONS_FILE = path.join(__dirname, '..', 'subscriptions.json');

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
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // Read existing subscriptions
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const data = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
    
    // Remove subscription
    data.subscriptions = data.subscriptions.filter(
      sub => sub.endpoint !== endpoint
    );

    // Save subscriptions
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(data, null, 2));

    res.status(200).json({ 
      success: true,
      message: 'Subscription removed successfully' 
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
}
