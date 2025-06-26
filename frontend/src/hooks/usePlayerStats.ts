// src/hooks/usePlayerStats.ts
import { useState, useEffect } from 'react';
import type { PlayerStats } from '../types';

export const usePlayerStats = () => {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/user/profile', { 
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch profile');
            }

            const data = await res.json();
            
            // More complete transformation
            const transformedStats: PlayerStats = {
                level: data.level || data.stats?.level || 1,
                xp: data.xp || data.stats?.xp || 0,
                xpToNext: data.xp ? (1000 - (data.xp % 1000)) : 1000,
                rank: data.rank || data.stats?.rank || "Novice",
                wins: data.wins || data.stats?.wins || 0,
                losses: data.losses || data.stats?.losses || 0,
                totalGames: (data.wins || 0) + (data.losses || 0) || data.stats?.total_games || 0,
                winStreak: data.win_streak || data.stats?.win_streak || 0,
                bestStreak: data.best_streak || data.stats?.best_streak || 0,
                totalPlayTime: data.total_play_time || data.stats?.total_play_time || "0h 0m"
            };
            
            setStats(transformedStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error("Error fetching player stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, error, refetch: () => {
        setLoading(true);
        setError(null);
        fetchStats();
    }};
};