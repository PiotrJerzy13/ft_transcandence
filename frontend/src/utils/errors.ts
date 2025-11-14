/**
 * Base custom error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error for form inputs
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Game state error
 */
export class GameStateError extends AppError {
  constructor(message: string) {
    super(message, 'GAME_STATE_ERROR', 400);
    this.name = 'GameStateError';
  }
}

/**
 * Tournament error
 */
export class TournamentError extends AppError {
  constructor(message: string) {
    super(message, 'TOURNAMENT_ERROR', 400);
    this.name = 'TournamentError';
  }
}

/**
 * Matchmaking error
 */
export class MatchmakingError extends AppError {
  constructor(message: string) {
    super(message, 'MATCHMAKING_ERROR', 400);
    this.name = 'MatchmakingError';
  }
}

