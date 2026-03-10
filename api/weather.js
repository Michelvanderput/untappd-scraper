// Open-Meteo API - Gratis, geen API key nodig
// Maastricht coordinates: 50.8514, 5.6910

const MAASTRICHT_LAT = 50.8514;
const MAASTRICHT_LON = 5.6910;

const WMO_CODES = {
  0: 'Helder',
  1: 'Grotendeels helder',
  2: 'Half bewolkt',
  3: 'Bewolkt',
  45: 'Mistig',
  48: 'Rijpmist',
  51: 'Lichte motregen',
  53: 'Motregen',
  55: 'Zware motregen',
  56: 'Lichte ijzel',
  57: 'Zware ijzel',
  61: 'Lichte regen',
  63: 'Regen',
  65: 'Zware regen',
  66: 'Lichte ijsregen',
  67: 'Zware ijsregen',
  71: 'Lichte sneeuw',
  73: 'Sneeuw',
  75: 'Zware sneeuw',
  77: 'Korrelsneeuw',
  80: 'Lichte buien',
  81: 'Buien',
  82: 'Zware buien',
  85: 'Lichte sneeuwbuien',
  86: 'Zware sneeuwbuien',
  95: 'Onweer',
  96: 'Onweer met lichte hagel',
  99: 'Onweer met zware hagel',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MAASTRICHT_LAT}&longitude=${MAASTRICHT_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe/Amsterdam`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    const weather = {
      temperature: current.temperature_2m,
      feels_like: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      wind_speed: current.wind_speed_10m,
      wind_gusts: current.wind_gusts_10m,
      weather_code: current.weather_code,
      description: WMO_CODES[current.weather_code] || 'Onbekend',
      location: 'Maastricht',
      timestamp: current.time,
    };

    return res.status(200).json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch weather data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
