// src/types.ts
export type ArkanoidScore = {
	score: number;
	level_reached: number;
	created_at: string;
	xp?: number;
};

export type PongGame = {
	created_at: string;
	mode: string;
	score: number;
	opponent_score: number;
	winner: 'player' | 'opponent';
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