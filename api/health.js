import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const beersPath = path.join(process.cwd(), 'beers.json');
    const scrapeLogPath = path.join(process.cwd(), 'scrape-log.json');
    
    // Check if beers.json exists and is recent
    if (!fs.existsSync(beersPath)) {
      return res.status(503).json({
        status: 'unhealthy',
        error: 'beers.json not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const beersData = JSON.parse(fs.readFileSync(beersPath, 'utf-8'));
    const lastFetch = new Date(beersData.fetched_at);
    const hoursSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);
    
    // Get last scrape status
    let lastScrapeStatus = null;
    if (fs.existsSync(scrapeLogPath)) {
      const scrapeLog = JSON.parse(fs.readFileSync(scrapeLogPath, 'utf-8'));
      if (scrapeLog.length > 0) {
        lastScrapeStatus = {
          timestamp: scrapeLog[0].timestamp,
          success: scrapeLog[0].success,
          duration_seconds: scrapeLog[0].duration_seconds,
          beers_count: scrapeLog[0].beers_count
        };
      }
    }
    
    // Determine health status
    const isHealthy = hoursSinceLastFetch < 48 && beersData.count > 0;
    const status = isHealthy ? 'healthy' : 'degraded';
    
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(isHealthy ? 200 : 503).json({
      status,
      data: {
        last_fetch: beersData.fetched_at,
        hours_since_last_fetch: parseFloat(hoursSinceLastFetch.toFixed(2)),
        beers_count: beersData.count,
        last_scrape_duration: beersData.scrape_duration_seconds,
        last_scrape_status: lastScrapeStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
