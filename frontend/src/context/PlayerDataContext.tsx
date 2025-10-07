// frontend/src/context/PlayerDataContext.tsx
import { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { PlayerStats, Achievement } from '../types';

interface PlayerData {
  user: { id: number; username: string; email: string; } | null;
  stats: PlayerStats | null;
  achievements: Achievement[];
}

interface PlayerDataContextType {
  playerData: PlayerData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PlayerDataContext = createContext<PlayerDataContextType | undefined>(undefined);

export const usePlayerData = () => {
  const context = useContext(PlayerDataContext);
  if (!context) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider');
  }
  return context;
};

export const PlayerDataProvider = ({ children }: { children: ReactNode }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false); // Start with false since we don't fetch on mount
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    // Add initial delay on first attempt to avoid race condition with cookie setting
    if (retryCount === 0) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    try {
      console.log(`[PlayerData] Attempt ${retryCount + 1}: Starting authentication check...`);
      console.log(`[PlayerData] Current cookies:`, document.cookie);
      
      // First check if user is authenticated
      const authRes = await fetch('/api/user/me', {
        credentials: 'include',
      });
      
      console.log(`[PlayerData] Auth check response:`, {
        status: authRes.status,
        ok: authRes.ok,
        headers: Object.fromEntries(authRes.headers.entries())
      });
      
      if (!authRes.ok) {
        // User is not authenticated, don't fetch profile
        console.log('Auth check failed, user not authenticated');
        setPlayerData(null);
        setLoading(false);
        return;
      }

      console.log('Auth check passed, fetching profile...');
      const res = await fetch('/api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      console.log(`[PlayerData] Profile fetch response:`, {
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        if (res.status === 401 && retryCount < 3) {
          // Retry after increasing delay for potential race condition
          const delay = (retryCount + 1) * 300; // 300ms, 600ms, 900ms
          console.log(`[PlayerData] Profile fetch failed with 401, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          setTimeout(() => fetchData(retryCount + 1), delay);
          return;
        }
        if (res.status === 401) {
          // Don't treat this as an error, just means user is not logged in
          setPlayerData(null);
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const data = await res.json();
      
      // Transform data here once
      const transformedStats: PlayerStats = {
        ...data.stats,
        totalPlayTime: data.stats.totalPlayTime || "0h 0m",
      };
      
      setPlayerData({
        user: data.user,
        stats: transformedStats,
        achievements: data.achievements,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error("Error fetching player data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Don't fetch automatically on mount - let protected routes trigger it
    // This prevents unnecessary calls when user is on login page
    console.log('[PlayerData] Provider mounted, waiting for explicit fetch call');
  }, []);

  const value = useMemo(() => ({ 
    playerData, 
    loading, 
    error, 
    refetch: fetchData 
  }), [playerData, loading, error, fetchData]);

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
};
export default PlayerDataContext;