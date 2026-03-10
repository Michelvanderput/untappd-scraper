import type { BeerData } from '../types/beer';

const OLLAMA_PROXY_URL = '/api/ollama-proxy';
const OLLAMA_CLOUD_MODEL = import.meta.env.VITE_OLLAMA_CLOUD_MODEL || 'ministral-3:3b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_gusts: number;
  weather_code: number;
  description: string;
  location: string;
  timestamp: string;
}

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const response = await fetch('/api/weather');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function buildBeerContext(beers: BeerData[]): string {
  // Group beers by category
  const grouped = new Map<string, BeerData[]>();
  beers.forEach(beer => {
    const cat = beer.category || 'Overig';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(beer);
  });

  const sections: string[] = [];
  grouped.forEach((categoryBeers, category) => {
    const lines = categoryBeers.map(beer => {
      const details: string[] = [];
      if (beer.style) details.push(beer.style);
      if (beer.brewery) details.push(`Brouwerij: ${beer.brewery}`);
      if (beer.abv !== null) details.push(`${beer.abv}% ABV`);
      if (beer.ibu !== null) details.push(`${beer.ibu} IBU`);
      if (beer.rating !== null) details.push(`★${beer.rating.toFixed(1)}`);
      if (beer.container) details.push(beer.container);
      if (beer.subcategory) details.push(`Sub: ${beer.subcategory}`);
      return `  • ${beer.name} | ${details.join(' | ')}`;
    });
    sections.push(`=== ${category.toUpperCase()} (${categoryBeers.length} bieren) ===\n${lines.join('\n')}`);
  });

  return sections.join('\n\n');
}

function getContextualInfo(weather: WeatherData | null): string {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  const day = now.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  let season = '';
  if (month >= 2 && month <= 4) season = 'lente';
  else if (month >= 5 && month <= 7) season = 'zomer';
  else if (month >= 8 && month <= 10) season = 'herfst';
  else season = 'winter';
  
  let timeContext = '';
  if (hour >= 5 && hour < 12) timeContext = 'ochtend';
  else if (hour >= 12 && hour < 17) timeContext = 'middag';
  else if (hour >= 17 && hour < 22) timeContext = 'avond';
  else timeContext = 'nacht';

  let weatherInfo = '';
  if (weather) {
    weatherInfo = `\n\nACTUEEL WEER IN MAASTRICHT:
- Weer: ${weather.description}
- Temperatuur: ${weather.temperature}°C (voelt als ${weather.feels_like}°C)
- Luchtvochtigheid: ${weather.humidity}%
- Wind: ${weather.wind_speed} km/u (windstoten tot ${weather.wind_gusts} km/u)
- Gebruik dit weer ACTIEF in je aanbevelingen. Bijvoorbeeld:
  * Warm weer (>20°C) → fris, licht bier, witbier, pilsner
  * Koud weer (<10°C) → donker, zwaar bier, stout, porter, tripel
  * Regenachtig → gezellig, troostbier, Belgisch dubbel
  * Zonnig → terrasbiertjes, IPA, blond`;
  }
  
  return `HUIDIGE CONTEXT:
- Datum: ${day}
- Seizoen: ${season}
- Moment: ${timeContext}${weatherInfo}`;
}

