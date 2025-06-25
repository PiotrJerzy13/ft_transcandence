import { useEffect, useRef, useState, useCallback } from "react";

interface ArkanoidProps {
  onNavigateToLobby?: () => void;
}

export default function Arkanoid({ onNavigateToLobby }: ArkanoidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [_xp, _setXp] = useState(0);
  const [_xpEarned, setXpEarned] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver', 'levelComplete'
  const [history, setHistory] = useState<{ score: number; level_reached: number; created_at: string }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const scaleRef = useRef(1);
  
  const baseWidth = 800;
  const baseHeight = 600;

  const paddleWidth = 120;
  const paddleHeight = 15;
  const ballSize = 12;
  
  // Particle and Block types
  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  };

  type Block = {
    x: number;
    y: number;
    width: number;
    height: number;
    destroyed: boolean;
    color: { primary: string; secondary: string; glow: string };
    points: number;
  };

  // Game state ref
  const gameStateRef = useRef<{
    paddleX: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    currentScore: number;
    currentLives: number;
    currentLevel: number;
    currentXp: number;
    playerLevel: number;
    totalXp: number;
    blocks: Block[];
    particles: Particle[];
    keys: {
      left: boolean;
      right: boolean;
    };
    gameState: string;
  }>({
    paddleX: canvasSize.width / 2 - paddleWidth / 2,
    ballX: canvasSize.width / 2,
    ballY: canvasSize.height - paddleHeight - ballSize - 100,
    ballSpeedX: 2.5,
    ballSpeedY: -2.5,
    currentScore: 0,
    currentLives: 3,
    currentLevel: 1,
    currentXp: 0,
    playerLevel: 1,
    totalXp: 0,
    blocks: [],
    particles: [],
    keys: {
      left: false,
      right: false
    },
    gameState: 'menu'
  });
  
  // Block colors for different rows
  const blockColors = [
    { primary: "#ef4444", secondary: "#dc2626", glow: "#ef4444" },
    { primary: "#f97316", secondary: "#ea580c", glow: "#f97316" },
    { primary: "#eab308", secondary: "#ca8a04", glow: "#eab308" },
    { primary: "#22c55e", secondary: "#16a34a", glow: "#22c55e" },
    { primary: "#3b82f6", secondary: "#2563eb", glow: "#3b82f6" },
    { primary: "#a855f7", secondary: "#9333ea", glow: "#a855f7" },
  ];
  
const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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
};


const createParticles = useCallback((x: number, y: number, color: string) => {
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 8 : 12; // Throttle particles on mobile
  for (let i = 0; i < count; i++) {
    gameStateRef.current.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 40,
      maxLife: 40,
      color: color,
    });
  }
}, []);

