# Ollama AI Implementatie Guide

Deze guide legt uit hoe je de Ollama AI-implementatie uit dit project kunt overbrengen naar andere projecten. De implementatie ondersteunt zowel lokale Ollama als Ollama Cloud via een proxy.

## 📋 Overzicht

Dit project gebruikt een flexibele AI-architectuur met drie opties:
- **Ollama Cloud** (aanbevolen): Gratis, werkt overal, via backend proxy
- **Ollama Local**: Gratis, alleen desktop, vereist lokale installatie
- **OpenAI**: Betaald alternatief

## 🏗️ Architectuur

### Bestandsstructuur
```
project/
├── src/
│   └── lib/
│       ├── ollama.ts          # Ollama client functies (local + cloud)
│       └── ai.ts              # AI provider abstraction layer
├── api/
│   └── ollama-proxy.ts        # Vercel serverless proxy voor Ollama Cloud
└── .env                       # Environment variabelen
```

### Belangrijke Componenten

1. **`ollama.ts`**: Bevat alle Ollama-specifieke logica
2. **`ai.ts`**: Abstractie laag voor het switchen tussen providers
3. **`ollama-proxy.ts`**: Backend proxy om CORS te vermijden en API key te beschermen

## 🚀 Stap-voor-Stap Implementatie

### Stap 1: Dependencies Installeren

```bash
npm install ollama
npm install --save-dev @vercel/node
```

**Package versies:**
- `ollama`: ^0.6.3
- `@vercel/node`: ^5.6.11

### Stap 2: Environment Variabelen Configureren

Maak een `.env` bestand aan:

```env
# Ollama Cloud (AANBEVOLEN - gratis, werkt overal)
# Haal je gratis API key op van: https://ollama.com/settings/keys
VITE_OLLAMA_API_KEY=your-ollama-api-key-here
VITE_OLLAMA_CLOUD_MODEL=ministral-3:3b

# Ollama Local (optioneel - voor desktop development)
VITE_OLLAMA_HOST=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

**Belangrijke noten:**
- Voor Vercel deployment: Voeg `VITE_OLLAMA_API_KEY` toe in Vercel project settings
- De API key wordt ALLEEN server-side gebruikt (niet in browser)
- Ollama Local vereist dat je Ollama lokaal draait (`ollama serve`)

### Stap 3: Ollama Client Implementeren

Maak `src/lib/ollama.ts`:

```typescript
import { Ollama } from 'ollama/browser'

const ollamaHost = import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434'
const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2'
const ollamaCloudModel = import.meta.env.VITE_OLLAMA_CLOUD_MODEL || 'ministral-3:3b'

// Local Ollama client
const ollamaLocal = new Ollama({ host: ollamaHost })

// Cloud Ollama - gebruikt backend proxy om CORS te vermijden
const ollamaCloudProxyUrl = '/api/ollama-proxy'

export interface ParsedTask {
  title: string
}

// LOCAL OLLAMA FUNCTIE
export async function parseBrainDump(input: string): Promise<ParsedTask[]> {
  const response = await ollamaLocal.chat({
    model: ollamaModel,
    messages: [
      {
        role: 'system',
        content: `Je systeem prompt hier`,
      },
      {
        role: 'user',
        content: input,
      },
    ],
    format: 'json',
    stream: false,
  })

  const content = response.message.content
  if (!content) throw new Error('No response from AI')

  const parsed = JSON.parse(content)
  return parsed.tasks as ParsedTask[]
}

