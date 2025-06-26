// pong.ts
interface GameSettings {
	canvasWidth: number;
	canvasHeight: number;
	paddleHeight: number;
	paddleWidth: number;
	ballSize: number;
	winningScore: number;
	paddleSpeed: number;
	ballSpeed: number;
	aiPaddleSpeed?: number;
	aiTargetOffset?: number;
	ballSpeedIncrease?: number;
  }
  
  interface GameState {
	playerScore: number;
	opponentScore: number;
	ballX: number;
	ballY: number;
	ballSpeedX: number;
	ballSpeedY: number;
	paddle1Y: number;
	paddle2Y: number;
  }
  
  interface Keys {
	w: boolean;
	s: boolean;
	up: boolean;
	down: boolean;
  }
  
  interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	color: string;
  }
  
  type CollisionResult = {
	occurred: boolean;
	side: 'left' | 'right' | null;
	particles?: Particle[];
  };
  
  type ScoreResult = {
	scored: boolean;
	scorer: 'player' | 'opponent' | null;
  };
  
  type GameResult = {
	gameOver: boolean;
	winner: 'player' | 'opponent' | null;
	particles?: Particle[];
  };
  
  export class Pong {
	settings: GameSettings;
	state: GameState;
	keys: Keys;
	scale: number;
	particles: Particle[];
	
	constructor(settings: GameSettings, scale: number = 1) {
	  this.settings = {
		aiPaddleSpeed: settings.paddleSpeed * 0.8,
		aiTargetOffset: 35,
		ballSpeedIncrease: 1.1,
		...settings
	  };
	  this.scale = scale;
	  this.particles = [];
	  this.state = this.createInitialState();
	  this.keys = { w: false, s: false, up: false, down: false };
	}
  
	private createInitialState(): GameState {
	  const { canvasWidth, canvasHeight, ballSpeed, paddleHeight } = this.settings;
	  return {
		playerScore: 0,
		opponentScore: 0,
		ballX: canvasWidth / 2,
		ballY: canvasHeight / 2,
		ballSpeedX: ballSpeed * this.scale,
		ballSpeedY: ballSpeed * this.scale,
		paddle1Y: canvasHeight / 2 - (paddleHeight * this.scale) / 2,
		paddle2Y: canvasHeight / 2 - (paddleHeight * this.scale) / 2,
	  };
	}
  
	updateScale(newScale: number) {
	  const oldScale = this.scale;
	  this.scale = newScale;
	  
	  // Scale existing positions and speeds
	  const scaleRatio = newScale / oldScale;
	  this.state.ballX *= scaleRatio;
	  this.state.ballY *= scaleRatio;
	  this.state.ballSpeedX *= scaleRatio;
	  this.state.ballSpeedY *= scaleRatio;
	  this.state.paddle1Y *= scaleRatio;
	  this.state.paddle2Y *= scaleRatio;
	  
	  // Update particles
	  this.particles.forEach(particle => {
		particle.x *= scaleRatio;
		particle.y *= scaleRatio;
		particle.vx *= scaleRatio;
		particle.vy *= scaleRatio;
	  });
	}
  
	update(gameMode: 'one-player' | 'two-player'): {
	  collision: CollisionResult;
	  score: ScoreResult;
	  gameResult: GameResult;
	} {
	  const { canvasWidth, canvasHeight, paddleHeight, paddleWidth, ballSize, paddleSpeed, aiPaddleSpeed, aiTargetOffset } = this.settings;
	  const scaledPaddleHeight = paddleHeight * this.scale;
	  const scaledPaddleWidth = paddleWidth * this.scale;
	  const scaledBallSize = ballSize * this.scale;
	  const scaledPaddleSpeed = paddleSpeed * this.scale;
	  const scaledAiPaddleSpeed = (aiPaddleSpeed || paddleSpeed * 0.8) * this.scale;
	  const scaledAiTargetOffset = (aiTargetOffset || 35) * this.scale;
  
	  // Player 1 movement
	  if (this.keys.w && this.state.paddle1Y > 0) {
		this.state.paddle1Y -= scaledPaddleSpeed;
	  }
	  if (this.keys.s && this.state.paddle1Y < canvasHeight - scaledPaddleHeight) {
		this.state.paddle1Y += scaledPaddleSpeed;
	  }
  
	  // Player 2 / AI movement
	  if (gameMode === 'two-player') {
		if (this.keys.up && this.state.paddle2Y > 0) {
		  this.state.paddle2Y -= scaledPaddleSpeed;
		}
		if (this.keys.down && this.state.paddle2Y < canvasHeight - scaledPaddleHeight) {
		  this.state.paddle2Y += scaledPaddleSpeed;
		}
	  } else { // AI logic
		const paddle2Center = this.state.paddle2Y + scaledPaddleHeight / 2;
		if (paddle2Center < this.state.ballY - scaledAiTargetOffset) {
		  this.state.paddle2Y += scaledAiPaddleSpeed;
		} else if (paddle2Center > this.state.ballY + scaledAiTargetOffset) {
		  this.state.paddle2Y -= scaledAiPaddleSpeed;
		}
		// Keep AI paddle within bounds
		this.state.paddle2Y = Math.max(0, Math.min(this.state.paddle2Y, canvasHeight - scaledPaddleHeight));
	  }
  
	  // Ball movement
	  this.state.ballX += this.state.ballSpeedX;
	  this.state.ballY += this.state.ballSpeedY;
  
	  // Ball collision with top/bottom walls
	  if (this.state.ballY < scaledBallSize || this.state.ballY > canvasHeight - scaledBallSize) {
		this.state.ballSpeedY *= -1;
	  }
  
	  // Ball collision with paddles
	  const collision = this.checkPaddleCollisions(scaledPaddleWidth, scaledPaddleHeight, scaledBallSize);
	  
	  // Scoring
	  const score = this.checkScoring(canvasWidth);
	  
	  // Check win condition
	  const gameResult = this.checkWinCondition();
  
	  // Update particles
	  this.updateParticles();
  
	  return { collision, score, gameResult };
	}
  
	private checkPaddleCollisions(scaledPaddleWidth: number, scaledPaddleHeight: number, scaledBallSize: number): CollisionResult {
	  const { canvasWidth, ballSpeedIncrease } = this.settings;
	  const paddle1X = 30 * this.scale;
	  const paddle2X = canvasWidth - (30 * this.scale) - scaledPaddleWidth;
	  
	  let collision: CollisionResult = { occurred: false, side: null };
  
	  // Left paddle collision
	  if (this.state.ballX - scaledBallSize < paddle1X + scaledPaddleWidth &&
		  this.state.ballY > this.state.paddle1Y &&
		  this.state.ballY < this.state.paddle1Y + scaledPaddleHeight) {
		if (this.state.ballSpeedX < 0) {
		  this.state.ballSpeedX *= -(ballSpeedIncrease || 1.1);
		  collision = {
			occurred: true,
			side: 'left',
			particles: this.createParticles(this.state.ballX, this.state.ballY, "#06b6d4")
		  };
		}
	  }
  
	  // Right paddle collision
	  if (this.state.ballX + scaledBallSize > paddle2X &&
		  this.state.ballY > this.state.paddle2Y &&
		  this.state.ballY < this.state.paddle2Y + scaledPaddleHeight) {
		if (this.state.ballSpeedX > 0) {
		  this.state.ballSpeedX *= -(ballSpeedIncrease || 1.1);
		  collision = {
			occurred: true,
			side: 'right',
			particles: this.createParticles(this.state.ballX, this.state.ballY, "#a855f7")
		  };
		}
	  }
  
	  if (collision.particles) {
		this.particles.push(...collision.particles);
	  }
  
	  return collision;
	}
  
	private checkScoring(canvasWidth: number): ScoreResult {
	  let scoreResult: ScoreResult = { scored: false, scorer: null };
  
	  if (this.state.ballX < 0) {
		this.state.opponentScore++;
		this.resetBall();
		scoreResult = { scored: true, scorer: 'opponent' };
	  } else if (this.state.ballX > canvasWidth) {
		this.state.playerScore++;
		this.resetBall();
		scoreResult = { scored: true, scorer: 'player' };
	  }
  
	  return scoreResult;
	}
  
	private checkWinCondition(): GameResult {
	  const { winningScore } = this.settings;
	  
	  if (this.state.playerScore >= winningScore) {
		return {
		  gameOver: true,
		  winner: 'player',
		  particles: [
			...this.createParticles(200 * this.scale, 250 * this.scale, "#06b6d4"),
			...this.createParticles(300 * this.scale, 150 * this.scale, "#06b6d4"),
			...this.createParticles(400 * this.scale, 350 * this.scale, "#06b6d4")
		  ]
		};
	  } else if (this.state.opponentScore >= winningScore) {
		return {
		  gameOver: true,
		  winner: 'opponent',
		  particles: [
			...this.createParticles(600 * this.scale, 250 * this.scale, "#f59e0b"),
			...this.createParticles(500 * this.scale, 150 * this.scale, "#f59e0b"),
			...this.createParticles(700 * this.scale, 350 * this.scale, "#f59e0b")
		  ]
		};
	  }
  
	  return { gameOver: false, winner: null };
	}
  
	createParticles(x: number, y: number, color: string = "#60a5fa"): Particle[] {
	  const particles: Particle[] = [];
	  for (let i = 0; i < 12; i++) {
		particles.push({
		  x: x,
		  y: y,
		  vx: (Math.random() - 0.5) * 8 * this.scale,
		  vy: (Math.random() - 0.5) * 8 * this.scale,
		  life: 40,
		  maxLife: 40,
		  color: color
		});
	  }
	  return particles;
	}
  
	private updateParticles() {
	  this.particles = this.particles.filter(particle => {
		particle.x += particle.vx;
		particle.y += particle.vy;
		particle.life--;
		return particle.life > 0;
	  });
	}
  
	resetBall() {
	  const { canvasWidth, canvasHeight, ballSpeed } = this.settings;
	  this.state.ballX = canvasWidth / 2;
	  this.state.ballY = canvasHeight / 2;
	  const speed = ballSpeed * this.scale;
	  this.state.ballSpeedX = this.state.ballSpeedX > 0 ? -speed : speed;
	  this.state.ballSpeedY = (Math.random() - 0.5) * speed;
	}
  
	resetPaddles() {
	  const { canvasHeight, paddleHeight } = this.settings;
	  const scaledPaddleHeight = paddleHeight * this.scale;
	  this.state.paddle1Y = canvasHeight / 2 - scaledPaddleHeight / 2;
	  this.state.paddle2Y = canvasHeight / 2 - scaledPaddleHeight / 2;
	}
  
	resetGame() {
	  this.state = this.createInitialState();
	  this.particles = [];
	  this.keys = { w: false, s: false, up: false, down: false };
	}
  
	setKeyState(key: keyof Keys, pressed: boolean) {
	  this.keys[key] = pressed;
	}
  
	updateTouchPaddle(touchX: number, touchY: number, canvasWidth: number, canvasHeight: number, gameMode: 'one-player' | 'two-player') {
	  const { paddleHeight } = this.settings;
	  const scaledPaddleHeight = paddleHeight * this.scale;
	  
	  if (touchX < canvasWidth / 2) { // Left half - Player 1
		let newY = touchY - scaledPaddleHeight / 2;
		newY = Math.max(0, Math.min(newY, canvasHeight - scaledPaddleHeight));
		this.state.paddle1Y = newY;
	  } else if (gameMode === 'two-player') { // Right half - Player 2
		let newY = touchY - scaledPaddleHeight / 2;
		newY = Math.max(0, Math.min(newY, canvasHeight - scaledPaddleHeight));
		this.state.paddle2Y = newY;
	  }
	}
  
	getScaledDimensions() {
	  const { paddleWidth, paddleHeight, ballSize } = this.settings;
	  return {
		paddleWidth: paddleWidth * this.scale,
		paddleHeight: paddleHeight * this.scale,
		ballSize: ballSize * this.scale,
		paddle1X: 30 * this.scale,
		paddle2X: this.settings.canvasWidth - (30 * this.scale) - (paddleWidth * this.scale)
	  };
	}
  
	// Getters for read-only access
	getState(): Readonly<GameState> {
	  return { ...this.state };
	}
  
	getParticles(): Readonly<Particle[]> {
	  return [...this.particles];
	}
  
	getKeys(): Readonly<Keys> {
	  return { ...this.keys };
	}
  
	getSettings(): Readonly<GameSettings> {
	  return { ...this.settings };
	}
  }