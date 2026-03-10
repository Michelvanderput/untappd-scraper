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

export function buildSystemPrompt(beers: BeerData[]): string {
  const beerList = buildBeerContext(beers);
  return `Je bent BeerBot, een enthousiaste en deskundige bierexpert die bezoekers helpt het perfecte biertje te vinden op onze bierkaart. Je kent elk bier op de kaart door en door.

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
- Als je een bier aanbeveelt, noem dan de relevante details (ABV, stijl, smaakprofiel)`;
}

export async function chatWithAI(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(OLLAMA_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_CLOUD_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`AI fout: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  const content = data.message?.content;
  if (!content) throw new Error('Geen antwoord van AI');

  return content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}
