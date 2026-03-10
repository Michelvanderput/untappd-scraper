import type { BeerData } from '../types/beer';

const OLLAMA_PROXY_URL = '/api/ollama-proxy';
const OLLAMA_CLOUD_MODEL = import.meta.env.VITE_OLLAMA_CLOUD_MODEL || 'ministral-3:3b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildBeerContext(beers: BeerData[]): string {
  const lines = beers.map(beer => {
    const parts: string[] = [];
    parts.push(beer.name);
    if (beer.brewery) parts.push(`(${beer.brewery})`);

    const details: string[] = [];
    if (beer.style || beer.category) details.push(beer.style || beer.category || '');
    if (beer.abv !== null) details.push(`${beer.abv}% ABV`);
    if (beer.ibu !== null) details.push(`${beer.ibu} IBU`);
    if (beer.rating !== null) details.push(`★${beer.rating.toFixed(1)}`);
    if (beer.container) details.push(beer.container);

    return `• ${parts.join(' ')} | ${details.join(' | ')}`;
  });

  return lines.join('\n');
}

function getContextualInfo(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();
  const day = now.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Seasonal context
  let season = '';
  if (month >= 2 && month <= 4) season = 'lente';
  else if (month >= 5 && month <= 7) season = 'zomer';
  else if (month >= 8 && month <= 10) season = 'herfst';
  else season = 'winter';
  
  // Time of day
  let timeContext = '';
  if (hour >= 5 && hour < 12) timeContext = 'ochtend';
  else if (hour >= 12 && hour < 17) timeContext = 'middag';
  else if (hour >= 17 && hour < 22) timeContext = 'avond';
  else timeContext = 'nacht';
  
  return `HUIDIGE CONTEXT:
- Datum: ${day}
- Seizoen: ${season}
- Moment: ${timeContext}
- Tip: Houd rekening met het seizoen en tijdstip bij aanbevelingen (bijv. lichte bieren in de zomer, zwaardere bieren in de winter)`;
}

export function buildSystemPrompt(beers: BeerData[]): string {
  const beerList = buildBeerContext(beers);
  const context = getContextualInfo();
  return `Je bent BeerBot, een enthousiaste en deskundige bierexpert die bezoekers helpt het perfecte biertje te vinden op onze bierkaart. Je kent elk bier op de kaart door en door.

${context}

BESCHIKBARE BIEREN OP DE KAART:
${beerList}

JOUW TAKEN:
- Persoonlijke aanbevelingen doen op basis van smaakvoorkeuren (zoet, bitter, licht, zwaar, fruitig, etc.)
- Vragen beantwoorden over specifieke bieren (ABV, IBU, stijl, brouwerij, etc.)
- Bieren vergelijken met elkaar
- Het perfecte bier adviseren voor een bepaalde gelegenheid of maaltijd
- Uitleg geven over bierstijlen, brouwtechnieken en smaaknuances

RICHTLIJNEN:
- Antwoord ALTIJD in het Nederlands
- Wees enthousiast en vriendelijk, maar professioneel
- Houd antwoorden beknopt (max 3-4 zinnen per aanbeveling), tenzij de gebruiker meer wil weten
- Noem biernamen EXACT zoals ze op de kaart staan
- Als iemand vraagt om een aanbeveling, stel dan altijd 1-3 specifieke bieren voor met een korte uitleg waarom
- Verwijs nooit naar bieren die NIET op onze kaart staan
- Als je een bier aanbeveelt, noem dan de relevante details (ABV, stijl, smaakprofiel)
- Houd rekening met het seizoen en tijdstip voor contextgerichte aanbevelingen
- BELANGRIJK: Geef ALTIJD een coherent en volledig antwoord. Herhaal nooit dezelfde woorden of zinsdelen`;
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
