// Unsubscribe endpoint using GitHub API for persistence

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

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'Michelvanderput/untappd-scraper';
    
    if (!GITHUB_TOKEN) {
      return res.status(200).json({ 
        success: true,
        message: 'Unsubscribe request received (persistence requires GitHub token)'
      });
    }

    // Fetch current subscriptions
    const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/subscriptions.json`;
    
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const data = JSON.parse(content);
    
    // Remove subscription
    data.subscriptions = data.subscriptions.filter(
      sub => sub.endpoint !== endpoint
    );

    // Save back to GitHub
    const newContent = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Remove subscription',
        content: newContent,
        sha: fileData.sha
      })
    });

    res.status(200).json({ 
      success: true,
      message: 'Subscription removed successfully' 
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
}
