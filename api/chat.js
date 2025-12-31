import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  let beerContext = '';
  try {
    // Load beer data
    const beersPath = path.join(process.cwd(), 'beers.json');
    if (!fs.existsSync(beersPath)) {
        console.error('beers.json not found at:', beersPath);
        throw new Error('Beer data not available');
    }
    const data = JSON.parse(fs.readFileSync(beersPath, 'utf-8'));
    
    // Create a simplified context of the beer menu to save tokens
    beerContext = data.beers.map(b => 
      `- ${b.name} (${b.style}, ${b.abv}%, ${b.brewery}) - Rating: ${b.rating || 'N/A'}`
    ).join('\n');
  } catch (error) {
    console.error('Error loading beer data:', error);
    // Fallback or error? Let's error for now as the bot needs data
    return res.status(500).json({ error: 'Failed to load beer menu data' });
  }

  try {
    const systemPrompt = `
Je bent "De Gouverneur Bot", de virtuele biersommelier van Biertaverne De Gouverneur.
Je helpt gasten bij het kiezen van een biertje van de kaart.
Je bent vriendelijk, deskundig en enthousiast over speciaalbier.

Hier is de huidige bierkaart van De Gouverneur:
${beerContext}

Instructies:
1. Baseer je advies ALTIJD op de bovenstaande bierkaart.
2. Als iemand vraagt om een specifiek type (bijv. "fruitig" of "bitter"), zoek dan bieren die daarbij passen.
3. Geef maximaal 3 suggesties per keer, tenzij anders gevraagd.
4. Vertel kort waarom je deze bieren aanraadt (bijv. smaakprofiel, brouwerij).
5. Als je het niet zeker weet, vraag dan naar de voorkeuren van de gast (bijv. "Hou je van blond, donker, zoet of bitter?").
6. Spreek Nederlands.
7. Hou je antwoorden beknopt en leesbaar.

Gebruiker vraagt: "${message}"
    `.trim();

    const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const json = await response.json();

    if (json.error) {
        console.error('OpenAI API Error:', json.error);
        throw new Error(json.error.message || 'OpenAI API Error');
    }

    const aiResponse = json.choices[0].message.content;

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
