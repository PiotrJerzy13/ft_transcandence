// src/types/database.ts
export interface User {
	id: number;
	username: string;
	email: string;
	password_hash: string;
	avatar_url?: string;
	status: 'online' | 'offline' | 'in_game';
	two_factor_secret?: string;
	two_factor_enabled?: boolean;
	backup_codes?: string;
	two_factor_setup_at?: string;
	created_at: string;
	updated_at: string;
  }
  
  export interface UserStats {
	id: number;
	user_id: number;
	total_games: number;
	wins: number;
	losses: number;
	win_streak: number;
	best_streak: number;
	total_play_time: number;
	rank: 'Novice' | 'Amateur' | 'Pro' | 'Expert' | 'Master';
	level: number;
	xp: number;
	created_at: string;
	updated_at: string;
  }
  
  export interface Achievement {
	id: number;
	name: string;
	description: string;
	icon: string;
	requirement_type: 'first_win' | 'game_duration' | 'win_streak' | 'games_played' | 'perfect_game' | 'play_time' | 'score_threshold' | 'level_reached';
	requirement_value: number;
	xp_reward: number;
	is_hidden: boolean;
	created_at: string;
	updated_at: string;
  }
  
  export interface UserAchievement {
	id: number;
	user_id: number;
	achievement_id: number;
	progress: number;
	unlocked_at?: string;
	created_at: string;
	updated_at: string;
  }
  
  export interface Tournament {
	id: number;
	name: string;
	description?: string;
	start_date?: string;
	end_date?: string;
	status: 'pending' | 'active' | 'completed' | 'cancelled';
	max_participants: number;
	created_by?: number;
	created_at: string;
	updated_at: string;
  }
  
  export interface TournamentParticipant {
	id: number;
	tournament_id: number;
	user_id: number;
	bracket_position?: number;
	status: 'active' | 'eliminated' | 'winner';
	created_at: string;
	updated_at: string;
  }
  
  export interface Match {
	id: number;
	tournament_id?: number;
	player1_id: number;
	player2_id: number;
	player1_score: number;
	player2_score: number;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	duration: number;
	played_at?: string;
	winner_id?: number;
	created_at: string;
	updated_at: string;
  }
  
  export interface PongMatch {
	id: number;
	user_id: number;
	mode: 'one-player' | 'two-player';
	score: number;
	opponent_score: number;
	winner: 'player' | 'opponent';
	xp_earned: number;
	total_xp: number;
	duration: number;
	created_at: string;
	updated_at: string;
  }
  
  export interface ArkanoidScore {
	id: number;
	user_id: number;
	score: number;
	xp_earned: number;
	level_reached: number;
	blocks_destroyed: number;
	power_ups_collected: number;
	duration: number;
	created_at: string;
	updated_at: string;
  }
  
  // Database interface for better type safety
  export interface Database {
	users: User;
	user_stats: UserStats;
	achievements: Achievement;
	user_achievements: UserAchievement;
	tournaments: Tournament;
	tournament_participants: TournamentParticipant;
	matches: Match;
	pong_matches: PongMatch;
	arkanoid_scores: ArkanoidScore;
  }