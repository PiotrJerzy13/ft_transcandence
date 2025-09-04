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

// Multiplayer Game Types for Phase 3
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface PlayerGameState {
  id: number;
  username: string;
  position: Position;
  score: number;
  isReady: boolean;
  lastAction: number;
}

export interface BallState {
  position: Position;
  velocity: Velocity;
  radius: number;
  lastUpdate: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export interface GameState {
  sessionId: string;
  gameType: string;
  status: GameStatus;
  players: PlayerGameState[];
  ball: BallState;
  gameSettings: GameSettings;
  startTime?: number;
  lastUpdate: number;
  frameCount: number;
}

export interface GameSettings {
  width: number;
  height: number;
  paddleWidth: number;
  paddleHeight: number;
  ballRadius: number;
  maxScore: number;
  countdownDuration: number;
}

export interface PlayerAction {
  type: 'move_paddle' | 'ready' | 'pause' | 'resume';
  sessionId: string;
  playerId: number;
  timestamp: number;
  data: {
    direction?: 'up' | 'down' | 'stop';
    position?: Position;
    [key: string]: any;
  };
}

export interface GameEvent {
  type: 'ball_hit' | 'score_change' | 'game_start' | 'game_end' | 'player_ready' | 'countdown';
  sessionId: string;
  timestamp: number;
  data: {
    playerId?: number;
    score?: number;
    position?: Position;
    countdown?: number;
    [key: string]: any;
  };
}

export interface GameStateMessage {
  type: 'game_state_update';
  sessionId: string;
  gameState: GameState;
  timestamp: number;
}

export interface PlayerActionMessage {
  type: 'player_action';
  action: PlayerAction;
}

export interface GameEventMessage {
  type: 'game_event';
  event: GameEvent;
}

export interface GameControlMessage {
  type: 'game_control';
  sessionId: string;
  control: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: number;
}

export type GameMessage = GameStateMessage | PlayerActionMessage | GameEventMessage | GameControlMessage;

export interface WebSocketStats {
  totalPlayers: number;
  totalGameRooms: number;
  players: Array<{ id: number; username: string }>;
  gameRooms: any[];
}

export interface MatchmakingStatus {
  success: boolean;
  queueEntries: Array<{
    id: number;
    playerId: number;
    username: string;
    gameType: string;
    joinedAt: string;
  }>;
}