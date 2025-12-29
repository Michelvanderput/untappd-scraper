import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { BeerData } from '../types/beer';

interface ComparisonContextType {
  comparisonBeers: BeerData[];
  addToComparison: (beer: BeerData) => void;
  removeFromComparison: (beerUrl: string) => void;
  clearComparison: () => void;
  isInComparison: (beerUrl: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonBeers, setComparisonBeers] = useState<BeerData[]>([]);

  const addToComparison = (beer: BeerData) => {
    setComparisonBeers(prev => {
      if (prev.length >= 4) {
        alert('Je kunt maximaal 4 bieren vergelijken');
        return prev;
      }
      if (prev.some(b => b.beer_url === beer.beer_url)) {
        return prev;
      }
      return [...prev, beer];
    });
  };

  const removeFromComparison = (beerUrl: string) => {
    setComparisonBeers(prev => prev.filter(b => b.beer_url !== beerUrl));
  };

  const clearComparison = () => {
    setComparisonBeers([]);
  };

  const isInComparison = (beerUrl: string) => {
    return comparisonBeers.some(b => b.beer_url === beerUrl);
  };

  return (
    <ComparisonContext.Provider value={{
      comparisonBeers,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
