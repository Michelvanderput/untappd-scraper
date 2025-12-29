// Note: Vercel serverless functions don't have persistent file system access
// Subscriptions are stored via GitHub API and managed by the workflow
// This endpoint accepts subscriptions and stores them temporarily

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

    // Store subscription via GitHub API
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'Michelvanderput/untappd-scraper';
    
    if (!GITHUB_TOKEN) {
      console.warn('No GitHub token configured, subscription will not persist');
      return res.status(201).json({ 
        success: true,
        message: 'Subscription received (persistence requires GitHub token configuration)',
        warning: 'Subscriptions will not persist across deployments without GitHub token'
      });
    }

    // Fetch current subscriptions from GitHub
    const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/subscriptions.json`;
    
    let currentData = { subscriptions: [] };
    let sha = null;
    
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        sha = fileData.sha;
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        currentData = JSON.parse(content);
      }
    } catch (error) {
      console.log('No existing subscriptions file, will create new one');
    }

    // Check if subscription already exists
    const existingIndex = currentData.subscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex === -1) {
      currentData.subscriptions.push({
        ...subscription,
        preferences: {
          newBeers: true,
          beerdleUpdate: true,
          beerdleReminder: true
        },
        subscribedAt: new Date().toISOString()
      });
    } else {
      currentData.subscriptions[existingIndex] = {
        ...subscription,
        preferences: currentData.subscriptions[existingIndex].preferences || {
          newBeers: true,
          beerdleUpdate: true,
          beerdleReminder: true
        },
        updatedAt: new Date().toISOString()
      };
    }

    // Save back to GitHub
    const content = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');
    
    await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update subscriptions',
        content,
        sha
      })
    });

    res.status(201).json({ 
      success: true,
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ 
      error: 'Failed to save subscription',
      details: error.message 
    });
  }
}
