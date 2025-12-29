import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (beerUrl: string) => void;
  removeFavorite: (beerUrl: string) => void;
  isFavorite: (beerUrl: string) => boolean;
  toggleFavorite: (beerUrl: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (beerUrl: string) => {
    setFavorites(prev => {
      if (prev.includes(beerUrl)) return prev;
      return [...prev, beerUrl];
    });
  };

  const removeFavorite = (beerUrl: string) => {
    setFavorites(prev => prev.filter(url => url !== beerUrl));
  };

  const isFavorite = (beerUrl: string) => {
    return favorites.includes(beerUrl);
  };

  const toggleFavorite = (beerUrl: string) => {
    if (isFavorite(beerUrl)) {
      removeFavorite(beerUrl);
    } else {
      addFavorite(beerUrl);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
