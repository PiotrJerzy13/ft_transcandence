// arkanoid.ts

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
    blocks: Block[];
    particles: Particle[];
    powerUps: PowerUp[];
    activePowerUps: ActivePowerUp[];
    paddleWidth: number; // For power-up effects
    paddleSpeed: number; // For power-up effects
    balls: Array<{x: number, y: number, speedX: number, speedY: number}>; // For multi-ball
    shieldActive: boolean;
}

interface Keys {
    left: boolean;
    right: boolean;
}

// Power-up types
export enum PowerUpType {
    MULTI_BALL = 'multi_ball',
    PADDLE_LARGE = 'paddle_large', 
    PADDLE_FAST = 'paddle_fast',
    BALL_LASER = 'ball_laser',
    SHIELD = 'shield',
    BOMB = 'bomb'
}

interface PowerUp {
    x: number;
    y: number;
    width: number;
    height: number;
    type: PowerUpType;
    collected: boolean;
    fallSpeed: number;
    color: string;
    icon: string;
}

interface ActivePowerUp {
    type: PowerUpType;
    duration: number;
    maxDuration: number;
    effect: any; // Will be specific to each power-up type
}

export type { GameSettings, Block, Particle, GameState, Keys, PowerUp, ActivePowerUp };

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
            blocks: [],
            particles: [],
            powerUps: [],
            activePowerUps: [],
            paddleWidth: settings.paddleWidth,
            paddleSpeed: 8,
            balls: [],
            shieldActive: false
        };
        
        this.resetGame(true);
    }

    setCallbacks(callbacks: {
        onScoreChange?: (score: number) => void;
        onLivesChange?: (lives: number) => void;
        onLevelChange?: (level: number) => void;
        onGameOver?: () => void;
        onLevelComplete?: () => void;
    }) {
        this.onScoreChange = callbacks.onScoreChange;
        this.onLivesChange = callbacks.onLivesChange;
        this.onLevelChange = callbacks.onLevelChange;
        this.onGameOver = callbacks.onGameOver;
        this.onLevelComplete = callbacks.onLevelComplete;
    }

    private initializeBlocks(): void {
        this.state.blocks = [];
        this.createLevelPattern(this.state.level);
    }

    private createLevelPattern(level: number): void {
        const { canvasWidth } = this.settings;
        const scaledBlockWidth = 75 * this.scale;
        const scaledBlockHeight = 25 * this.scale;
        const scaledBlockPadding = 5 * this.scale;
        const startY = 80 * this.scale;

        switch (level) {
            case 1:
                this.createClassicPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 2:
                this.createPyramidPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 3:
                this.createCrossPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 4:
                this.createBorderPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 5:
                this.createZigzagPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 6:
                this.createCirclePattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 7:
                this.createMazePattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 8:
                this.createStarPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 9:
                this.createCheckerboardPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            case 10:
                this.createBossPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
            default:
                // For levels beyond 10, create random patterns
                this.createRandomPattern(canvasWidth, scaledBlockWidth, scaledBlockHeight, scaledBlockPadding, startY);
                break;
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
        const { canvasWidth } = this.settings;
        const scaledPaddleWidth = this.state.paddleWidth * this.scale;
        const paddleSpeed = this.state.paddleSpeed * this.scale;

        // Paddle movement
        if (this.keys.left) {
            this.state.paddleX = Math.max(0, this.state.paddleX - paddleSpeed);
        }
        if (this.keys.right) {
            this.state.paddleX = Math.min(canvasWidth - scaledPaddleWidth, this.state.paddleX + paddleSpeed);
        }

        this.handleCollisions();
        this.updateParticles();
        this.updatePowerUps();
        this.checkPowerUpCollisions();
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
                    
                    // 20% chance to drop a power-up
                    if (Math.random() < 0.2) {
                        this.createPowerUp(block.x + block.width/2, block.y + block.height/2);
                    }

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
        this.state.level++;
        this.onLevelChange?.(this.state.level);
        
        this.resetGame(false);
    }

    loseLife(): void {
        this.state.lives--;
        this.onLivesChange?.(this.state.lives);
        
        if (this.state.lives <= 0) {
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

    // Power-up methods
    private createPowerUp(x: number, y: number): void {
        const powerUpTypes = Object.values(PowerUpType);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const powerUpConfig = this.getPowerUpConfig(randomType);
        
        this.state.powerUps.push({
            x: x,
            y: y,
            width: 30 * this.scale,
            height: 30 * this.scale,
            type: randomType,
            collected: false,
            fallSpeed: 2 * this.scale,
            color: powerUpConfig.color,
            icon: powerUpConfig.icon
        });
    }

    private getPowerUpConfig(type: PowerUpType): { color: string; icon: string } {
        const configs = {
            [PowerUpType.MULTI_BALL]: { color: '#ff6b6b', icon: '⚽' },
            [PowerUpType.PADDLE_LARGE]: { color: '#4ecdc4', icon: '📏' },
            [PowerUpType.PADDLE_FAST]: { color: '#45b7d1', icon: '⚡' },
            [PowerUpType.BALL_LASER]: { color: '#f9ca24', icon: '💎' },
            [PowerUpType.SHIELD]: { color: '#6c5ce7', icon: '🛡️' },
            [PowerUpType.BOMB]: { color: '#fd79a8', icon: '💣' }
        };
        return configs[type];
    }

    private updatePowerUps(): void {
        const { canvasHeight } = this.settings;
        
        // Update power-up positions
        this.state.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                powerUp.y += powerUp.fallSpeed;
                
                // Remove power-ups that fall off screen
                if (powerUp.y > canvasHeight) {
                    powerUp.collected = true;
                }
            }
        });

        // Remove collected power-ups
        this.state.powerUps = this.state.powerUps.filter(powerUp => !powerUp.collected);

        // Update active power-ups
        this.state.activePowerUps.forEach(activePowerUp => {
            activePowerUp.duration--;
        });

        // Remove expired power-ups
        this.state.activePowerUps = this.state.activePowerUps.filter(activePowerUp => {
            if (activePowerUp.duration <= 0) {
                this.removePowerUpEffect(activePowerUp.type);
                return false;
            }
            return true;
        });
    }

    private checkPowerUpCollisions(): void {
        const { canvasHeight, paddleHeight } = this.settings;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const paddleY = canvasHeight - scaledPaddleHeight - 30 * this.scale;
        const scaledPaddleWidth = this.state.paddleWidth * this.scale;

        this.state.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                // Check collision with paddle
                if (powerUp.y + powerUp.height >= paddleY &&
                    powerUp.y <= paddleY + scaledPaddleHeight &&
                    powerUp.x + powerUp.width >= this.state.paddleX &&
                    powerUp.x <= this.state.paddleX + scaledPaddleWidth) {
                    
                    powerUp.collected = true;
                    this.activatePowerUp(powerUp.type);
                }
            }
        });
    }

    private activatePowerUp(type: PowerUpType): void {
        const duration = 300; // 5 seconds at 60fps
        
        // Check if power-up is already active
        const existingPowerUp = this.state.activePowerUps.find(p => p.type === type);
        if (existingPowerUp) {
            existingPowerUp.duration = duration; // Reset duration
            return;
        }

        // Add new active power-up
        this.state.activePowerUps.push({
            type: type,
            duration: duration,
            maxDuration: duration,
            effect: {}
        });

        this.applyPowerUpEffect(type);
    }

    private applyPowerUpEffect(type: PowerUpType): void {
        switch (type) {
            case PowerUpType.MULTI_BALL:
                this.createMultiBall();
                break;
            case PowerUpType.PADDLE_LARGE:
                this.state.paddleWidth = this.settings.paddleWidth * 1.5;
                break;
            case PowerUpType.PADDLE_FAST:
                this.state.paddleSpeed = 12;
                break;
            case PowerUpType.BALL_LASER:
                // Will be handled in collision detection
                break;
            case PowerUpType.SHIELD:
                this.state.shieldActive = true;
                break;
            case PowerUpType.BOMB:
                this.explodeBlocks();
                break;
        }
    }

    private removePowerUpEffect(type: PowerUpType): void {
        switch (type) {
            case PowerUpType.PADDLE_LARGE:
                this.state.paddleWidth = this.settings.paddleWidth;
                break;
            case PowerUpType.PADDLE_FAST:
                this.state.paddleSpeed = 8;
                break;
            case PowerUpType.SHIELD:
                this.state.shieldActive = false;
                break;
        }
    }

    private createMultiBall(): void {
        // Create 2 additional balls
        for (let i = 0; i < 2; i++) {
            this.state.balls.push({
                x: this.state.ballX,
                y: this.state.ballY,
                speedX: this.state.ballSpeedX + (Math.random() - 0.5) * 2,
                speedY: this.state.ballSpeedY + (Math.random() - 0.5) * 2
            });
        }
    }

    private explodeBlocks(): void {
        // Find blocks near the paddle and destroy them
        const { canvasHeight, paddleHeight } = this.settings;
        const scaledPaddleHeight = paddleHeight * this.scale;
        const paddleY = canvasHeight - scaledPaddleHeight - 30 * this.scale;
        
        this.state.blocks.forEach(block => {
            if (!block.destroyed && 
                Math.abs(block.y - paddleY) < 100 * this.scale) {
                block.destroyed = true;
                this.state.score += block.points;
                this.createParticles(block.x + block.width/2, block.y + block.height/2, block.color.glow);
            }
        });
    }

    // Level pattern creation methods
    private createClassicPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
            }
        }
    }

    private createPyramidPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            const blocksInRow = 10 - row;
            const rowStartX = startX + (row * (blockWidth + padding)) / 2;
            
            for (let col = 0; col < blocksInRow; col++) {
                this.addBlock(rowStartX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
            }
        }
    }

    private createCrossPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create cross pattern
                const isCenterRow = row === 2 || row === 3;
                const isCenterCol = col === 4 || col === 5;
                
                if (isCenterRow || isCenterCol) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createBorderPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create border pattern (leave center empty)
                const isBorder = row === 0 || row === 5 || col === 0 || col === 9;
                const isCenter = row >= 2 && row <= 3 && col >= 3 && col <= 6;
                
                if (isBorder && !isCenter) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createZigzagPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create zigzag pattern
                const shouldHaveBlock = (row + col) % 2 === 0;
                if (shouldHaveBlock) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createCirclePattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;
        const centerX = 4.5; // Center of 10 columns
        const centerY = 2.5; // Center of 6 rows

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                const distance = Math.sqrt(Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2));
                if (distance <= 2.5) { // Circle radius
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createMazePattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        // Create maze-like pattern with corridors
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                const isWall = (row % 2 === 0 && col % 2 === 0) || (row % 2 === 1 && col % 2 === 1);
                if (isWall) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createStarPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create star pattern
                const isStar = (row === 0 && col === 4) || // Top point
                              (row === 1 && (col === 3 || col === 5)) || // Upper arms
                              (row === 2 && (col === 2 || col === 6)) || // Middle arms
                              (row === 3 && (col === 1 || col === 7)) || // Lower arms
                              (row === 4 && (col === 0 || col === 8)) || // Bottom arms
                              (row === 5 && col === 4); // Bottom point
                
                if (isStar) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createCheckerboardPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create checkerboard pattern
                const shouldHaveBlock = (row + col) % 2 === 0;
                if (shouldHaveBlock) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private createBossPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        // Create boss pattern with special blocks
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                // Create a challenging boss pattern
                const isBossBlock = (row >= 1 && row <= 4 && col >= 2 && col <= 7) ||
                                   (row === 0 && col >= 3 && col <= 6) ||
                                   (row === 5 && col >= 3 && col <= 6);
                
                if (isBossBlock) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row, true);
                }
            }
        }
    }

    private createRandomPattern(canvasWidth: number, blockWidth: number, blockHeight: number, padding: number, startY: number): void {
        const totalBlockWidth = 10 * (blockWidth + padding) - padding;
        const startX = (canvasWidth - totalBlockWidth) / 2;

        // Create random pattern for levels beyond 10
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                const shouldHaveBlock = Math.random() < 0.7; // 70% chance
                if (shouldHaveBlock) {
                    this.addBlock(startX + col * (blockWidth + padding), startY + row * (blockHeight + padding), blockWidth, blockHeight, row);
                }
            }
        }
    }

    private addBlock(x: number, y: number, width: number, height: number, row: number, isBoss: boolean = false): void {
        const colorIndex = row % this.blockColors.length;
        const points = isBoss ? (6 - row) * 20 : (6 - row) * 10; // Boss blocks give double points
        
        this.state.blocks.push({
            x: x,
            y: y,
            width: width,
            height: height,
            destroyed: false,
            color: isBoss ? 
                { primary: "#ff6b6b", secondary: "#ff5252", glow: "#ff1744" } : // Special boss color
                this.blockColors[colorIndex],
            points: points,
        });
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
                // Check if it's a boss block (red color indicates boss)
                const isBossBlock = block.color.primary === "#ff6b6b";
                
                if (isBossBlock) {
                    // Special boss block rendering with pulsing effect
                    const time = Date.now() * 0.005;
                    const pulse = Math.sin(time) * 0.1 + 0.9;
                    const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;
                    
                    ctx.shadowBlur = 20 * pulse;
                    ctx.shadowColor = `rgba(255, 107, 107, ${glowIntensity})`;
                    ctx.fillStyle = block.color.primary;
                    ctx.fillRect(block.x, block.y, block.width, block.height);
                    
                    ctx.shadowBlur = 10 * pulse;
                    ctx.shadowColor = `rgba(255, 82, 82, ${glowIntensity})`;
                    ctx.fillStyle = block.color.secondary;
                    ctx.fillRect(block.x + 2 * this.scale, block.y + 2 * this.scale, 
                               block.width - 4 * this.scale, block.height - 4 * this.scale);
                    
                    // Add boss block indicator
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `${12 * this.scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText('BOSS', block.x + block.width/2, block.y + block.height/2 + 3 * this.scale);
                } else {
                    // Regular block rendering
                    ctx.fillStyle = block.color.primary;
                    ctx.fillRect(block.x, block.y, block.width, block.height);
                    
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = block.color.glow;
                    ctx.fillStyle = block.color.secondary;
                    ctx.fillRect(block.x + 2 * this.scale, block.y + 2 * this.scale, 
                               block.width - 4 * this.scale, block.height - 4 * this.scale);
                }
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

        // Draw shield if active
        if (this.state.shieldActive) {
            ctx.strokeStyle = '#6c5ce7';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.state.paddleX - 5, paddleY - 5, scaledPaddleWidth + 10, scaledPaddleHeight + 10);
            ctx.setLineDash([]);
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(this.state.ballX, this.state.ballY, scaledBallSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f9a8d4';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw power-ups
        this.state.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                ctx.fillStyle = powerUp.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = powerUp.color;
                ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                ctx.shadowBlur = 0;
                
                // Draw icon
                ctx.fillStyle = '#ffffff';
                ctx.font = `${16 * this.scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(powerUp.icon, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 5 * this.scale);
            }
        });

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
    getBlocks(): Block[] { return this.state.blocks; }
    getParticles(): Particle[] { return this.state.particles; }
    getPowerUps(): PowerUp[] { return this.state.powerUps; }
    getActivePowerUps(): ActivePowerUp[] { return this.state.activePowerUps; }
    getBalls(): Array<{x: number, y: number, speedX: number, speedY: number}> { return this.state.balls; }
    isShieldActive(): boolean { return this.state.shieldActive; }
}