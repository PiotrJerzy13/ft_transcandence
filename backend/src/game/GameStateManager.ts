import {
  GameState,
  PlayerGameState,
  BallState,
  PlayerAction,
  GameStatus,
  DEFAULT_GAME_SETTINGS,
  GAME_CONSTANTS
} from '../types/game.js';

export class GameStateManager {
  private gameStates: Map<string, GameState> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();
  private lastUpdateTimes: Map<string, number> = new Map();

  // Create a new game state
  createGame(sessionId: string, gameType: string, playerIds: number[], usernames: string[]): GameState {
    const now = Date.now();
    
    // Initialize players
    const players: PlayerGameState[] = playerIds.map((id, index) => ({
      id,
      username: usernames[index],
      position: {
        x: index === 0 ? 50 : GAME_CONSTANTS.GAME_WIDTH - 70, // Left vs Right paddle
        y: GAME_CONSTANTS.GAME_HEIGHT / 2 - GAME_CONSTANTS.PADDLE_HEIGHT / 2
      },
      score: 0,
      isReady: false,
      lastAction: now
    }));

    // Initialize ball
    const ball: BallState = {
      position: {
        x: GAME_CONSTANTS.GAME_WIDTH / 2,
        y: GAME_CONSTANTS.GAME_HEIGHT / 2
      },
      velocity: { x: 0, y: 0 },
      radius: GAME_CONSTANTS.BALL_RADIUS,
      lastUpdate: now
    };

    // Create game state
    const gameState: GameState = {
      sessionId,
      gameType,
      status: GameStatus.WAITING,
      players,
      ball,
      gameSettings: DEFAULT_GAME_SETTINGS,
      lastUpdate: now,
      frameCount: 0
    };

    this.gameStates.set(sessionId, gameState);
    this.lastUpdateTimes.set(sessionId, now);
    
    console.log(`🎮 Created game state for session ${sessionId} with ${players.length} players`);
    return gameState;
  }

  // Get game state
  getGameState(sessionId: string): GameState | undefined {
    return this.gameStates.get(sessionId);
  }

  // Update game state based on player action
  updateGameState(sessionId: string, action: PlayerAction): boolean {
    const gameState = this.gameStates.get(sessionId);
    if (!gameState) {
      console.error(`❌ Game state not found for session ${sessionId}`);
      return false;
    }

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      console.error(`❌ Player ${action.playerId} not found in game ${sessionId}`);
      return false;
    }

    const now = Date.now();
    player.lastAction = now;

    switch (action.type) {
      case 'move_paddle':
        this.handlePaddleMovement(gameState, player, action);
        break;
      case 'ready':
        player.isReady = true;
        console.log(`✅ Player ${player.username} is ready in game ${sessionId}`);
        break;
      case 'pause':
        if (gameState.status === GameStatus.ACTIVE) {
          gameState.status = GameStatus.PAUSED;
          console.log(`⏸️ Game ${sessionId} paused by player ${player.username}`);
        }
        break;
      case 'resume':
        if (gameState.status === GameStatus.PAUSED) {
          gameState.status = GameStatus.ACTIVE;
          console.log(`▶️ Game ${sessionId} resumed by player ${player.username}`);
        }
        break;
    }

