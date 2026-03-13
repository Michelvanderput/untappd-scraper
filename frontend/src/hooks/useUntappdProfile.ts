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
        const data = await response.json();
        if (response.status === 404) {
          throw new Error(`Gebruiker "${username}" niet gevonden. Controleer of het profiel publiek is.`);
        }
        throw new Error(data.error || 'Er is iets misgegaan bij het ophalen van je profiel.');
      }

      const data = await response.json();

      const newProfile: UntappdProfile = {
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        totalCheckins: data.total_checkins,
        totalUnique: data.total_unique,
        beerUrls: data.beer_urls || [],
        fetchedAt: data.fetched_at,
      };

      setProfile(newProfile);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Onbekende fout';
      setError(message);
      throw e;
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
    // Normalize URLs for comparison - strip trailing slashes and compare paths
    const normalizeUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.pathname.replace(/\/$/, '').toLowerCase();
      } catch {
        return url.replace(/\/$/, '').toLowerCase();
      }
    };
    const normalizedTarget = normalizeUrl(beerUrl);
    return profile.beerUrls.some(url => normalizeUrl(url) === normalizedTarget);
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
