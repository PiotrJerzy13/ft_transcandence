// src/types.ts
export type ArkanoidScore = {
	score: number;
	level_reached: number;
	created_at: string;
  };
  
  export type PongGame = {
	created_at: string;
	mode: string;
	left_score: number;
	right_score: number;
	winner: string;
  };
  
  export type PlayerStats = {
	level: number;
	xp: number;
	xpToNext: number;
	rank: string;
	wins: number;
	losses: number;
	totalGames: number;
	winStreak: number;
	bestStreak: number;
	totalPlayTime: string;
  };
  
  export type Achievement = {
	id: number;
	name: string;
	description: string;
	icon: string;
	unlocked: boolean;
	progress: number;
	maxProgress: number;
	date?: string;
  };