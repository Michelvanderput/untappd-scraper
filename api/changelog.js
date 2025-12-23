import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { limit = 10 } = req.query;
  
  try {
    const changelogPath = path.join(process.cwd(), 'changelog.json');
    
    if (!fs.existsSync(changelogPath)) {
      return res.status(200).json({ changes: [] });
    }
    
    const data = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
    const changes = data.changes.slice(0, parseInt(limit));
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      changes,
      total: data.changes.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load changelog' });
  }
}
