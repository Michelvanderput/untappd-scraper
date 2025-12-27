import type { BeerData } from '../types/beer';

// Beer style categories for smart pairing
const STYLE_CATEGORIES = {
  light: ['Wheat Beer', 'Witbier', 'Blanche', 'Hefeweizen', 'Kölsch', 'Pilsner', 'Lager'],
  hoppy: ['IPA', 'Pale Ale', 'Imperial IPA', 'Double IPA', 'Triple IPA'],
  dark: ['Stout', 'Porter', 'Brown Ale', 'Dunkel', 'Schwarzbier'],
  sour: ['Sour', 'Gose', 'Berliner Weisse', 'Lambic', 'Gueuze'],
  belgian: ['Belgian', 'Tripel', 'Dubbel', 'Quadrupel', 'Saison'],
  strong: ['Barleywine', 'Imperial', 'Strong Ale', 'Quadrupel'],
};

export interface MenuGenerationOptions {
  size: number;
  mode: 'random' | 'balanced' | 'journey' | 'party' | 'expert';
  preferences?: {
    minABV?: number;
    maxABV?: number;
    minRating?: number;
    excludeStyles?: string[];
  };
}

export interface GeneratedMenu {
  beers: BeerData[];
  theme: string;
  description: string;
  pairingNotes?: string[];
}

