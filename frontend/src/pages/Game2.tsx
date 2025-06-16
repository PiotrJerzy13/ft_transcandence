import { useEffect, useRef, useState } from "react";

interface ArkanoidProps {
  onNavigateToLobby?: () => void;
}

export default function Arkanoid({ onNavigateToLobby }: ArkanoidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('menu');
  const [history, setHistory] = useState<{ score: number; level_reached: number; created_at: string }[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  
  const paddleWidth = 120;
  const paddleHeight = 15;
  const ballSize = 12;
  const blockWidth = 75;
  const blockHeight = 25;
  const blockRows = 6;
  const blockCols = 10;
  const blockPadding = 5;
  
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
  }>({
    paddleX: 340,
    ballX: 400,
    ballY: 400,
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
    }
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
  
interface CreateParticlesFn {
	(x: number, y: number, color?: string): void;
}

const createParticles: CreateParticlesFn = (x, y, color = "#60a5fa") => {
	for (let i = 0; i < 12; i++) {
		gameStateRef.current.particles.push({
			x: x,
			y: y,
			vx: (Math.random() - 0.5) * 8,
			vy: (Math.random() - 0.5) * 8,
			life: 40,
			maxLife: 40,
			color: color
		});
	}
};

const saveArkanoidScore = async () => {
	try {
	  // Get current user stats first to calculate total XP
	  const statsResponse = await fetch('/api/user/stats', {
		method: 'GET',
		credentials: 'include',
	  });
	  
	  let currentTotalXp = 0;
	  if (statsResponse.ok) {
		const statsData = await statsResponse.json();
		currentTotalXp = statsData.xp || 0;
	  }
  
	  // Calculate total XP (current + earned this session)
	  const totalXp = currentTotalXp + xpEarned;
  
	  const response = await fetch('/api/arkanoid/score', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
		  score: gameStateRef.current.currentScore,
		  levelReached: gameStateRef.current.currentLevel,
		  xpEarned: xpEarned, // XP earned this session
		  totalXp: totalXp,   // Total XP after this session
		}),
	  });
  
	  if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	  }
  
	  const data = await response.json();
	  console.log('Score and XP saved successfully:', data);
	  if (data.userStats) {
		setXp(data.userStats.xp);
		setLevel(data.userStats.level);
	  }
	} catch (err) {
	  console.error('Failed to save Arkanoid score:', err);
	}
  };


  const initializeBlocks = () => {
    gameStateRef.current.blocks = [];
    const startX = (800 - (blockCols * (blockWidth + blockPadding) - blockPadding)) / 2;
    const startY = 80;
    
    for (let row = 0; row < blockRows; row++) {
      for (let col = 0; col < blockCols; col++) {
        gameStateRef.current.blocks.push({
          x: startX + col * (blockWidth + blockPadding),
          y: startY + row * (blockHeight + blockPadding),
          width: blockWidth,
          height: blockHeight,
          destroyed: false,
          color: blockColors[row % blockColors.length],
          points: (blockRows - row) * 10
        });
      }
    }
  };

  const resetGame = () => {
    gameStateRef.current.currentScore = 0;
    gameStateRef.current.currentLives = 3;
    gameStateRef.current.currentLevel = 1;
    setScore(0);
    setLives(3);
    setLevel(1);
    setXpEarned(0);
    resetBall();
    resetPaddle();
    initializeBlocks();
    gameStateRef.current.particles = [];
  };

  const resetBall = () => {
    gameStateRef.current.ballX = 400;
    gameStateRef.current.ballY = 400;
    gameStateRef.current.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 2.5;
    gameStateRef.current.ballSpeedY = -2.5;
  };

  const resetPaddle = () => {
    gameStateRef.current.paddleX = 340;
  };
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
	document.getElementById('game-container')?.appendChild(xpGainElement);
	
	// Remove after animation
	setTimeout(() => xpGainElement.remove(), 1500);
	};

	// Visual effect for level up
	const showLevelUpNotification = (newLevel: number) => {
	const levelUpElement = document.createElement('div');
	levelUpElement.className = 'level-up-notification';
	levelUpElement.textContent = `LEVEL UP! ${newLevel-1} → ${newLevel}`;
	levelUpElement.style.position = 'absolute';
	levelUpElement.style.color = '#f59e0b';
	levelUpElement.style.fontWeight = 'bold';
	levelUpElement.style.animation = 'pulse 2s ease-in-out';
	
	// Position appropriately
	document.getElementById('game-container')?.appendChild(levelUpElement);
	
	// Remove after animation
	setTimeout(() => levelUpElement.remove(), 2000);
	};


	const nextLevel = () => {
		// Calculate XP earned for completing the level
		const levelXpEarned = calculateLevelXp(
		gameStateRef.current.currentScore,
		gameStateRef.current.currentLevel,
		gameStateRef.current.currentLives
		);
		
		// Add to session XP total
		setXpEarned(prev => prev + levelXpEarned);
		
		// Update game state
		gameStateRef.current.currentLevel++;
		setLevel(gameStateRef.current.currentLevel);
		
		resetBall();
		resetPaddle();
		initializeBlocks();
		
		// Increase difficulty
		gameStateRef.current.ballSpeedX *= 1.05;
		gameStateRef.current.ballSpeedY *= 1.05;
		
		// Save score and XP
		saveArkanoidScore();
		
		// Show XP gain effect
		showXpGain(levelXpEarned);
		createParticles(400, 250, "#22c55e");
		setGameState('levelComplete');
	};

	const loseLife = () => {
		gameStateRef.current.currentLives--;
		setLives(gameStateRef.current.currentLives);
		
		if (gameStateRef.current.currentLives <= 0) {
		// Calculate final XP when game ends
		const gameOverXp = calculateGameOverXp(
			gameStateRef.current.currentScore,
			gameStateRef.current.currentLevel
		);
		
		// Add game over XP to existing XP earned
		setXpEarned(prev => prev + gameOverXp);
		
		// Save score and XP
		saveArkanoidScore();
		
		// Show effects
		showXpGain(gameOverXp);
		createParticles(400, 250, "#ef4444");
		setGameState('gameOver');
		} else {
		resetBall();
		resetPaddle();
		createParticles(400, 250, "#f59e0b");
		}
	};

	const handleBackToLobby = () => {
		if (onNavigateToLobby) {
		onNavigateToLobby();
		} else {
		// Fallback if no navigation function is provided
		console.log('Navigate to lobby');
		}
	};

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
	
    // Clean up previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clear key states on game state change
    gameStateRef.current.keys.left = false;
    gameStateRef.current.keys.right = false;

    if (gameState === 'menu') {
      initializeBlocks();
    }

    const draw = () => {
      // Create gradient background
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f0f23");
      gradient.addColorStop(0.5, "#1a1a3e");
      gradient.addColorStop(1, "#0f0f23");
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw blocks
      gameStateRef.current.blocks.forEach(block => {
        if (!block.destroyed) {
          context.save();
          
          context.shadowColor = block.color.glow;
          context.shadowBlur = 8;
          
          const blockGradient = context.createLinearGradient(
            block.x, block.y, 
            block.x, block.y + block.height
          );
          blockGradient.addColorStop(0, block.color.primary);
          blockGradient.addColorStop(1, block.color.secondary);
          
          context.fillStyle = blockGradient;
          context.fillRect(block.x, block.y, block.width, block.height);
          
          context.shadowBlur = 0;
          context.fillStyle = "rgba(255, 255, 255, 0.3)";
          context.fillRect(block.x + 2, block.y + 2, block.width - 4, 2);
          
          context.strokeStyle = "rgba(255, 255, 255, 0.2)";
          context.lineWidth = 1;
          context.strokeRect(block.x, block.y, block.width, block.height);
          
          context.restore();
        }
      });

      // Draw paddle
      context.save();
      context.shadowColor = "#06b6d4";
      context.shadowBlur = 15;
      
      const paddleGradient = context.createLinearGradient(
        gameStateRef.current.paddleX, 470, gameStateRef.current.paddleX, 470 + paddleHeight
      );
      paddleGradient.addColorStop(0, "#06b6d4");
      paddleGradient.addColorStop(1, "#0891b2");
      
      context.fillStyle = paddleGradient;
      context.fillRect(gameStateRef.current.paddleX, 470, paddleWidth, paddleHeight);
      
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.4)";
      context.fillRect(gameStateRef.current.paddleX + 2, 472, paddleWidth - 4, 3);
      
      context.restore();

      // Draw ball
      context.save();
      context.shadowColor = "#ef4444";
      context.shadowBlur = 20;
      
      const ballGradient = context.createRadialGradient(
        gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, 0,
        gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, ballSize
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      
      context.fillStyle = ballGradient;
      context.beginPath();
      context.arc(gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, ballSize/2, 0, Math.PI * 2);
      context.fill();
      
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.6)";
      context.beginPath();
      context.arc(gameStateRef.current.ballX + ballSize/3, gameStateRef.current.ballY + ballSize/3, ballSize/6, 0, Math.PI * 2);
      context.fill();
      
      context.restore();

      // Draw particles
      if (gameState === 'playing') {
        gameStateRef.current.particles = gameStateRef.current.particles.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life--;
          particle.vx *= 0.98;
          particle.vy *= 0.98;
          
          const alpha = particle.life / particle.maxLife;
          context.save();
          context.globalAlpha = alpha;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          context.fill();
          context.restore();
          
          return particle.life > 0;
        });
      } else {
        gameStateRef.current.particles.forEach(particle => {
          const alpha = particle.life / particle.maxLife;
          context.save();
          context.globalAlpha = alpha;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
      }

      // Draw UI
      context.save();
      context.font = "bold 24px 'Courier New', monospace";
      context.textAlign = "left";
      context.fillStyle = "#06b6d4";
      context.shadowColor = "#06b6d4";
      context.shadowBlur = 10;
      context.fillText(`Score: ${gameStateRef.current.currentScore}`, 20, 40);
      
      context.textAlign = "center";
      context.fillStyle = "#f59e0b";
      context.shadowColor = "#f59e0b";
      context.fillText(`Lives: ${gameStateRef.current.currentLives}`, canvas.width / 2, 40);
      
      context.textAlign = "right";
      context.fillStyle = "#a855f7";
      context.shadowColor = "#a855f7";
      context.fillText(`Level: ${gameStateRef.current.currentLevel}`, canvas.width - 20, 40);
      context.restore();

      // Game overlays
      if (gameState === 'menu') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 40px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 15;
        context.fillText("CYBER ARKANOID", canvas.width / 2, canvas.height / 2 - 80);
        
        context.font = "20px 'Courier New', monospace";
        context.fillText("Break all blocks to advance!", canvas.width / 2, canvas.height / 2 - 40);
        context.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2);
        
        context.font = "16px 'Courier New', monospace";
        context.fillText("A/D or ←/→ to move paddle", canvas.width / 2, canvas.height / 2 + 40);
        context.fillText("R: Restart | ESC: Back to Menu", canvas.width / 2, canvas.height / 2 + 65);
        context.fillText("L: Back to Lobby", canvas.width / 2, canvas.height / 2 + 90);
        context.restore();
      }

      if (gameState === 'paused') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 36px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#f59e0b";
        context.shadowColor = "#f59e0b";
        context.shadowBlur = 15;
        context.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);
        
        context.font = "18px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText("PRESS SPACE TO RESUME", canvas.width / 2, canvas.height / 2 + 20);
        context.fillText("ESC: Back to Menu | L: Back to Lobby", canvas.width / 2, canvas.height / 2 + 45);
        context.restore();
      }

      if (gameState === 'gameOver') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 36px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#ef4444";
        context.shadowColor = "#ef4444";
        context.shadowBlur = 15;
        context.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
        
        context.font = "24px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText(`Final Score: ${gameStateRef.current.currentScore}`, canvas.width / 2, canvas.height / 2);
        context.fillText(`Level Reached: ${gameStateRef.current.currentLevel}`, canvas.width / 2, canvas.height / 2 + 30);
        
        context.font = "18px 'Courier New', monospace";
        context.fillText("PRESS R TO PLAY AGAIN", canvas.width / 2, canvas.height / 2 + 70);
        context.fillText("PRESS SPACE FOR MENU | L: Back to Lobby", canvas.width / 2, canvas.height / 2 + 95);
        context.restore();
      }

      if (gameState === 'levelComplete') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 32px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#22c55e";
        context.shadowColor = "#22c55e";
        context.shadowBlur = 15;
        context.fillText("LEVEL COMPLETE!", canvas.width / 2, canvas.height / 2 - 20);
        
        context.font = "20px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText("PRESS SPACE TO CONTINUE", canvas.width / 2, canvas.height / 2 + 20);
        
        context.font = "16px 'Courier New', monospace";
        context.fillText("L: Back to Lobby", canvas.width / 2, canvas.height / 2 + 50);
        context.restore();
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;
      
      const paddleSpeed = 6;
      if (gameStateRef.current.keys.left) {
        gameStateRef.current.paddleX = Math.max(0, gameStateRef.current.paddleX - paddleSpeed);
      }
      if (gameStateRef.current.keys.right) {
        gameStateRef.current.paddleX = Math.min(canvas.width - paddleWidth, gameStateRef.current.paddleX + paddleSpeed);
      }
      
      gameStateRef.current.ballX += gameStateRef.current.ballSpeedX;
      gameStateRef.current.ballY += gameStateRef.current.ballSpeedY;

      // Ball collision with walls
      if (gameStateRef.current.ballX <= 0 || gameStateRef.current.ballX + ballSize >= canvas.width) {
        gameStateRef.current.ballSpeedX *= -1;
        createParticles(gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, "#60a5fa");
      }
      
      if (gameStateRef.current.ballY <= 0) {
        gameStateRef.current.ballSpeedY *= -1;
        createParticles(gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, "#60a5fa");
      }

      // Ball falls off bottom
      if (gameStateRef.current.ballY > canvas.height) {
        loseLife();
        return;
      }

      // Ball collision with paddle
      if (
        gameStateRef.current.ballY + ballSize >= 470 &&
        gameStateRef.current.ballY <= 470 + paddleHeight &&
        gameStateRef.current.ballX + ballSize >= gameStateRef.current.paddleX &&
        gameStateRef.current.ballX <= gameStateRef.current.paddleX + paddleWidth &&
        gameStateRef.current.ballSpeedY > 0
      ) {
        gameStateRef.current.ballSpeedY *= -1;
        
        const hitPos = (gameStateRef.current.ballX + ballSize/2 - gameStateRef.current.paddleX) / paddleWidth;
        gameStateRef.current.ballSpeedX = (hitPos - 0.5) * 6;
        
        createParticles(gameStateRef.current.ballX + ballSize/2, gameStateRef.current.ballY + ballSize/2, "#06b6d4");
      }

      // Ball collision with blocks
      gameStateRef.current.blocks.forEach(block => {
        if (block.destroyed) return;
        
        if (
          gameStateRef.current.ballX + ballSize >= block.x &&
          gameStateRef.current.ballX <= block.x + block.width &&
          gameStateRef.current.ballY + ballSize >= block.y &&
          gameStateRef.current.ballY <= block.y + block.height
        ) {
          block.destroyed = true;
          gameStateRef.current.currentScore += block.points;
          setScore(gameStateRef.current.currentScore);
          
          const ballCenterX = gameStateRef.current.ballX + ballSize/2;
          const ballCenterY = gameStateRef.current.ballY + ballSize/2;
          const blockCenterX = block.x + block.width/2;
          const blockCenterY = block.y + block.height/2;
          
          const dx = ballCenterX - blockCenterX;
          const dy = ballCenterY - blockCenterY;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            gameStateRef.current.ballSpeedX *= -1;
          } else {
            gameStateRef.current.ballSpeedY *= -1;
          }
          
          createParticles(
            block.x + block.width/2, 
            block.y + block.height/2, 
            block.color.primary
          );
        }
      });

      // Check if all blocks are destroyed
      const remainingBlocks = gameStateRef.current.blocks.filter(block => !block.destroyed);
      if (remainingBlocks.length === 0) {
        setGameState('levelComplete');
        createParticles(400, 250, "#22c55e");
      }
    };

	interface KeyboardEventWithPrevent extends KeyboardEvent {
	  preventDefault(): void;
	}

	const handleKeyDown = (e: KeyboardEventWithPrevent) => {
	  if (["ArrowLeft", "ArrowRight", "a", "d", " ", "r", "Escape", "l"].includes(e.key)) {
		e.preventDefault();
	  }

	  // Back to lobby key (L)
	  if (e.key.toLowerCase() === 'l') {
		handleBackToLobby();
		return;
	  }

	  // Movement keys (only when playing)
	  if (gameState === 'playing') {
		if (e.key.toLowerCase() === "a" || e.key === "ArrowLeft") {
		  gameStateRef.current.keys.left = true;
		}
		if (e.key.toLowerCase() === "d" || e.key === "ArrowRight") {
		  gameStateRef.current.keys.right = true;
		}
	  }

	  // Game state controls
	  switch (gameState) {
		case 'menu':
		  if (e.key === " ") {
			// Start new game from menu
			resetGame();
			setGameState('playing');
		  }
		  break;

		case 'playing':
		  if (e.key === " ") {
			// Pause game - no reset
			setGameState('paused');
		  } else if (e.key === "Escape") {
			// Return to menu - save score and reset
			saveArkanoidScore();
			resetGame();
			setGameState('menu');
		  } else if (e.key.toLowerCase() === 'r') {
			// Restart game - save score and reset
			saveArkanoidScore();
			resetGame();
		  }
		  break;

		case 'paused':
		  if (e.key === " ") {
			// Resume game - no reset
			setGameState('playing');
		  } else if (e.key === "Escape") {
			// Return to menu - reset everything
			resetGame();
			setGameState('menu');
		  }
		  break;

		case 'levelComplete':
		  if (e.key === " ") {
			// Continue to next level
			nextLevel();
			setGameState('playing');
		  }
		  break;

		case 'gameOver':
		  if (e.key.toLowerCase() === 'r') {
			// Restart game completely
			resetGame();
			setGameState('playing');
		  } else if (e.key === ' ') {
			// Return to menu
			resetGame();
			setGameState('menu');
		  }
		  break;
	  }
	};

	interface KeyUpEvent extends KeyboardEvent {
	  key: string;
	}

	const handleKeyUp = (e: KeyUpEvent) => {
	  if (e.key.toLowerCase() === "a" || e.key === "ArrowLeft") {
		gameStateRef.current.keys.left = false;
	  }
	  if (e.key.toLowerCase() === "d" || e.key === "ArrowRight") {
		gameStateRef.current.keys.right = false;
	  }
	};

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = () => {
      update();
      draw();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/arkanoid/history', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🎮 Arkanoid Score History:', data.history);
        setHistory(data.history);
      } catch (err) {
        console.error('Failed to load Arkanoid history:', err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white text-center mb-4 font-mono tracking-wider">
          CYBER ARKANOID
        </h1>
        <div className="flex justify-center space-x-8 text-lg font-mono mb-2">
          <div className="text-cyan-400">
            Score: <span className="text-2xl font-bold">{score}</span>
          </div>
          <div className="text-amber-400">
            Lives: <span className="text-2xl font-bold">{lives}</span>
          </div>
          <div className="text-purple-400">
            Level: <span className="text-2xl font-bold">{level}</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="border-2 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/50 bg-black"
        />
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 rounded-lg blur opacity-20"></div>
      </div>
      
      <div className="mt-6 text-center text-gray-300 font-mono">
        <div className="text-sm">
          <p className="text-cyan-400 font-bold mb-1">Controls:</p>
          <p>Hold A/D or ←/→ keys to move paddle</p>
          <p className="text-amber-400 mt-2">SPACE: Pause/Resume | ESC: Back to Menu</p>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>R: Restart | L: Back to Lobby</p>
          <p>Break all blocks to advance!</p>
        </div>
      </div>

      {/* Lobby Button - visible when on menu screen */}
      {gameState === 'menu' && (
        <button
          onClick={handleBackToLobby}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-mono"
        >
          ← BACK TO LOBBY
        </button>
      )}

      {/* Score History */}
      {history.length > 0 && (
        <div className="mt-6 text-left text-sm text-gray-300 font-mono w-full max-w-2xl">
          <h2 className="text-xl text-cyan-400 font-bold mb-2">Your Arkanoid History</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-500">
                <th className="pb-1">Date</th>
                <th className="pb-1">Score</th>
                <th className="pb-1">Level</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-2">{new Date(entry.created_at).toLocaleDateString()}</td>
                  <td className="py-2">{entry.score}</td>
                  <td className="py-2">{entry.level_reached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}