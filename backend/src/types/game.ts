// Game State Types for Phase 2: Game State Synchronization

// Basic position and vector types
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

// Player state in the game
export interface PlayerGameState {
  id: number;
  username: string;
  position: Position;
  score: number;
  isReady: boolean;
  lastAction: number; // timestamp of last action
}

// Ball state
export interface BallState {
  position: Position;
  velocity: Velocity;
  radius: number;
  lastUpdate: number;
}

// Game status enum
export enum GameStatus {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

// Game state - the complete state of a game session
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

// Game settings and configuration
export interface GameSettings {
  width: number;
  height: number;
  paddleWidth: number;
  paddleHeight: number;
  ballRadius: number;
  maxScore: number;
  countdownDuration: number; // seconds
}

// Player actions that can be sent to the server
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

// Game events that the server broadcasts
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

// WebSocket message types for Phase 2
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

// Union type for all game-related messages
export type GameMessage = 
  | GameStateMessage 
  | PlayerActionMessage 
  | GameEventMessage 
  | GameControlMessage;

// Game physics constants
export const GAME_CONSTANTS = {
  PADDLE_SPEED: 300, // pixels per second
  BALL_SPEED: 400, // pixels per second
  PADDLE_WIDTH: 20,
  PADDLE_HEIGHT: 100,
  BALL_RADIUS: 10,
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  MAX_SCORE: 11,
  COUNTDOWN_DURATION: 3, // seconds
  UPDATE_RATE: 60, // FPS
  NETWORK_UPDATE_RATE: 20, // network updates per second
} as const;

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  width: GAME_CONSTANTS.GAME_WIDTH,
  height: GAME_CONSTANTS.GAME_HEIGHT,
  paddleWidth: GAME_CONSTANTS.PADDLE_WIDTH,
  paddleHeight: GAME_CONSTANTS.PADDLE_HEIGHT,
  ballRadius: GAME_CONSTANTS.BALL_RADIUS,
  maxScore: GAME_CONSTANTS.MAX_SCORE,
  countdownDuration: GAME_CONSTANTS.COUNTDOWN_DURATION,
};
