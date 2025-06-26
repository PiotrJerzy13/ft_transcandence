import { Trophy, Zap, Target, Star, Crown, Clock } from "lucide-react";
import type { Achievement } from '../types';

export const iconMap: Record<string, React.ComponentType<any>> = {
  Trophy,
  Zap,
  Target,
  Star,
  Crown,
  Clock
};

export const defaultAchievements: Achievement[] = [
  {
    id: 1,
    name: "First Victory",
    description: "Win your first game",
    icon: "Trophy",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 2,
    name: "Speed Demon",
    description: "Win a game in under 60 seconds",
    icon: "Zap",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 3,
    name: "Sharpshooter",
    description: "Score 10 consecutive hits",
    icon: "Target",
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 4,
    name: "Rising Star",
    description: "Reach Pro rank",
    icon: "Star",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 5,
    name: "Unstoppable",
    description: "Win 10 games in a row",
    icon: "Crown",
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 6,
    name: "Marathon Player",
    description: "Play for 2 hours straight",
    icon: "Clock",
    unlocked: false,
    progress: 0,
    maxProgress: 120
  }
]; 