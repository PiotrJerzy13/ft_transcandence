import { useMemo } from 'react';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  averageScore?: number;
  winRate?: number;
  rating?: number;
}

export function usePlayerStatsCalculation(stats: PlayerStats) {
  return useMemo(() => {
    const winRate = stats.gamesPlayed > 0 
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

    const averageScore = stats.gamesPlayed > 0
      ? Math.round(stats.totalScore / stats.gamesPlayed)
      : 0;

    const rating = (stats.gamesWon * 25) + Math.floor(stats.totalScore / 100);

    const level = Math.floor(Math.sqrt(stats.gamesWon + 1));

    return {
      ...stats,
      winRate,
      averageScore,
      rating,
      level,
      isOnFireStreak: stats.currentStreak >= 5,
    };
  }, [stats]);
}

