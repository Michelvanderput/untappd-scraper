import type { BeerData } from '../types/beer';

export interface BeerdleGuess {
  beer: BeerData;
  abvMatch: 'correct' | 'higher' | 'lower';
  ratingMatch: 'correct' | 'higher' | 'lower';
  styleMatch: 'correct' | 'incorrect';
  breweryMatch: 'correct' | 'incorrect';
  categoryMatch: 'correct' | 'incorrect';
}

export interface BeerdleGameState {
  date: string;
  targetBeerUrl: string;
  guesses: BeerdleGuess[];
  completed: boolean;
  won: boolean;
}

// Get daily beer based on date (deterministic)
export const getDailyBeer = (beers: BeerData[], date: Date = new Date()): BeerData => {
  // Use date as seed for deterministic selection
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // Filter beers with minimum data quality
  const validBeers = beers.filter(beer => 
    beer.rating && 
    beer.abv && 
    beer.style && 
    beer.brewery &&
    beer.rating >= 3.0 // Only well-rated beers
  );
  
  if (validBeers.length === 0) return beers[0];
  
  const index = seed % validBeers.length;
  return validBeers[index];
};

// Get today's date string
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Load game state from localStorage
export const loadGameState = (): BeerdleGameState | null => {
  try {
    const saved = localStorage.getItem('beerdle_state');
    if (!saved) return null;
    
    const state = JSON.parse(saved) as BeerdleGameState;
    
    // Check if it's still today's game
    if (state.date !== getTodayString()) {
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
};

// Save game state to localStorage
export const saveGameState = (state: BeerdleGameState): void => {
  try {
    localStorage.setItem('beerdle_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

// Compare guess with target beer
export const compareBeers = (guess: BeerData, target: BeerData): BeerdleGuess => {
  const abvDiff = (guess.abv || 0) - (target.abv || 0);
  const ratingDiff = (guess.rating || 0) - (target.rating || 0);
  
  return {
    beer: guess,
    abvMatch: Math.abs(abvDiff) < 0.1 ? 'correct' : abvDiff > 0 ? 'lower' : 'higher',
    ratingMatch: Math.abs(ratingDiff) < 0.05 ? 'correct' : ratingDiff > 0 ? 'lower' : 'higher',
    styleMatch: guess.style === target.style ? 'correct' : 'incorrect',
    breweryMatch: guess.brewery === target.brewery ? 'correct' : 'incorrect',
    categoryMatch: guess.category === target.category ? 'correct' : 'incorrect',
  };
};

// Check if guess is correct
export const isCorrectGuess = (guess: BeerdleGuess): boolean => {
  return guess.beer.beer_url === guess.beer.beer_url && 
         guess.abvMatch === 'correct' &&
         guess.ratingMatch === 'correct' &&
         guess.styleMatch === 'correct' &&
         guess.breweryMatch === 'correct';
};

// Get share text for social media
export const getShareText = (state: BeerdleGameState): string => {
  const emoji = state.won ? '🎉' : '😢';
  const attempts = state.guesses.length;
  const maxAttempts = 6;
  
  let grid = '';
  state.guesses.forEach(guess => {
    const isWin = guess.abvMatch === 'correct' && 
                  guess.ratingMatch === 'correct' && 
                  guess.styleMatch === 'correct' &&
                  guess.breweryMatch === 'correct';
    grid += isWin ? '🟩' : '🟨';
  });
  
  // Add remaining attempts as empty
  for (let i = attempts; i < maxAttempts; i++) {
    grid += '⬜';
  }
  
  return `Beerdle ${state.date} ${emoji}\n${attempts}/${maxAttempts}\n${grid}`;
};
