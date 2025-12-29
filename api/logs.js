import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { limit = '10' } = req.query;
  
  try {
    const scrapeLogPath = path.join(process.cwd(), 'scrape-log.json');
    
    if (!fs.existsSync(scrapeLogPath)) {
      return res.status(200).json({ logs: [] });
    }
    
    const logs = JSON.parse(fs.readFileSync(scrapeLogPath, 'utf-8'));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const limitedLogs = logs.slice(0, limitNum);
    
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      logs: limitedLogs,
      total: logs.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load scrape logs' });
  }
}
