// src/hooks/usePlayerAchievements.ts
import { useState, useEffect } from 'react';
import type { Achievement } from '../types';
import { defaultAchievements } from '../constants/achievements'; // Move default achievements to constants

export const usePlayerAchievements = () => {
    const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAchievements = async () => {
        try {
            const res = await fetch('/api/user/achievements', { 
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch achievements');
            }
            
            const data = await res.json();
            // Merge with default achievements to ensure all are present
            const mergedAchievements = defaultAchievements.map(defaultAch => {
                const serverAch = data.achievements?.find((a: Achievement) => a.id === defaultAch.id);
                return serverAch ? { ...defaultAch, ...serverAch } : defaultAch;
            });
            
            setAchievements(mergedAchievements);
        } catch (err) {
            console.error("Error fetching achievements:", err);
            setError(err instanceof Error ? err.message : 'Failed to load achievements');
            // Fallback to default achievements if API fails
            setAchievements(defaultAchievements);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    return { 
        achievements, 
        loading, 
        error,
        unlockedCount: achievements.filter(a => a.unlocked).length,
        totalCount: achievements.length,
        refetch: () => {
            setLoading(true);
            setError(null);
            fetchAchievements();
        }
    };
};