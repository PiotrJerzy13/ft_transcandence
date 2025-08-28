// src/hooks/useGameHistory.ts
import { useState, useEffect } from 'react';
import type { PongGame, ArkanoidScore } from '../types';
import { API_ENDPOINTS } from '../config/api';

type GameHistory<T> = T[];

type PongStats = { wins?: number; total?: number };
type ArkanoidStats = { highScore?: number; highestLevel?: number };

type Stats = PongStats | ArkanoidStats;

export const useGameHistory = <T extends PongGame | ArkanoidScore>(game: 'pong' | 'arkanoid') => {
    const [history, setHistory] = useState<GameHistory<T>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({});

    const fetchHistory = async () => {
        try {
            const endpoint = game === 'pong' ? API_ENDPOINTS.PONG_HISTORY : API_ENDPOINTS.ARKANOID_HISTORY;
            const res = await fetch(endpoint, { 
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch ${game} history`);
            }
            
            const data = await res.json();
            setHistory(data.history || []);
            
            // Calculate some stats
            if (game === 'pong' && data.history) {
                // CORRECTED LOGIC
                const wins = (data.history as PongGame[]).filter(g => g.winner === 'player').length;
                setStats({
                    wins,
                    total: data.history.length
                });
            } else if (game === 'arkanoid' && data.history) {
                const scores = (data.history as ArkanoidScore[]).map(s => s.score);
                const levels = (data.history as ArkanoidScore[]).map(s => s.level_reached);
                setStats({
                    highScore: scores.length > 0 ? Math.max(...scores) : 0,
                    highestLevel: levels.length > 0 ? Math.max(...levels) : 1
                });
            }
        } catch (err) {
            console.error(`Error fetching ${game} history:`, err);
            setError(err instanceof Error ? err.message : `Failed to load ${game} history`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [game]);

    return { 
        history, 
        loading, 
        error, 
        stats,
        refetch: () => {
            setLoading(true);
            setError(null);
            fetchHistory();
        }
    };
};