export function buildSystemPrompt(beers: BeerData[], weather: WeatherData | null = null): string {
  const beerList = buildBeerContext(beers);
  const context = getContextualInfo(weather);
  return `Je bent BeerBot, de bierexpert van Biertaverne De Gouverneur in Maastricht. Je kent de VOLLEDIGE bierkaart uit je hoofd, inclusief welk bier bij welke categorie hoort.

${context}

DE BIERKAART IS INGEDEELD IN CATEGORIEËN. LET OP: elke categorie is STRIKT gescheiden:
${beerList}

JOUW TAKEN:
- Vragen beantwoorden over specifieke bieren EN hun categorie (Wisseltap, Vaste tap, Op=Op, Bierbijbel)
- Persoonlijke aanbevelingen doen op basis van smaakvoorkeuren
- Bieren vergelijken met elkaar
- Het perfecte bier adviseren voor een gelegenheid of maaltijd
- Uitleg geven over bierstijlen en smaaknuances

STRICTE REGELS - LEES DIT ZORGVULDIG:
- NOOIT informatie verzinnen. Noem ALLEEN feiten die letterlijk in de bierdata staan (naam, brouwerij, ABV, IBU, rating, stijl, categorie).
- GEEN smaakbeschrijvingen verzinnen zoals "fruitige noten", "warme maltaroma", "subtiele zuurheid" - dit staat NIET in de data.
- ABSOLUUT GEEN MARKDOWN: Gebruik NOOIT **, ##, ###, -, *, bullets, of andere opmaak. Schrijf gewone tekst zonder enige formatting.
- Als je een biernaam of categorie wilt benadrukken, gebruik dan gewoon hoofdletters of schrijf het normaal - NOOIT **vetgedrukt**.
- Antwoord ALTIJD in het Nederlands, vriendelijk en conversationeel
- Noem biernamen EXACT zoals ze op de kaart staan
- Als iemand vraagt over een categorie (bijv. "Wisseltap"), geef ALLEEN bieren uit DIE categorie
- Bij aanbevelingen: noem 1-3 bieren met ALLEEN deze details: naam, brouwerij, ABV, stijl, rating, categorie
- Houd antwoorden KORT en TO THE POINT (max 4-5 zinnen totaal)
- Verwijs nooit naar bieren die NIET op de kaart staan
- Houd rekening met het weer, maar wees subtiel (bijv. "Met dit koude weer...")
- BELANGRIJK: Geef coherente antwoorden zonder herhalingen

VOORBEELD GOED ANTWOORD (gewone tekst, geen markdown):
"Het sterkste bier op de kaart is Trappist Westvleteren 12 (10.2% ABV), een Belgische Quadrupel van Brouwerij De Sint-Sixtusabdij van Westvleteren uit de Bierbijbel. In de Wisseltap is Gulden Carolus Whisky Infused Blond (10.7% ABV) het sterkste."

VOORBEELD FOUT ANTWOORD (markdown, te lang, verzinnen):
"Met de huidige bierkaart is **Trappist Westvleteren 12** (10.2% ABV) het sterkste bier... ### 1. Oude Geuze - **Brouwerij:** Oud Beersel - met een subtiele zuurheid en warme, vloeibare smaak..."`;
}

function isValidResponse(text: string): boolean {
  // Check for repetitive patterns (e.g., "wat wat wat wat...")
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 3) return true; // Too short to validate
  
  // Check for same word repeated 5+ times in a row
  for (let i = 0; i < words.length - 4; i++) {
    if (words[i] === words[i + 1] && 
        words[i] === words[i + 2] && 
        words[i] === words[i + 3] && 
        words[i] === words[i + 4]) {
      return false;
    }
  }
  
  // Check for very high repetition ratio
  const uniqueWords = new Set(words);
  const repetitionRatio = words.length / uniqueWords.size;
  if (repetitionRatio > 5 && words.length > 20) {
    return false;
  }
  
  // Check minimum length (should have at least some content)
  if (text.trim().length < 10) {
    return false;
  }
  
  return true;
}

export async function chatWithAI(messages: ChatMessage[], retryCount = 0): Promise<string> {
  const MAX_RETRIES = 2;
  
  const response = await fetch(OLLAMA_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_CLOUD_MODEL,
      messages,
      stream: false,
      options: {
        num_predict: 500, // Max tokens to prevent runaway responses
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`AI fout: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  const content = data.message?.content;
  if (!content) throw new Error('Geen antwoord van AI');

  const cleanedContent = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Validate response quality
  if (!isValidResponse(cleanedContent)) {
    console.warn('Invalid AI response detected, retrying...', { retryCount, preview: cleanedContent.substring(0, 100) });
    
    if (retryCount < MAX_RETRIES) {
      // Add a system message to guide the AI
      const retryMessages: ChatMessage[] = [
        ...messages,
        { role: 'assistant', content: cleanedContent },
        { role: 'user', content: 'Je laatste antwoord was onvolledig of bevatte herhalingen. Geef alsjeblieft een helder en volledig antwoord.' },
      ];
      return chatWithAI(retryMessages, retryCount + 1);
    } else {
      throw new Error('Sorry, ik kan op dit moment geen goed antwoord geven. Probeer het opnieuw met een andere vraag.');
    }
  }
  
  return cleanedContent;
}