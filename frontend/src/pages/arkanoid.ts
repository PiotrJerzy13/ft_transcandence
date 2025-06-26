// arkanoid.ts
import { calculateGameOverXp, calculateLevelXp } from "./xpCalculator";

interface GameSettings {
    canvasWidth: number;
    canvasHeight: number;
    paddleWidth: number;
    paddleHeight: number;
    ballSize: number;
    initialLives: number;
}

interface Block {
    x: number;
    y: number;
    width: number;
    height: number;
    destroyed: boolean;
    color: { primary: string; secondary: string; glow: string };
    points: number;
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

interface GameState {
    paddleX: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    score: number;
    lives: number;
    level: number;
    xpEarned: number;
    blocks: Block[];
    particles: Particle[];
}

interface Keys {
    left: boolean;
    right: boolean;
}

export type { GameSettings, Block, Particle, GameState, Keys };

export class Arkanoid {
    settings: GameSettings;
    state: GameState;
    keys: Keys;
    scale: number;
    blockColors: { primary: string; secondary: string; glow: string }[];
    
    // Callbacks for React state updates
    onScoreChange?: (score: number) => void;
    onLivesChange?: (lives: number) => void;
    onLevelChange?: (level: number) => void;
    onGameOver?: () => void;
    onLevelComplete?: () => void;
    onXpEarned?: (xp: number) => void;

    constructor(
        settings: GameSettings, 
        scale: number = 1, 
        blockColors: { primary: string; secondary: string; glow: string }[]
    ) {
        this.settings = settings;
        this.scale = scale;
        this.blockColors = blockColors;
        this.keys = { left: false, right: false };
        
        // Initialize state properly
        this.state = {
            paddleX: 0,
            ballX: 0,
            ballY: 0,
            ballSpeedX: 0,
            ballSpeedY: 0,
            score: 0,
            lives: settings.initialLives,
            level: 1,
            xpEarned: 0,
            blocks: [],
            particles: []
        };
        
        this.resetGame(true);
    }

    setCallbacks(callbacks: {
        onScoreChange?: (score: number) => void;
        onLivesChange?: (lives: number) => void;
        onLevelChange?: (level: number) => void;
        onGameOver?: () => void;
        onLevelComplete?: () => void;
        onXpEarned?: (xp: number) => void;
    }) {
        this.onScoreChange = callbacks.onScoreChange;
        this.onLivesChange = callbacks.onLivesChange;
        this.onLevelChange = callbacks.onLevelChange;
        this.onGameOver = callbacks.onGameOver;
        this.onLevelComplete = callbacks.onLevelComplete;
        this.onXpEarned = callbacks.onXpEarned;
    }