const saveArkanoidScore = async () => {
	try {
	  // Simulate API call for demo
	  console.log('Score saved:', gameStateRef.current.currentScore);
	} catch (err) {
	  console.error('Failed to save Arkanoid score:', err);
	}
  };

  const resetBall = useCallback(() => {
    const scale = scaleRef.current;
    const scaledPaddleHeight = 15 * scale;
    const scaledBallSize = 12 * scale;
    const paddleY = canvasSize.height - scaledPaddleHeight - 30 * scale;

    gameStateRef.current.ballX = canvasSize.width / 2;
    gameStateRef.current.ballY = paddleY - scaledBallSize - 20; 
    gameStateRef.current.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 3 * scale;
    gameStateRef.current.ballSpeedY = -3 * scale;
  }, [canvasSize]);

  const resetPaddle = useCallback(() => {
    const scaledPaddleWidth = 120 * scaleRef.current;
    gameStateRef.current.paddleX = canvasSize.width / 2 - scaledPaddleWidth / 2;
  }, [canvasSize]);

  const initializeBlocks = useCallback(() => {
    gameStateRef.current.blocks = [];
		const scale = scaleRef.current;
		const scaledBlockWidth = 75 * scale;
		const scaledBlockHeight = 25 * scale;
		const scaledBlockPadding = 5 * scale;

    const totalBlockWidth = 10 * (scaledBlockWidth + scaledBlockPadding) - scaledBlockPadding;
    const startX = (canvasSize.width - totalBlockWidth) / 2;
    const startY = 80 * scale;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        gameStateRef.current.blocks.push({
          x: startX + col * (scaledBlockWidth + scaledBlockPadding),
          y: startY + row * (scaledBlockHeight + scaledBlockPadding),
          width: scaledBlockWidth,
          height: scaledBlockHeight,
          destroyed: false,
          color: blockColors[row % blockColors.length],
          points: (6 - row) * 10
        });
      }
    }
  }, [canvasSize]);

  const resetGame = useCallback((isNewGame: boolean = true) => {
    if (isNewGame) {
      setScore(0);
      setLives(3);
      setLevel(1);
      setXpEarned(0);
      gameStateRef.current.currentScore = 0;
      gameStateRef.current.currentLives = 3;
      gameStateRef.current.currentLevel = 1;
    }
    resetBall();
    resetPaddle();
    initializeBlocks();
    gameStateRef.current.particles = [];
  }, [resetBall, resetPaddle, initializeBlocks]);

  // Calculate XP for completing a level
	const calculateLevelXp = (score: number, level: number, lives: number): number => {
	const baseXp = level * 100; // Base XP scales with level
	const scoreBonus = Math.floor(score / 10); // 1 XP per 10 points
	const livesBonus = lives * 25; // Bonus for remaining lives
	return baseXp + scoreBonus + livesBonus;
	};

	// Calculate XP when game ends
	const calculateGameOverXp = (score: number, level: number): number => {
	const baseXp = level * 50; // Smaller base for game over
	const scoreBonus = Math.floor(score / 20); // Less XP per point
	return baseXp + scoreBonus;
	};

	// Visual effect for XP gain
	const showXpGain = (amount: number) => {
	const xpGainElement = document.createElement('div');
	xpGainElement.className = 'xp-gain-popup';
	xpGainElement.textContent = `+${amount} XP`;
	xpGainElement.style.position = 'absolute';
	xpGainElement.style.color = '#22c55e';
	xpGainElement.style.fontWeight = 'bold';
	xpGainElement.style.animation = 'floatUp 1.5s ease-out forwards';
	
	// Add to your game UI container
	document.getElementById('xp-notification-container')?.appendChild(xpGainElement);
	
	// Remove after animation
	setTimeout(() => xpGainElement.remove(), 1500);
	};


	const nextLevel = useCallback(() => {
		const xpGained = calculateLevelXp(score, level, lives);
		setXpEarned(prev => prev + xpGained);
		showXpGain(xpGained);
		setLevel(prev => {
      const newLevel = prev + 1;
      gameStateRef.current.currentLevel = newLevel;
      return newLevel;
    });
		resetGame(false); // don't reset score/lives/level
		setGameState('playing');
	}, [score, level, lives, resetGame, showXpGain, calculateLevelXp]);

	const loseLife = useCallback(() => {
		setLives(prev => {
      const newLives = prev - 1;
      gameStateRef.current.currentLives = newLives;
      if (newLives <= 0) {
        const xpGained = calculateGameOverXp(score, level);
        setXpEarned(prev => prev + xpGained);
        showXpGain(xpGained);
        saveArkanoidScore();
        setGameState('gameOver');
      } else {
        resetBall();
        resetPaddle();
      }
      return newLives;
    });
	}, [score, level, saveArkanoidScore, showXpGain, calculateGameOverXp, resetBall, resetPaddle]);

	const handleBackToLobby = () => {
		if (gameState === 'playing' || gameState === 'paused') {
			saveArkanoidScore();
		}
		if (onNavigateToLobby) {
			onNavigateToLobby();
		}
	};

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxWidth = Math.min(
      window.innerWidth - 20, // Account for padding
      baseWidth
    );
    
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile 
      ? window.innerHeight * 0.8 
      : baseHeight * (maxWidth / baseWidth);

    const scale = maxWidth / baseWidth;
    
    setCanvasSize({ 
      width: Math.floor(maxWidth),
      height: Math.floor(maxHeight) 
    });
    scaleRef.current = scale;
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(handleResize, 300); // Delay for rotation to complete
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [handleResize]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = true;

    if (e.key === 'Enter') {
      if (gameState === 'menu' || gameState === 'gameOver') {
        if (isFirstLoad) setIsFirstLoad(false);
        resetGame(true);
        setGameState('playing');
      } else if (gameState === 'levelComplete') {
        nextLevel();
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }
  }, [gameState, resetGame, nextLevel, isFirstLoad]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    const scaledPaddleWidth = paddleWidth * scaleRef.current;
    const targetX = touchX - scaledPaddleWidth / 2;
    gameStateRef.current.paddleX = Math.max(0, Math.min(canvas.width - scaledPaddleWidth, targetX));
  }, [gameState]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState === 'menu' || gameState === 'gameOver') {
      if (isFirstLoad) setIsFirstLoad(false);
      resetGame(true);
      setGameState('playing');
    } else if (gameState === 'levelComplete') {
      nextLevel();
    } else {
      // Allow moving paddle on initial touch
      handleTouchMove(e);
    }
  }, [gameState, resetGame, nextLevel, handleTouchMove, isFirstLoad]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameStateRef.current.gameState !== 'playing') return;

    const scale = scaleRef.current;
    const scaledPaddleWidth = paddleWidth * scale;
    const isMobile = window.innerWidth < 768;
    const paddleSpeed = isMobile ? 10 * scale : 8 * scale;

    if (gameStateRef.current.keys.left) {
      gameStateRef.current.paddleX = Math.max(0, gameStateRef.current.paddleX - paddleSpeed);
    }
    if (gameStateRef.current.keys.right) {
      gameStateRef.current.paddleX = Math.min(canvas.width - scaledPaddleWidth, gameStateRef.current.paddleX + paddleSpeed);
    }
    
    // Ball movement
    gameStateRef.current.ballX += gameStateRef.current.ballSpeedX;
    gameStateRef.current.ballY += gameStateRef.current.ballSpeedY;
    
    // Ball collision with walls
    if (gameStateRef.current.ballX <= ballSize || gameStateRef.current.ballX >= canvas.width - ballSize) {
      gameStateRef.current.ballSpeedX *= -1;
      // Keep ball within bounds
      if (gameStateRef.current.ballX <= ballSize) {
        gameStateRef.current.ballX = ballSize;
      }
      if (gameStateRef.current.ballX >= canvas.width - ballSize) {
        gameStateRef.current.ballX = canvas.width - ballSize;
      }
    }
    if (gameStateRef.current.ballY <= ballSize) {
      gameStateRef.current.ballSpeedY *= -1;
      gameStateRef.current.ballY = ballSize;
    }
    
    // Ball collision with paddle - FIXED
    const paddleY = canvas.height - paddleHeight - 30;
    const paddleTop = paddleY;
    const paddleBottom = paddleY + paddleHeight;
    const paddleLeft = gameStateRef.current.paddleX;
    const paddleRight = gameStateRef.current.paddleX + scaledPaddleWidth;
    
    // Check if ball is hitting paddle from above
    if (
      gameStateRef.current.ballY + ballSize >= paddleTop &&
      gameStateRef.current.ballY - ballSize <= paddleBottom &&
      gameStateRef.current.ballX >= paddleLeft &&
      gameStateRef.current.ballX <= paddleRight &&
      gameStateRef.current.ballSpeedY > 0 // Only bounce if ball is moving downward
    ) {
      gameStateRef.current.ballSpeedY = -Math.abs(gameStateRef.current.ballSpeedY); // Force upward
      
      // Position ball above paddle to prevent getting stuck
      gameStateRef.current.ballY = paddleTop - ballSize;
      
      // Change ball angle based on where it hits the paddle
      let deltaX = gameStateRef.current.ballX - (gameStateRef.current.paddleX + scaledPaddleWidth / 2);
      gameStateRef.current.ballSpeedX = deltaX * 0.1; // Reduced multiplier for more predictable behavior
    }
    
    // Ball out of bounds
    if (gameStateRef.current.ballY > canvas.height) {
      loseLife();
    }
    
    // Ball collision with blocks - FIXED
    let ballMoved = false;
    gameStateRef.current.blocks.forEach(block => {
      if (!block.destroyed && !ballMoved) { // Only check one collision per frame
        // Check if ball overlaps with block using proper AABB collision
        const ballLeft = gameStateRef.current.ballX - ballSize;
        const ballRight = gameStateRef.current.ballX + ballSize;
        const ballTop = gameStateRef.current.ballY - ballSize;
        const ballBottom = gameStateRef.current.ballY + ballSize;
        
        const blockLeft = block.x;
        const blockRight = block.x + block.width;
        const blockTop = block.y;
        const blockBottom = block.y + block.height;
        
        // Check for overlap
        if (ballRight > blockLeft && ballLeft < blockRight && 
            ballBottom > blockTop && ballTop < blockBottom) {
          
          block.destroyed = true;
          ballMoved = true;
          
          // Update score using React state
          setScore(prev => {
            const newScore = prev + block.points;
            gameStateRef.current.currentScore = newScore;
            return newScore;
          });
          
          createParticles(gameStateRef.current.ballX, gameStateRef.current.ballY, block.color.glow);

          // Determine which side was hit to bounce correctly
          const overlapLeft = ballRight - blockLeft;
          const overlapRight = blockRight - ballLeft;
          const overlapTop = ballBottom - blockTop;
          const overlapBottom = blockBottom - ballTop;
          
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          
          if (minOverlap === overlapTop || minOverlap === overlapBottom) {
            // Hit from top or bottom
            gameStateRef.current.ballSpeedY *= -1;
            // Move ball out of block
            if (minOverlap === overlapTop) {
              gameStateRef.current.ballY = blockTop - ballSize;
            } else {
              gameStateRef.current.ballY = blockBottom + ballSize;
            }
          } else {
            // Hit from left or right
            gameStateRef.current.ballSpeedX *= -1;
            // Move ball out of block
            if (minOverlap === overlapLeft) {
              gameStateRef.current.ballX = blockLeft - ballSize;
            } else {
              gameStateRef.current.ballX = blockRight + ballSize;
            }
          }
        }
      }
    });
    
    // Update particles
    gameStateRef.current.particles = gameStateRef.current.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });
    
    // Check for level completion
    const remainingBlocks = gameStateRef.current.blocks.filter(block => !block.destroyed);
    if (remainingBlocks.length === 0) {
      setGameState('levelComplete');
      createParticles(400, 250, "#22c55e");
    }
  }, [loseLife]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const scale = scaleRef.current;
    const scaledPaddleWidth = paddleWidth * scale;
    const scaledPaddleHeight = paddleHeight * scale;
    const scaledBallSize = ballSize * scale;

    // Clear canvas and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas.width, canvas.height);

    // Draw blocks
    gameStateRef.current.blocks.forEach(block => {
      if (!block.destroyed) {
        ctx.fillStyle = block.color.primary;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = block.color.glow;
        ctx.fillStyle = block.color.secondary;
        ctx.fillRect(block.x + 2 * scale, block.y + 2 * scale, block.width - 4 * scale, block.height - 4 * scale);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw paddle
    const paddleY = canvas.height - scaledPaddleHeight - 30 * scale;
    ctx.fillStyle = '#6366f1';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#818cf8';
    ctx.fillRect(gameStateRef.current.paddleX, paddleY, scaledPaddleWidth, scaledPaddleHeight);
    ctx.shadowBlur = 0;
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameStateRef.current.ballX, gameStateRef.current.ballY, scaledBallSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#f9a8d4';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // Draw particles
    gameStateRef.current.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });


    // PAUSED OVERLAY
    if (gameState === 'paused') {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = `bold ${36 * scale}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 15;
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20 * scale);
      
      ctx.font = `${18 * scale}px 'Courier New', monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#4338ca";
      ctx.shadowBlur = 10;
      ctx.fillText("PRESS SPACE TO RESUME", canvas.width / 2, canvas.height / 2 + 20 * scale);
      ctx.restore();
    }

    // GAME OVER / MENU OVERLAYS
    if (gameState === 'gameOver' || gameState === 'menu') {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const title = gameState === 'menu' ? "ARKANOID" : "GAME OVER";
      const titleColor = gameState === 'menu' ? '#06b6d4' : '#ef4444';
      
      ctx.font = `bold ${48 * scale}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = titleColor;
      ctx.shadowColor = titleColor;
      ctx.shadowBlur = 15;
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 80 * scale);

      if (gameState === 'gameOver') {
          ctx.font = `${24 * scale}px 'Courier New', monospace`;
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 0;
          ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2);
          ctx.font = `${20 * scale}px 'Courier New', monospace`;
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#4338ca";
          ctx.shadowBlur = 10;
          ctx.fillText("PRESS ENTER TO START", canvas.width / 2, canvas.height / 2 + 60 * scale);
      }
      ctx.restore();
    }

    // Level complete overlay
    if (gameState === 'levelComplete') {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = `bold ${36 * scale}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 15;
      ctx.fillText("LEVEL COMPLETE!", canvas.width / 2, canvas.height / 2 - 20 * scale);
      
      ctx.font = `${18 * scale}px 'Courier New', monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#4338ca";
      ctx.shadowBlur = 10;
      ctx.fillText("PRESS ENTER FOR NEXT LEVEL", canvas.width / 2, canvas.height / 2 + 20 * scale);
      ctx.restore();
    }

    if (gameState === 'menu') {
      ctx.textAlign = 'center';
      ctx.font = `bold ${48 * scaleRef.current}px 'Courier New', monospace`;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillText('ARKANOID', canvasSize.width / 2, canvasSize.height / 2 - 80 * scaleRef.current);

      ctx.font = `bold ${20 * scaleRef.current}px 'Courier New', monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#4338ca';
      ctx.shadowBlur = 10;
      ctx.fillText('Press Enter to Start', canvasSize.width / 2, canvasSize.height / 2 - 30 * scaleRef.current);
    }
  }, [score, lives, level, gameState, canvasSize, isFirstLoad]);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current.gameState === 'playing') {
      update();
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      draw(ctx);
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  // Effect to start and stop the game loop
  useEffect(() => {
    gameStateRef.current.gameState = gameState; // Keep ref in sync with react state
    
    // Start the loop if it's the first run
    if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameState, gameLoop]);

  // Effect for setting up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove]);

  useEffect(() => {
    // Simulate loading history for demo
    const mockHistory = [
      { score: 1500, level_reached: 3, created_at: new Date().toISOString() },
      { score: 2300, level_reached: 4, created_at: new Date(Date.now() - 86400000).toISOString() }
    ];
    setHistory(mockHistory);
  }, []);

return (
  <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white p-4 touch-none select-none">
    <div className="relative" id="game-container" style={{ width: canvasSize.width, height: canvasSize.height }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block mx-auto border-2 border-indigo-500 rounded-lg shadow-lg"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />
      
      <div className="absolute top-4 left-4 right-4 flex justify-between text-lg">
        <div>Score: <span className="font-bold text-cyan-400">{score}</span></div>
        <div>Level: <span className="font-bold text-purple-400">{level}</span></div>
        <div>Lives: <span className="font-bold text-green-400">{lives}</span></div>
      </div>

      <button 
        onClick={handleBackToLobby}
        className="absolute top-12 left-4 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors text-sm"
      >
        ← Lobby
      </button>

      {/* Mobile Controls */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 flex justify-between px-4">
        <button
          onTouchStart={() => gameStateRef.current.keys.left = true}
          onTouchEnd={() => gameStateRef.current.keys.left = false}
          className="bg-indigo-600/80 text-white text-xl w-20 h-20 rounded-full flex items-center justify-center active:scale-105 active:bg-indigo-500"
        >
          ←
        </button>
        <button
          onTouchStart={() => gameStateRef.current.keys.right = true}
          onTouchEnd={() => gameStateRef.current.keys.right = false}
          className="bg-indigo-600/80 text-white text-xl w-20 h-20 rounded-full flex items-center justify-center active:scale-105 active:bg-indigo-500"
        >
          →
        </button>
      </div>
    </div>

    {/* XP Gained Notification */}
    <div id="xp-notification-container" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
  </div>
);
}