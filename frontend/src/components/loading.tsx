export interface GameConfig {
    width: number;
    height: number;
    fps: number;
    difficulty: 'easy' | 'normal' | 'hard';
  }

  export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    averageScore: number;
  }
  
  export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }