// src/hooks/useGameHistory.ts
import { useState, useEffect } from 'react';
import type { PongGame, ArkanoidScore } from '../types';

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
            const endpoint = game === 'pong' ? '/api/pong/history' : '/api/arkanoid/history';
            const res = await fetch(endpoint, { 
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
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
                const wins = (data.history as PongGame[]).filter(game => 
                    game.winner.includes('You') || game.winner.includes('Player 1')
                ).length;
                setStats({
                    wins,
                    total: data.history.length
                });
            } else if (game === 'arkanoid' && data.history) {
                const scores = (data.history as ArkanoidScore[]).map(s => s.score);
                const levels = (data.history as ArkanoidScore[]).map(s => s.level_reached);
                setStats({
                    highScore: Math.max(...scores),
                    highestLevel: Math.max(...levels)
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