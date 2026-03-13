import { createContext, useContext, type ReactNode } from 'react';
import { useUntappdProfile } from '../hooks/useUntappdProfile';
import type { UntappdProfile } from '../hooks/useUntappdProfile';

interface UntappdProfileContextType {
  profile: UntappdProfile | null;
  isLoading: boolean;
  error: string | null;
  connectProfile: (username: string) => Promise<void>;
  disconnectProfile: () => void;
  refreshProfile: () => Promise<void>;
  hasDrunk: (beerUrl: string) => boolean;
  drunkCount: number;
}

const UntappdProfileContext = createContext<UntappdProfileContextType | undefined>(undefined);

export function UntappdProfileProvider({ children }: { children: ReactNode }) {
  const profileHook = useUntappdProfile();

  return (
    <UntappdProfileContext.Provider value={profileHook}>
      {children}
    </UntappdProfileContext.Provider>
  );
}

export function useUntappdProfileContext() {
  const context = useContext(UntappdProfileContext);
  if (context === undefined) {
    throw new Error('useUntappdProfileContext must be used within a UntappdProfileProvider');
  }
  return context;
}
