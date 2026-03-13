import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'untappdProfile';

export interface UntappdProfile {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalCheckins: number | null;
  totalUnique: number | null;
  beerUrls: string[];
  fetchedAt: string;
}

interface UseUntappdProfileReturn {
  profile: UntappdProfile | null;
  isLoading: boolean;
  error: string | null;
  connectProfile: (username: string) => Promise<void>;
  disconnectProfile: () => void;
  refreshProfile: () => Promise<void>;
  hasDrunk: (beerUrl: string) => boolean;
  drunkCount: number;
}

export function useUntappdProfile(): UseUntappdProfileReturn {
  const [profile, setProfile] = useState<UntappdProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load Untappd profile:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage when profile changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  const fetchProfile = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-beers?username=${encodeURIComponent(username)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user beers');
      }

      const data = await response.json();

      const newProfile: UntappdProfile = {
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        totalCheckins: data.total_checkins,
        totalUnique: data.total_unique,
        beerUrls: data.beer_urls,
        fetchedAt: data.fetched_at,
      };

      setProfile(newProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectProfile = useCallback(async (username: string) => {
    await fetchProfile(username);
  }, [fetchProfile]);

  const disconnectProfile = useCallback(() => {
    setProfile(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (profile?.username) {
      await fetchProfile(profile.username);
    }
  }, [profile?.username, fetchProfile]);

  const hasDrunk = useCallback((beerUrl: string) => {
    if (!profile?.beerUrls) return false;
    
    // Extract beer ID from URL (the number at the end)
    // Example: https://untappd.com/b/brewery-name-beer-name/12345 -> 12345
    const extractBeerId = (url: string): string | null => {
      try {
        const match = url.match(/\/b\/[^/]+\/(\d+)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    };
    
    const targetId = extractBeerId(beerUrl);
    if (!targetId) return false;
    
    // Check if any of the user's beers has the same ID
    return profile.beerUrls.some(url => {
      const id = extractBeerId(url);
      return id === targetId;
    });
  }, [profile?.beerUrls]);

  return {
    profile,
    isLoading,
    error,
    connectProfile,
    disconnectProfile,
    refreshProfile,
    hasDrunk,
    drunkCount: profile?.beerUrls?.length || 0,
  };
}
