// frontend/src/context/PlayerDataContext.tsx
import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (!res.ok) {
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
    fetchData();
  }, [fetchData]);

  const value = { playerData, loading, error, refetch: fetchData };

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
};
export default PlayerDataContext;