// CLOUD OLLAMA FUNCTIE
export async function parseBrainDumpCloud(input: string): Promise<ParsedTask[]> {
  const response = await fetch(ollamaCloudProxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ollamaCloudModel,
      messages: [
        {
          role: 'system',
          content: `Je systeem prompt hier`,
        },
        {
          role: 'user',
          content: input,
        },
      ],
      format: 'json',
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Ollama Cloud API error: ${error.error || response.statusText}`)
  }

  const data = await response.json()
  const content = data.message?.content
  if (!content) throw new Error('No response from AI')

  // Strip markdown code blocks indien aanwezig (```json ... ```)
  const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  
  const parsed = JSON.parse(cleanContent)
  return parsed.tasks as ParsedTask[]
}
```

### Stap 4: Backend Proxy Implementeren (Vercel)

Maak `api/ollama-proxy.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Alleen POST requests toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Haal Ollama API key uit environment
  const apiKey = process.env.VITE_OLLAMA_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Ollama API key not configured' })
  }

  try {
    // Forward request naar Ollama Cloud API
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error:', errorText)
      return res.status(response.status).json({ 
        error: 'Ollama API request failed',
        details: errorText 
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ 
      error: 'Failed to proxy request to Ollama',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
```

### Stap 5: AI Provider Abstraction Layer (Optioneel)

Als je meerdere AI providers wilt ondersteunen, maak `src/lib/ai.ts`:

```typescript
import * as ollama from './ollama'

export type AIProvider = 'ollama-local' | 'ollama-cloud'

let currentProvider: AIProvider = 'ollama-cloud'

export function setAIProvider(provider: AIProvider) {
  currentProvider = provider
}

export function getAIProvider(): AIProvider {
  return currentProvider
}

export async function parseBrainDump(input: string) {
  switch (currentProvider) {
    case 'ollama-cloud':
      return ollama.parseBrainDumpCloud(input)
    case 'ollama-local':
      return ollama.parseBrainDump(input)
    default:
      return ollama.parseBrainDumpCloud(input)
  }
}
```

## 🔧 Gebruik in je Applicatie

### Voorbeeld: AI functie aanroepen

```typescript
import { parseBrainDumpCloud } from './lib/ollama'

async function handleUserInput(input: string) {
  try {
    const tasks = await parseBrainDumpCloud(input)
    console.log('Parsed tasks:', tasks)
  } catch (error) {
    console.error('AI error:', error)
  }
}
```

### Voorbeeld: Provider switchen

```typescript
import { setAIProvider, parseBrainDump } from './lib/ai'

// Switch naar local Ollama
setAIProvider('ollama-local')
const tasks = await parseBrainDump(input)

// Switch naar cloud Ollama
setAIProvider('ollama-cloud')
const tasks = await parseBrainDump(input)
```

## 📝 Belangrijke Overwegingen

### 1. **CORS en Security**
- **Probleem**: Browser kan niet direct naar Ollama Cloud API vanwege CORS
- **Oplossing**: Backend proxy (`/api/ollama-proxy`) die requests forwarded
- **Voordeel**: API key blijft server-side en wordt niet geëxposed aan browser

### 2. **JSON Response Parsing**
Ollama kan soms markdown code blocks teruggeven:
```typescript
// Strip markdown code blocks
const cleanContent = content
  .replace(/```json\s*/g, '')
  .replace(/```\s*/g, '')
  .trim()
```

### 3. **Model Keuze**
- **Cloud**: `ministral-3:3b` - Klein, snel, gratis
- **Local**: `llama3.2` - Grotere modellen mogelijk, meer controle

### 4. **Error Handling**
Implementeer altijd goede error handling:
```typescript
try {
  const result = await parseBrainDumpCloud(input)
} catch (error) {
  if (error instanceof Error) {
    console.error('AI Error:', error.message)
  }
  // Fallback logica hier
}
```

## 🌐 Deployment (Vercel)

### Vercel Configuration

1. **Environment Variabelen instellen**:
   - Ga naar Vercel Dashboard → Project Settings → Environment Variables
   - Voeg `VITE_OLLAMA_API_KEY` toe

2. **Vercel.json** (optioneel):
```json
{
  "functions": {
    "api/ollama-proxy.ts": {
      "maxDuration": 30
    }
  }
}
```

3. **Deploy**:
```bash
npm run build
vercel deploy
```

## 🧪 Testen

### Local Ollama Testen
```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama3.2

# Test in je app
setAIProvider('ollama-local')
```

### Cloud Ollama Testen
```bash
# Zorg dat API key is ingesteld
# Test in je app
setAIProvider('ollama-cloud')
```

## 🔄 Aanpassen voor je Project

### 1. **Wijzig de Prompts**
Pas de system prompts aan in `ollama.ts`:
```typescript
{
  role: 'system',
  content: `Je eigen systeem prompt hier voor je specifieke use case`,
}
```

### 2. **Wijzig Response Types**
Definieer je eigen interfaces:
```typescript
export interface YourCustomType {
  field1: string
  field2: number
}
```

### 3. **Voeg Nieuwe Functies Toe**
Volg het patroon:
```typescript
export async function yourNewFunction(input: string) {
  const response = await ollamaLocal.chat({
    model: ollamaModel,
    messages: [...],
    format: 'json',
    stream: false,
  })
  // Parse en return
}
```

## 📚 Nuttige Resources

- **Ollama Documentatie**: https://ollama.com/docs
- **Ollama API Keys**: https://ollama.com/settings/keys
- **Ollama Models**: https://ollama.com/library
- **Vercel Serverless Functions**: https://vercel.com/docs/functions

## ⚠️ Veelvoorkomende Problemen

### "Ollama API key not configured"
- Check of `.env` bestand bestaat
- Voor Vercel: Check environment variables in dashboard

### "CORS error"
- Gebruik altijd de proxy voor Cloud Ollama
- Gebruik NOOIT direct `https://ollama.com/api/chat` vanuit browser

### "No response from AI"
- Check of model beschikbaar is
- Voor local: `ollama list` om geïnstalleerde modellen te zien
- Voor cloud: Check of API key geldig is

### JSON Parse Error
- Gebruik de markdown cleanup code
- Voeg `format: 'json'` toe aan chat request
- Maak prompts duidelijker over JSON format

## 🎯 Checklist voor Nieuwe Projecten

- [ ] `npm install ollama @vercel/node`
- [ ] Maak `src/lib/ollama.ts`
- [ ] Maak `api/ollama-proxy.ts`
- [ ] Configureer `.env` bestand
- [ ] Test local Ollama (optioneel)
- [ ] Test cloud Ollama via proxy
- [ ] Voeg environment variables toe aan Vercel
- [ ] Deploy en test in productie

## 💡 Tips

1. **Start met Cloud Ollama** - Makkelijkste setup, werkt overal
2. **Gebruik JSON format** - Betrouwbaardere parsing
3. **Implementeer goede error handling** - AI calls kunnen falen
4. **Test beide providers** - Geeft flexibiliteit
5. **Houd prompts simpel** - Betere en consistentere resultaten

---

**Vragen of problemen?** Check de originele implementatie in dit project voor werkende voorbeelden!
