/**
 * Live register: last 10 randomized beers globally (all users).
 * Uses Upstash Redis REST API. Without Redis env vars, GET returns [] and POST is a no-op.
 */

const KEY = 'beermenu:last_randomized';
const MAX = 10;

function getRedisUrl() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

async function redisCommand(pathParts, method = 'GET', body = null) {
  const redis = getRedisUrl();
  if (!redis) return null;
  const path = Array.isArray(pathParts) ? pathParts.map(p => encodeURIComponent(p)).join('/') : pathParts;
  const fullUrl = `${redis.url}/${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${redis.token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== null && method !== 'GET') {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(fullUrl, opts);
  if (!res.ok) return null;
  return res.json();
}

/** GET: return last 10 (newest first) */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    const data = await redisCommand(['lrange', KEY, '0', String(MAX - 1)]);
    let list = [];
    if (data?.result && Array.isArray(data.result)) {
      list = data.result
        .map((s) => {
          try {
            return typeof s === 'string' ? JSON.parse(s) : s;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    return res.status(200).json({ list });
  }

  if (req.method === 'POST') {
    const redis = getRedisUrl();
    if (!redis) {
      return res.status(200).json({ list: [], message: 'Live register not configured' });
    }
    const beer = req.body?.beer;
    if (!beer || !beer.name || !beer.beer_url) {
      return res.status(400).json({ error: 'Body must include { beer: { name, beer_url, ... } }' });
    }
    const payload = {
      name: beer.name,
      beer_url: beer.beer_url,
      brewery: beer.brewery ?? null,
      image_url: beer.image_url ?? null,
      rating: beer.rating ?? null,
      style: beer.style ?? null,
      category: beer.category ?? null,
      abv: beer.abv ?? null,
    };
    const bodyStr = JSON.stringify(payload);
    await redisCommand(['lpush', KEY], 'POST', bodyStr);
    await redisCommand(['ltrim', KEY, '0', String(MAX - 1)], 'POST');
    const data = await redisCommand(['lrange', KEY, '0', String(MAX - 1)]);
    let list = [];
    if (data?.result && Array.isArray(data.result)) {
      list = data.result
        .map((s) => {
          try {
            return typeof s === 'string' ? JSON.parse(s) : s;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
    return res.status(200).json({ list });
  }
}
