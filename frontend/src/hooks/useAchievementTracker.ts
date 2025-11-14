import { useState, useCallback } from 'react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export function useAchievementTracker() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const checkAndUnlock = useCallback((achievement: Achievement) => {
    if (!achievement.unlocked) {
      const updatedAchievement = {
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      
      setAchievements(prev => [...prev, updatedAchievement]);
      setNewAchievements(prev => [...prev, updatedAchievement]);
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setNewAchievements(prev => prev.filter(a => a.id !== achievement.id));
      }, 5000);
    }
  }, []);

  const updateProgress = useCallback((achievementId: string, newProgress: number) => {
    setAchievements(prev =>
      prev.map(a =>
        a.id === achievementId ? { ...a, progress: newProgress } : a
      )
    );
  }, []);

  const getUnlockedCount = useCallback(() => {
    return achievements.filter(a => a.unlocked).length;
  }, [achievements]);

  return {
    achievements,
    newAchievements,
    checkAndUnlock,
    updateProgress,
    getUnlockedCount,
  };
}

