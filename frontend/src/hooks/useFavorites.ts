import { useState, useEffect } from 'react';

const STORAGE_KEY = 'beerFavorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedFavorites = localStorage.getItem(STORAGE_KEY);
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (beerUrl: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(beerUrl)) {
        newFavorites.delete(beerUrl);
      } else {
        newFavorites.add(beerUrl);
      }
      return newFavorites;
    });
  };

  const isFavorite = (beerUrl: string) => favorites.has(beerUrl);

  const clearFavorites = () => setFavorites(new Set());

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.size
  };
}