// Get style category for a beer
function getStyleCategory(beer: BeerData): string[] {
  const style = beer.style?.toLowerCase() || '';
  const categories: string[] = [];

  for (const [category, keywords] of Object.entries(STYLE_CATEGORIES)) {
    if (keywords.some(keyword => style.includes(keyword.toLowerCase()))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ['other'];
}

// Shuffle array
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate completely random menu
function generateRandomMenu(beers: BeerData[], size: number): GeneratedMenu {
  const selected = shuffle(beers).slice(0, size);
  
  return {
    beers: selected,
    theme: '🎲 Volledig Random',
    description: 'Een willekeurige selectie bieren voor de avonturiers!',
  };
}

// Generate balanced menu with variety
function generateBalancedMenu(beers: BeerData[], size: number): GeneratedMenu {
  const categories = ['light', 'hoppy', 'dark', 'belgian', 'sour'];
  const beersPerCategory = Math.floor(size / categories.length);
  const selected: BeerData[] = [];

  // Get beers from each category
  for (const category of categories) {
    const categoryBeers = beers.filter(beer => 
      getStyleCategory(beer).includes(category)
    );
    
    if (categoryBeers.length > 0) {
      const picks = shuffle(categoryBeers).slice(0, beersPerCategory);
      selected.push(...picks);
    }
  }

  // Fill remaining slots with random beers
  while (selected.length < size) {
    const remaining = beers.filter(b => !selected.includes(b));
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  return {
    beers: shuffle(selected).slice(0, size),
    theme: '⚖️ Gebalanceerd Menu',
    description: 'Een perfecte mix van licht, hoppy, donker en speciaal bier!',
    pairingNotes: [
      'Start met de lichtste bieren',
      'Werk toe naar de zwaardere smaken',
      'Eindig met iets bijzonders'
    ],
  };
}

// Generate tasting journey (light to heavy)
function generateJourneyMenu(beers: BeerData[], size: number): GeneratedMenu {
  const sortedByABV = [...beers].sort((a, b) => (a.abv || 0) - (b.abv || 0));
  
  // Pick evenly distributed beers across ABV range
  const step = Math.floor(sortedByABV.length / size);
  const selected: BeerData[] = [];
  
  for (let i = 0; i < size; i++) {
    const index = Math.min(i * step + Math.floor(Math.random() * step), sortedByABV.length - 1);
    selected.push(sortedByABV[index]);
  }

  return {
    beers: selected,
    theme: '🗺️ Smaak Reis',
    description: 'Een reis van licht naar zwaar, perfect voor een proeverij!',
    pairingNotes: [
      `Start: ${selected[0].name} (${selected[0].abv}%)`,
      `Midden: ${selected[Math.floor(size/2)].name} (${selected[Math.floor(size/2)].abv}%)`,
      `Finish: ${selected[size-1].name} (${selected[size-1].abv}%)`,
    ],
  };
}

// Generate party menu (crowd pleasers)
function generatePartyMenu(beers: BeerData[], size: number): GeneratedMenu {
  // Filter for high-rated, moderate ABV beers
  const partyBeers = beers
    .filter(b => 
      (b.rating || 0) >= 3.5 && 
      (b.abv || 0) >= 4 && 
      (b.abv || 0) <= 7
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const selected = shuffle(partyBeers).slice(0, size);

  return {
    beers: selected,
    theme: '🎉 Party Selectie',
    description: 'Top-rated bieren die iedereen lekker vindt!',
    pairingNotes: [
      'Allemaal crowd pleasers',
      'Niet te zwaar, niet te licht',
      'Perfect voor een gezellige avond',
    ],
  };
}

// Generate expert menu (unique & challenging)
function generateExpertMenu(beers: BeerData[], size: number): GeneratedMenu {
  // Prefer high ABV, unique styles, extreme IBU
  const expertBeers = beers
    .filter(b => 
      (b.abv || 0) >= 7 || 
      (b.ibu || 0) >= 60 ||
      (b.rating || 0) >= 4.0
    )
    .sort((a, b) => {
      const scoreA = (a.abv || 0) * 0.3 + (a.ibu || 0) * 0.3 + (a.rating || 0) * 0.4;
      const scoreB = (b.abv || 0) * 0.3 + (b.ibu || 0) * 0.3 + (b.rating || 0) * 0.4;
      return scoreB - scoreA;
    });

  const selected = shuffle(expertBeers).slice(0, size);

  return {
    beers: selected,
    theme: '🎓 Expert Selectie',
    description: 'Voor de echte bierkenners: uniek, krachtig en uitdagend!',
    pairingNotes: [
      'Hoge ABV en intense smaken',
      'Neem de tijd per bier',
      'Niet voor beginners!',
    ],
  };
}

// Main menu generation function
export function generateBeerMenu(
  beers: BeerData[],
  options: MenuGenerationOptions
): GeneratedMenu {
  let filteredBeers = [...beers];

  // Apply preferences
  if (options.preferences) {
    const { minABV, maxABV, minRating, excludeStyles } = options.preferences;
    
    if (minABV !== undefined) {
      filteredBeers = filteredBeers.filter(b => (b.abv || 0) >= minABV);
    }
    if (maxABV !== undefined) {
      filteredBeers = filteredBeers.filter(b => (b.abv || 0) <= maxABV);
    }
    if (minRating !== undefined) {
      filteredBeers = filteredBeers.filter(b => (b.rating || 0) >= minRating);
    }
    if (excludeStyles && excludeStyles.length > 0) {
      filteredBeers = filteredBeers.filter(b => 
        !excludeStyles.some(style => b.style?.toLowerCase().includes(style.toLowerCase()))
      );
    }
  }

  // Ensure we have enough beers
  if (filteredBeers.length < options.size) {
    filteredBeers = beers; // Fallback to all beers
  }

  // Generate based on mode
  switch (options.mode) {
    case 'random':
      return generateRandomMenu(filteredBeers, options.size);
    case 'balanced':
      return generateBalancedMenu(filteredBeers, options.size);
    case 'journey':
      return generateJourneyMenu(filteredBeers, options.size);
    case 'party':
      return generatePartyMenu(filteredBeers, options.size);
    case 'expert':
      return generateExpertMenu(filteredBeers, options.size);
    default:
      return generateRandomMenu(filteredBeers, options.size);
  }
}

// Generate pairing suggestions for a menu
export function generatePairingSuggestions(menu: GeneratedMenu): string[] {
  const suggestions: string[] = [];
  const beers = menu.beers;

  // ABV progression
  const avgABV = beers.reduce((sum, b) => sum + (b.abv || 0), 0) / beers.length;
  if (avgABV < 5) {
    suggestions.push('💡 Lichte sessie - perfect voor een lange middag');
  } else if (avgABV > 8) {
    suggestions.push('💡 Zware bieren - neem kleine slokken en geniet');
  } else {
    suggestions.push('💡 Gemiddelde sterkte - ideaal voor een avond');
  }

  // Style diversity
  const uniqueStyles = new Set(beers.map(b => b.style)).size;
  if (uniqueStyles === beers.length) {
    suggestions.push('🌈 Maximale variatie - elk bier is uniek!');
  } else if (uniqueStyles < beers.length / 2) {
    suggestions.push('🎯 Gefocuste selectie - vergelijk de subtiele verschillen');
  }

  // Rating insights
  const avgRating = beers.reduce((sum, b) => sum + (b.rating || 0), 0) / beers.length;
  if (avgRating >= 4.0) {
    suggestions.push('⭐ Top-rated selectie - alleen het beste!');
  } else if (avgRating >= 3.5) {
    suggestions.push('👍 Solide keuzes - beproefde kwaliteit');
  }

  return suggestions;
}