    private initializeBlocks(): void {
        const { canvasWidth } = this.settings;
        const scaledBlockWidth = 75 * this.scale;
        const scaledBlockHeight = 25 * this.scale;
        const scaledBlockPadding = 5 * this.scale;

        this.state.blocks = [];
        const totalBlockWidth = 10 * (scaledBlockWidth + scaledBlockPadding) - scaledBlockPadding;
        const startX = (canvasWidth - totalBlockWidth) / 2;
        const startY = 80 * this.scale;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                this.state.blocks.push({
                    x: startX + col * (scaledBlockWidth + scaledBlockPadding),
                    y: startY + row * (scaledBlockHeight + scaledBlockPadding),
                    width: scaledBlockWidth,
                    height: scaledBlockHeight,
                    destroyed: false,
                    color: this.blockColors[row % this.blockColors.length],
                    points: (6 - row) * 10,
                });
            }
        }
    }

    resetGame(isNewGame: boolean = true): void {
        const { canvasWidth, canvasHeight, paddleWidth, paddleHeight, ballSize, initialLives } = this.settings;
        const scaledPaddleWidth = paddleWidth * this.scale;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const scaledBallSize = ballSize * this.scale;

        if (isNewGame) {
            this.state.score = 0;
            this.state.lives = initialLives;
            this.state.level = 1;
            this.state.xpEarned = 0;
        }

        // Reset ball and paddle positions
        this.state.paddleX = canvasWidth / 2 - scaledPaddleWidth / 2;
        this.state.ballX = canvasWidth / 2;
        this.state.ballY = canvasHeight - scaledPaddleHeight - scaledBallSize - 100;
        this.state.ballSpeedX = 2.5 * this.scale * (Math.random() > 0.5 ? 1 : -1);
        this.state.ballSpeedY = -2.5 * this.scale;
        
        this.state.particles = [];
        this.initializeBlocks();
        this.keys = { left: false, right: false };
    }

    update(): void {
        const { canvasWidth, paddleWidth } = this.settings;
        const scaledPaddleWidth = paddleWidth * this.scale;
        const paddleSpeed = 8 * this.scale;

        // Paddle movement
        if (this.keys.left) {
            this.state.paddleX = Math.max(0, this.state.paddleX - paddleSpeed);
        }
        if (this.keys.right) {
            this.state.paddleX = Math.min(canvasWidth - scaledPaddleWidth, this.state.paddleX + paddleSpeed);
        }

        this.handleCollisions();
        this.updateParticles();
        this.checkLevelComplete();
    }

    private handleCollisions(): void {
        const { canvasWidth, canvasHeight, ballSize, paddleHeight } = this.settings;
        const scaledBallSize = ballSize * this.scale;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const scaledPaddleWidth = this.settings.paddleWidth * this.scale;

        // Ball movement
        this.state.ballX += this.state.ballSpeedX;
        this.state.ballY += this.state.ballSpeedY;

        // Ball collision with walls
        if (this.state.ballX <= scaledBallSize || this.state.ballX >= canvasWidth - scaledBallSize) {
            this.state.ballSpeedX *= -1;
            // Keep ball within bounds
            if (this.state.ballX <= scaledBallSize) {
                this.state.ballX = scaledBallSize;
            }
            if (this.state.ballX >= canvasWidth - scaledBallSize) {
                this.state.ballX = canvasWidth - scaledBallSize;
            }
        }
        if (this.state.ballY <= scaledBallSize) {
            this.state.ballSpeedY *= -1;
            this.state.ballY = scaledBallSize;
        }

        // Ball collision with paddle
        const paddleY = canvasHeight - scaledPaddleHeight - 30 * this.scale;
        const paddleTop = paddleY;
        const paddleBottom = paddleY + scaledPaddleHeight;
        const paddleLeft = this.state.paddleX;
        const paddleRight = this.state.paddleX + scaledPaddleWidth;

        if (
            this.state.ballY + scaledBallSize >= paddleTop &&
            this.state.ballY - scaledBallSize <= paddleBottom &&
            this.state.ballX >= paddleLeft &&
            this.state.ballX <= paddleRight &&
            this.state.ballSpeedY > 0
        ) {
            this.state.ballSpeedY = -Math.abs(this.state.ballSpeedY);
            this.state.ballY = paddleTop - scaledBallSize;
            
            // Change ball angle based on paddle hit position
            let deltaX = this.state.ballX - (this.state.paddleX + scaledPaddleWidth / 2);
            this.state.ballSpeedX = deltaX * 0.1;
        }

        // Ball out of bounds
        if (this.state.ballY > canvasHeight) {
            this.loseLife();
        }

        // Ball collision with blocks
        let ballMoved = false;
        this.state.blocks.forEach(block => {
            if (!block.destroyed && !ballMoved) {
                const ballLeft = this.state.ballX - scaledBallSize;
                const ballRight = this.state.ballX + scaledBallSize;
                const ballTop = this.state.ballY - scaledBallSize;
                const ballBottom = this.state.ballY + scaledBallSize;
                
                const blockLeft = block.x;
                const blockRight = block.x + block.width;
                const blockTop = block.y;
                const blockBottom = block.y + block.height;
                
                // Check for overlap
                if (ballRight > blockLeft && ballLeft < blockRight && 
                    ballBottom > blockTop && ballTop < blockBottom) {
                    
                    block.destroyed = true;
                    ballMoved = true;
                    
                    this.state.score += block.points;
                    this.onScoreChange?.(this.state.score);
                    
                    this.createParticles(this.state.ballX, this.state.ballY, block.color.glow);

                    // Determine bounce direction
                    const overlapLeft = ballRight - blockLeft;
                    const overlapRight = blockRight - ballLeft;
                    const overlapTop = ballBottom - blockTop;
                    const overlapBottom = blockBottom - ballTop;
                    
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    if (minOverlap === overlapTop || minOverlap === overlapBottom) {
                        this.state.ballSpeedY *= -1;
                        if (minOverlap === overlapTop) {
                            this.state.ballY = blockTop - scaledBallSize;
                        } else {
                            this.state.ballY = blockBottom + scaledBallSize;
                        }
                    } else {
                        this.state.ballSpeedX *= -1;
                        if (minOverlap === overlapLeft) {
                            this.state.ballX = blockLeft - scaledBallSize;
                        } else {
                            this.state.ballX = blockRight + scaledBallSize;
                        }
                    }
                }
            }
        });
    }

    private updateParticles(): void {
        this.state.particles = this.state.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }

    private checkLevelComplete(): void {
        const remainingBlocks = this.state.blocks.filter(block => !block.destroyed);
        if (remainingBlocks.length === 0) {
            this.onLevelComplete?.();
        }
    }

    nextLevel(): void {
        const xpGained = calculateLevelXp(this.state.score, this.state.level, this.state.lives);
        this.state.xpEarned += xpGained;
        this.onXpEarned?.(xpGained);
        
        this.state.level++;
        this.onLevelChange?.(this.state.level);
        
        this.resetGame(false);
    }

    loseLife(): void {
        this.state.lives--;
        this.onLivesChange?.(this.state.lives);
        
        if (this.state.lives <= 0) {
            const xpGained = calculateGameOverXp(this.state.score, this.state.level);
            this.state.xpEarned += xpGained;
            this.onXpEarned?.(xpGained);
            this.onGameOver?.();
        } else {
            this.resetBallAndPaddle();
        }
    }

    private resetBallAndPaddle(): void {
        const { canvasWidth, canvasHeight, paddleWidth, paddleHeight, ballSize } = this.settings;
        const scaledPaddleWidth = paddleWidth * this.scale;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const scaledBallSize = ballSize * this.scale;

        this.state.paddleX = canvasWidth / 2 - scaledPaddleWidth / 2;
        this.state.ballX = canvasWidth / 2;
        this.state.ballY = canvasHeight - scaledPaddleHeight - scaledBallSize - 100;
        this.state.ballSpeedX = 2.5 * this.scale * (Math.random() > 0.5 ? 1 : -1);
        this.state.ballSpeedY = -2.5 * this.scale;
    }

    createParticles(x: number, y: number, color: string): void {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const count = isMobile ? 8 : 12;
        
        for (let i = 0; i < count; i++) {
            this.state.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                maxLife: 40,
                color: color,
            });
        }
    }

    // Drawing methods
    drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Simple starfield
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
        const { paddleWidth, paddleHeight, ballSize } = this.settings;
        const scaledPaddleWidth = paddleWidth * this.scale;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const scaledBallSize = ballSize * this.scale;

        // Clear canvas and draw background
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.drawBackground(ctx, canvasWidth, canvasHeight);

        // Draw blocks
        this.state.blocks.forEach(block => {
            if (!block.destroyed) {
                ctx.fillStyle = block.color.primary;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                
                ctx.shadowBlur = 10;
                ctx.shadowColor = block.color.glow;
                ctx.fillStyle = block.color.secondary;
                ctx.fillRect(block.x + 2 * this.scale, block.y + 2 * this.scale, 
                           block.width - 4 * this.scale, block.height - 4 * this.scale);
                ctx.shadowBlur = 0;
            }
        });

        // Draw paddle
        const paddleY = canvasHeight - scaledPaddleHeight - 30 * this.scale;
        ctx.fillStyle = '#6366f1';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#818cf8';
        ctx.fillRect(this.state.paddleX, paddleY, scaledPaddleWidth, scaledPaddleHeight);
        ctx.shadowBlur = 0;

        // Draw ball
        ctx.beginPath();
        ctx.arc(this.state.ballX, this.state.ballY, scaledBallSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f9a8d4';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw particles
        this.state.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2 * this.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Key handling methods
    setKeyState(key: 'left' | 'right', pressed: boolean): void {
        this.keys[key] = pressed;
    }

    // Getters for React state
    getScore(): number { return this.state.score; }
    getLives(): number { return this.state.lives; }
    getLevel(): number { return this.state.level; }
    getXpEarned(): number { return this.state.xpEarned; }
    getBlocks(): Block[] { return this.state.blocks; }
    getParticles(): Particle[] { return this.state.particles; }
}