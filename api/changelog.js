import fs from 'fs';
import path from 'path';

const MAX_LIMIT = 30;

export default function handler(req, res) {
  const rawLimit = req.query.limit;
  const limitNum = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(rawLimit, 10) || 10)
  );

  try {
    const changelogPath = path.join(process.cwd(), 'changelog.json');

    if (!fs.existsSync(changelogPath)) {
      return res.status(200).json({ changes: [], total: 0 });
    }

    const data = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
    const changes = data.changes.slice(0, limitNum);
    
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