    gameState.lastUpdate = now;
    return true;
  }

  // Handle paddle movement
  private handlePaddleMovement(gameState: GameState, player: PlayerGameState, action: PlayerAction): void {
    if (gameState.status !== GameStatus.ACTIVE && gameState.status !== GameStatus.COUNTDOWN) {
      return; // Only allow movement during active gameplay
    }

    const direction = action.data.direction;
    if (!direction) return;

    const deltaTime = (Date.now() - player.lastAction) / 1000; // Convert to seconds
    const movement = GAME_CONSTANTS.PADDLE_SPEED * deltaTime;

    switch (direction) {
      case 'up':
        player.position.y = Math.max(
          GAME_CONSTANTS.PADDLE_HEIGHT / 2,
          player.position.y - movement
        );
        break;
      case 'down':
        player.position.y = Math.min(
          GAME_CONSTANTS.GAME_HEIGHT - GAME_CONSTANTS.PADDLE_HEIGHT / 2,
          player.position.y + movement
        );
        break;
      case 'stop':
        // No movement - paddle stays in current position
        break;
    }

    console.log(`🎮 Player ${player.username} moved paddle to Y: ${player.position.y}`);
  }

  // Start the game loop for a session
  startGameLoop(sessionId: string): void {
    if (this.gameLoops.has(sessionId)) {
      console.warn(`⚠️ Game loop already running for session ${sessionId}`);
      return;
    }

    const gameState = this.gameStates.get(sessionId);
    if (!gameState) {
      console.error(`❌ Cannot start game loop: game state not found for session ${sessionId}`);
      return;
    }

    // Start countdown
    gameState.status = GameStatus.COUNTDOWN;
    console.log(`🔢 Starting countdown for game ${sessionId}`);

    // Countdown loop
    let countdown = GAME_CONSTANTS.COUNTDOWN_DURATION;
    const countdownInterval = setInterval(() => {
      if (countdown > 0) {
        console.log(`🔢 Game ${sessionId} starting in ${countdown}...`);
        countdown--;
      } else {
        clearInterval(countdownInterval);
        this.startActiveGame(sessionId);
      }
    }, 1000);
  }

  // Start active gameplay
  private startActiveGame(sessionId: string): void {
    const gameState = this.gameStates.get(sessionId);
    if (!gameState) return;

    gameState.status = GameStatus.ACTIVE;
    gameState.startTime = Date.now();
    
    // Initialize ball with random direction
    const angle = Math.random() * Math.PI * 2;
    gameState.ball.velocity = {
      x: Math.cos(angle) * GAME_CONSTANTS.BALL_SPEED,
      y: Math.sin(angle) * GAME_CONSTANTS.BALL_SPEED
    };

    console.log(`🎮 Game ${sessionId} started! Ball velocity:`, gameState.ball.velocity);

    // Start the main game loop
    const gameLoop = setInterval(() => {
      this.updateGamePhysics(sessionId);
    }, 1000 / GAME_CONSTANTS.UPDATE_RATE);

    this.gameLoops.set(sessionId, gameLoop);
    console.log(`🎮 Game loop started for session ${sessionId}`);
  }

  // Update game physics (ball movement, collisions, scoring)
  private updateGamePhysics(sessionId: string): void {
    const gameState = this.gameStates.get(sessionId);
    if (!gameState || gameState.status !== GameStatus.ACTIVE) return;

    const now = Date.now();
    const deltaTime = (now - gameState.ball.lastUpdate) / 1000;
    gameState.ball.lastUpdate = now;
    gameState.frameCount++;

    // Update ball position
    gameState.ball.position.x += gameState.ball.velocity.x * deltaTime;
    gameState.ball.position.y += gameState.ball.velocity.y * deltaTime;

    // Check wall collisions (top/bottom)
    if (gameState.ball.position.y <= gameState.ball.radius || 
        gameState.ball.position.y >= GAME_CONSTANTS.GAME_HEIGHT - gameState.ball.radius) {
      gameState.ball.velocity.y = -gameState.ball.velocity.y;
      console.log(`🏓 Ball hit top/bottom wall in game ${sessionId}`);
    }

    // Check paddle collisions
    this.checkPaddleCollisions(gameState);

    // Check scoring (ball goes past paddles)
    this.checkScoring(gameState);

    // Update last update time
    gameState.lastUpdate = now;
  }

  // Check for paddle collisions
  private checkPaddleCollisions(gameState: GameState): void {
    const ball = gameState.ball;
    
    gameState.players.forEach(player => {
      const paddleLeft = player.position.x - GAME_CONSTANTS.PADDLE_WIDTH / 2;
      const paddleRight = player.position.x + GAME_CONSTANTS.PADDLE_WIDTH / 2;
      const paddleTop = player.position.y - GAME_CONSTANTS.PADDLE_HEIGHT / 2;
      const paddleBottom = player.position.y + GAME_CONSTANTS.PADDLE_HEIGHT / 2;

      // Check if ball is within paddle bounds
      if (ball.position.x >= paddleLeft && ball.position.x <= paddleRight &&
          ball.position.y >= paddleTop && ball.position.y <= paddleBottom) {
        
        // Ball hit paddle - reverse X direction and adjust Y based on hit position
        ball.velocity.x = -ball.velocity.x;
        
        // Calculate hit position relative to paddle center (0 = center, -1 = top, 1 = bottom)
        const hitPosition = (ball.position.y - player.position.y) / (GAME_CONSTANTS.PADDLE_HEIGHT / 2);
        
        // Adjust Y velocity based on hit position (more dramatic for edge hits)
        ball.velocity.y = hitPosition * GAME_CONSTANTS.BALL_SPEED;
        
        console.log(`🏓 Ball hit paddle ${player.username} in game ${gameState.sessionId}`);
      }
    });
  }

  // Check for scoring
  private checkScoring(gameState: GameState): void {
    const ball = gameState.ball;
    
    // Ball went past left paddle (Player 2 scores)
    if (ball.position.x <= 0) {
      gameState.players[1].score++;
      this.resetBall(gameState);
      console.log(`🎯 Player 2 (${gameState.players[1].username}) scored! Score: ${gameState.players[1].score}`);
      
      // Check for game end
      if (gameState.players[1].score >= GAME_CONSTANTS.MAX_SCORE) {
        this.endGame(gameState.sessionId, gameState.players[1].id);
      }
    }
    
    // Ball went past right paddle (Player 1 scores)
    if (ball.position.x >= GAME_CONSTANTS.GAME_WIDTH) {
      gameState.players[0].score++;
      this.resetBall(gameState);
      console.log(`🎯 Player 1 (${gameState.players[0].username}) scored! Score: ${gameState.players[0].score}`);
      
      // Check for game end
      if (gameState.players[0].score >= GAME_CONSTANTS.MAX_SCORE) {
        this.endGame(gameState.sessionId, gameState.players[0].id);
      }
    }
  }

  // Reset ball to center
  private resetBall(gameState: GameState): void {
    gameState.ball.position = {
      x: GAME_CONSTANTS.GAME_WIDTH / 2,
      y: GAME_CONSTANTS.GAME_HEIGHT / 2
    };
    gameState.ball.velocity = { x: 0, y: 0 };
    
    // Give ball a small delay before moving again
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      gameState.ball.velocity = {
        x: Math.cos(angle) * GAME_CONSTANTS.BALL_SPEED,
        y: Math.sin(angle) * GAME_CONSTANTS.BALL_SPEED
      };
    }, 1000);
  }

  // End the game
  private endGame(sessionId: string, winnerId: number): void {
    const gameState = this.gameStates.get(sessionId);
    if (!gameState) return;

    gameState.status = GameStatus.COMPLETED;
    
    // Stop the game loop
    const gameLoop = this.gameLoops.get(sessionId);
    if (gameLoop) {
      clearInterval(gameLoop);
      this.gameLoops.delete(sessionId);
    }

    const winner = gameState.players.find(p => p.id === winnerId);
    console.log(`🏆 Game ${sessionId} ended! Winner: ${winner?.username}`);
  }

  // Stop game loop
  stopGameLoop(sessionId: string): void {
    const gameLoop = this.gameLoops.get(sessionId);
    if (gameLoop) {
      clearInterval(gameLoop);
      this.gameLoops.delete(sessionId);
      console.log(`⏹️ Game loop stopped for session ${sessionId}`);
    }
  }

  // Clean up game state
  removeGame(sessionId: string): void {
    this.stopGameLoop(sessionId);
    this.gameStates.delete(sessionId);
    this.lastUpdateTimes.delete(sessionId);
    console.log(`🗑️ Game state removed for session ${sessionId}`);
  }

  // Get all active games
  getAllGames(): GameState[] {
    return Array.from(this.gameStates.values());
  }

  // Check if all players are ready
  areAllPlayersReady(sessionId: string): boolean {
    const gameState = this.gameStates.get(sessionId);
    if (!gameState) return false;
    
    return gameState.players.every(player => player.isReady);
  }
}
