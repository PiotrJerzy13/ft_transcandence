import { useEffect, useRef, useState } from "react";

type GameProps = {
  onNavigateToLobby?: () => void;
};

export default function Game({ onNavigateToLobby }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [winner, setWinner] = useState('');
  const [winningScore, setWinningScore] = useState(5);
  const [gameMode, setGameMode] = useState('two-player'); // 'one-player', 'two-player'
  
  // Define the type for a particle
  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number; 
    maxLife: number;
    color: string;
  };

  // Move all game variables to useRef to persist state across renders
  const gameVars = useRef<{
    paddleHeight: number;
    paddleWidth: number;
    ballSize: number;
    leftPaddleY: number;
    rightPaddleY: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    leftScore: number;
    rightScore: number;
    aiSpeed: number;
    aiReactionDelay: number;
    aiTarget: number;
    particles: Particle[];
    keys: {
      w: boolean;
      s: boolean;
      up: boolean;
      down: boolean;
    };
  }>({
    paddleHeight: 100,
    paddleWidth: 12,
    ballSize: 12,
    leftPaddleY: 160,
    rightPaddleY: 160,
    ballX: 300,
    ballY: 200,
    ballSpeedX: 4,
    ballSpeedY: 3,
    leftScore: 0,
    rightScore: 0,
    aiSpeed: 3.5,
    aiReactionDelay: 0,
    aiTarget: 250,
    particles: [],
    keys: {
      w: false,
      s: false,
      up: false,
      down: false
    }
  });
  
interface CreateParticles {
	(x: number, y: number, color?: string): void;
}

const createParticles: CreateParticles = (x, y, color = "#60a5fa") => {
	for (let i = 0; i < 8; i++) {
		gameVars.current.particles.push({
			x: x,
			y: y,
			vx: (Math.random() - 0.5) * 6,
			vy: (Math.random() - 0.5) * 6,
			life: 30,
			maxLife: 30,
			color: color
		});
	}
};

  const resetGame = () => {
    gameVars.current.leftScore = 0;
    gameVars.current.rightScore = 0;
    setScore({ left: 0, right: 0 });
    setWinner('');
    resetBall();
    resetPaddles();
    gameVars.current.keys = {
      w: false,
      s: false,
      up: false,
      down: false
    };
  };

  const resetBall = () => {
    gameVars.current.ballX = 400;
    gameVars.current.ballY = 250;
    gameVars.current.ballSpeedX = gameVars.current.ballSpeedX > 0 ? -4 : 4;
    gameVars.current.ballSpeedY = (Math.random() - 0.5) * 4;
  };

  const resetPaddles = () => {
    gameVars.current.leftPaddleY = 200;
    gameVars.current.rightPaddleY = 200;
  };

    const handleBackToLobby = () => {
    if (onNavigateToLobby) {
      onNavigateToLobby();
    } else {
      // Fallback if no navigation function is provided
      console.log('Navigate to lobby');
    }
  };
	
  const updateAI = () => {
    if (gameMode !== 'one-player' || gameState !== 'playing') return;
    
    const vars = gameVars.current;
    // AI controls the right paddle
    const paddleCenter = vars.rightPaddleY + vars.paddleHeight / 2;
    
    // Only react when ball is moving towards AI paddle
    if (vars.ballSpeedX > 0) {
      // Predict where ball will be when it reaches paddle
      const timeToReachPaddle = (760 - vars.ballX) / vars.ballSpeedX;
      const predictedBallY = vars.ballY + (vars.ballSpeedY * timeToReachPaddle);
      
      // Add some imperfection to make AI beatable
      const imperfection = (Math.random() - 0.5) * 40; // Random offset
      vars.aiTarget = predictedBallY + imperfection;
    } else {
      // When ball is moving away, move towards center
      vars.aiTarget = 250;
    }
    
    // Move AI paddle towards target with some smoothing
    const difference = vars.aiTarget - paddleCenter;
    
    if (Math.abs(difference) > 5) {
      if (difference > 0) {
        vars.rightPaddleY = Math.min(500 - vars.paddleHeight, vars.rightPaddleY + vars.aiSpeed);
      } else {
        vars.rightPaddleY = Math.max(0, vars.rightPaddleY - vars.aiSpeed);
      }
    }
    
    // Adjust AI difficulty based on score difference
    const scoreDiff = vars.rightScore - vars.leftScore;
    if (scoreDiff > 2) {
      vars.aiSpeed = Math.max(2, vars.aiSpeed - 0.1); // Make AI slower if it's winning by a lot
    } else if (scoreDiff < -2) {
      vars.aiSpeed = Math.min(5, vars.aiSpeed + 0.1); // Make AI faster if it's losing
    }
  };

  const checkWinCondition = () => {
    const vars = gameVars.current;
    if (vars.leftScore >= winningScore) {
      const winnerText = gameMode === 'one-player' ? 'You Win!' : 'Player 1';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(200, 250, "#06b6d4");
      createParticles(300, 150, "#06b6d4");
      createParticles(400, 350, "#06b6d4");
    } else if (vars.rightScore >= winningScore) {
      const winnerText = gameMode === 'one-player' ? 'AI Wins!' : 'Player 2';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(600, 250, "#f59e0b");
      createParticles(500, 150, "#f59e0b");
      createParticles(700, 350, "#f59e0b");
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
    gameVars.current.keys = {
      w: false,
      s: false,
      up: false,
      down: false
    };

    const draw = () => {
      const vars = gameVars.current;
      
      // Create gradient background
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f0f23");
      gradient.addColorStop(0.5, "#1a1a3e");
      gradient.addColorStop(1, "#0f0f23");
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line with glow effect
      context.save();
      context.strokeStyle = "#4338ca";
      context.lineWidth = 3;
      context.shadowColor = "#4338ca";
      context.shadowBlur = 10;
      context.setLineDash([15, 15]);
      context.beginPath();
      context.moveTo(canvas.width / 2, 0);
      context.lineTo(canvas.width / 2, canvas.height);
      context.stroke();
      context.restore();

      // Draw paddles with gradient and glow
	interface DrawPaddle {
		(
			x: number,
			y: number,
			color1: string,
			color2: string,
			shadowColor: string
		): void;
	}

	const drawPaddle: DrawPaddle = (x, y, color1, color2, shadowColor) => {
		context.save();

		// Glow effect
		context.shadowColor = shadowColor;
		context.shadowBlur = 15;

		// Gradient fill
		const paddleGradient = context.createLinearGradient(
			x,
			y,
			x + vars.paddleWidth,
			y + vars.paddleHeight
		);
		paddleGradient.addColorStop(0, color1);
		paddleGradient.addColorStop(1, color2);

		context.fillStyle = paddleGradient;
		context.fillRect(x, y, vars.paddleWidth, vars.paddleHeight);

		// Inner highlight
		context.shadowBlur = 0;
		context.fillStyle = "rgba(255, 255, 255, 0.3)";
		context.fillRect(x + 2, y + 2, 2, vars.paddleHeight - 4);

		context.restore();
	};

      drawPaddle(20, vars.leftPaddleY, "#06b6d4", "#0891b2", "#06b6d4");
      drawPaddle(canvas.width - 32, vars.rightPaddleY, "#f59e0b", "#d97706", "#f59e0b");

      // Draw ball with glow and trail effect
      context.save();
      context.shadowColor = "#ef4444";
      context.shadowBlur = 20;
      
      // Ball gradient
      const ballGradient = context.createRadialGradient(
        vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, 0,
        vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, vars.ballSize
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      
      context.fillStyle = ballGradient;
      context.beginPath();
      context.arc(vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, vars.ballSize/2, 0, Math.PI * 2);
      context.fill();
      
      // Inner highlight
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.6)";
      context.beginPath();
      context.arc(vars.ballX + vars.ballSize/3, vars.ballY + vars.ballSize/3, vars.ballSize/6, 0, Math.PI * 2);
      context.fill();
      
      context.restore();

      // Draw and update particles
      if (gameState === 'playing') {
        vars.particles = vars.particles.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life--;
          particle.vx *= 0.98; // Slow down over time
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
        // Still draw particles even when paused, but don't update them
        vars.particles.forEach(particle => {
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

      // Draw scores with glow
      context.save();
      context.font = "bold 48px 'Courier New', monospace";
      context.textAlign = "center";
      
      // Left score
      context.shadowColor = "#06b6d4";
      context.shadowBlur = 15;
      context.fillStyle = "#06b6d4";
      context.fillText(vars.leftScore.toString(), canvas.width / 4, 60);
      
      // Right score
      context.shadowColor = "#f59e0b";
      context.shadowBlur = 15;
      context.fillStyle = "#f59e0b";
      context.fillText(vars.rightScore.toString(), (canvas.width * 3) / 4, 60);
      
      context.restore();

      // Game state overlays
      if (gameState === 'menu') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 32px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText("CYBER PONG", canvas.width / 2, canvas.height / 2 - 80);
        
        context.font = "24px 'Courier New', monospace";
        context.fillText(`First to ${winningScore} wins!`, canvas.width / 2, canvas.height / 2 - 40);
        
        // Game mode selection
        context.font = "20px 'Courier New', monospace";
        context.fillStyle = gameMode === 'one-player' ? "#06b6d4" : "#ffffff";
        context.fillText("1: Single Player", canvas.width / 2, canvas.height / 2 - 10);
        
        context.fillStyle = gameMode === 'two-player' ? "#06b6d4" : "#ffffff";
        context.fillText("2: Two Player", canvas.width / 2, canvas.height / 2 + 15);
        
        context.font = "18px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2 + 50);
        
        context.font = "16px 'Courier New', monospace";
        const controlText = gameMode === 'one-player' ? "W/S - Your Paddle" : "W/S - Left Paddle | ↑/↓ - Right Paddle";
        context.fillText(controlText, canvas.width / 2, canvas.height / 2 + 80);
        context.fillText("1-9: Set winning score | R: Restart | SPACE: Pause/Resume", canvas.width / 2, canvas.height / 2 + 100);
        context.fillText("ESC: Back to Menu", canvas.width / 2, canvas.height / 2 + 120);
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
        context.fillText("ESC: Back to Menu", canvas.width / 2, canvas.height / 2 + 45);
        context.restore();
      }

      if (gameState === 'gameOver') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 36px 'Courier New', monospace";
        context.textAlign = "center";
        
        // Winner announcement with appropriate color
        const winnerColor = winner.includes('You') || winner.includes('Player 1') ? '#06b6d4' : '#f59e0b';
        context.fillStyle = winnerColor;
        context.shadowColor = winnerColor;
        context.shadowBlur = 15;
        context.fillText(winner, canvas.width / 2, canvas.height / 2 - 40);
        
        context.font = "20px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText(`Final Score: ${vars.leftScore} - ${vars.rightScore}`, canvas.width / 2, canvas.height / 2);
        
        context.font = "18px 'Courier New', monospace";
        context.fillText("PRESS R TO PLAY AGAIN", canvas.width / 2, canvas.height / 2 + 40);
        context.fillText("PRESS SPACE FOR MENU", canvas.width / 2, canvas.height / 2 + 70);
        context.restore();
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;
      
      const vars = gameVars.current;
      const step = 5; // Smaller step for smoother movement
      
      // Update paddle positions based on key states
      if (vars.keys.w) {
        vars.leftPaddleY = Math.max(0, vars.leftPaddleY - step);
      }
      if (vars.keys.s) {
        vars.leftPaddleY = Math.min(canvas.height - vars.paddleHeight, vars.leftPaddleY + step);
      }
      
      if (gameMode === 'two-player') {
        if (vars.keys.up) {
          vars.rightPaddleY = Math.max(0, vars.rightPaddleY - step);
        }
        if (vars.keys.down) {
          vars.rightPaddleY = Math.min(canvas.height - vars.paddleHeight, vars.rightPaddleY + step);
        }
      }
      
      updateAI(); // Update AI paddle
      
      vars.ballX += vars.ballSpeedX;
      vars.ballY += vars.ballSpeedY;

      // Bounce off top/bottom with particles
      if (vars.ballY <= 0 || vars.ballY + vars.ballSize >= canvas.height) {
        vars.ballSpeedY *= -1;
        createParticles(vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, "#60a5fa");
      }

      // Bounce off left paddle
      if (
        vars.ballX <= 32 &&
        vars.ballY + vars.ballSize >= vars.leftPaddleY &&
        vars.ballY <= vars.leftPaddleY + vars.paddleHeight &&
        vars.ballSpeedX < 0
      ) {
        vars.ballSpeedX *= -1;
        // Add some randomness to prevent boring rallies
        vars.ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, "#06b6d4");
      }

      // Bounce off right paddle
      if (
        vars.ballX + vars.ballSize >= canvas.width - 32 &&
        vars.ballY + vars.ballSize >= vars.rightPaddleY &&
        vars.ballY <= vars.rightPaddleY + vars.paddleHeight &&
        vars.ballSpeedX > 0
      ) {
        vars.ballSpeedX *= -1;
        vars.ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(vars.ballX + vars.ballSize/2, vars.ballY + vars.ballSize/2, "#f59e0b");
      }

      // Score and reset
      if (vars.ballX < 0) {
        vars.rightScore++;
        setScore(prev => ({ ...prev, right: vars.rightScore }));
        resetBall();
        createParticles(canvas.width - 100, canvas.height / 2, "#f59e0b");
        setTimeout(checkWinCondition, 100);
      }
      
      if (vars.ballX > canvas.width) {
        vars.leftScore++;
        setScore(prev => ({ ...prev, left: vars.leftScore }));
        resetBall();
        createParticles(100, canvas.height / 2, "#06b6d4");
        setTimeout(checkWinCondition, 100);
      }

      // Limit ball speed
      vars.ballSpeedY = Math.max(-8, Math.min(8, vars.ballSpeedY));
      vars.ballSpeedX = Math.max(-10, Math.min(10, vars.ballSpeedX));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;
      
      if (["ArrowUp", "ArrowDown", "w", "s", " ", "r", "Escape", "1", "2", "l"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Back to lobby key (L)
      if (e.key.toLowerCase() === 'l') {
        handleBackToLobby();
        return;
      }
      
      // Movement keys (only when playing)
      if (gameState === 'playing') {
        if (e.key.toLowerCase() === "w") {
          gameVars.current.keys.w = true;
        }
        if (e.key.toLowerCase() === "s") {
          gameVars.current.keys.s = true;
        }
        if (gameMode === 'two-player') {
          if (e.key === "ArrowUp") {
            gameVars.current.keys.up = true;
          }
          if (e.key === "ArrowDown") {
            gameVars.current.keys.down = true;
          }
        }
      }

      // Game state controls
      switch (gameState) {
        case 'menu':
          if (e.key === " ") {
            // Start new game from menu
            setGameState('playing');
            resetGame();
          } else if (e.key === '1') {
            setGameMode('one-player');
          } else if (e.key === '2') {
            setGameMode('two-player');
          } else {
            // Set winning score (3-9, avoiding 1 and 2 which are used for mode selection)
            const num = parseInt(e.key);
            if (num >= 3 && num <= 9) {
              setWinningScore(num);
            }
          }
          break;

        case 'playing':
          if (e.key === " ") {
            // Pause game - no reset
            setGameState('paused');
          } else if (e.key === "Escape") {
            // Return to menu - reset everything
            resetGame();
            setGameState('menu');
          } else if (e.key.toLowerCase() === 'r') {
            // Restart game - reset everything but stay playing
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

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w") {
        gameVars.current.keys.w = false;
      }
      if (e.key.toLowerCase() === "s") {
        gameVars.current.keys.s = false;
      }
      if (e.key === "ArrowUp") {
        gameVars.current.keys.up = false;
      }
      if (e.key === "ArrowDown") {
        gameVars.current.keys.down = false;
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
  }, [gameState, winningScore, gameMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white text-center mb-2 font-mono tracking-wider">
          CYBER PONG
        </h1>
        <div className="text-center text-sm text-gray-300 font-mono mb-2">
          {gameMode === 'one-player' ? 'Single Player' : 'Two Player'} Mode
        </div>
        <div className="flex justify-center space-x-8 text-lg font-mono mb-2">
          <div className="text-cyan-400">
            {gameMode === 'one-player' ? 'You' : 'Player 1'}: <span className="text-2xl font-bold">{score.left}</span>
          </div>
          <div className="text-amber-400">
            {gameMode === 'one-player' ? 'AI' : 'Player 2'}: <span className="text-2xl font-bold">{score.right}</span>
          </div>
        </div>
        <div className="text-center text-sm text-gray-300 font-mono">
          First to {winningScore} wins
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
        {gameMode === 'two-player' ? (
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-cyan-400 font-bold mb-1">Player 1:</p>
              <p>W/S keys</p>
            </div>
            <div>
              <p className="text-amber-400 font-bold mb-1">Player 2:</p>
              <p>Arrow keys</p>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-cyan-400 font-bold mb-1">Your Controls:</p>
            <p>W/S keys to move paddle</p>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-400">
          <p>SPACE: Pause/Resume | ESC: Back to Menu</p>
          <p>R: Restart | 1/2: Game Mode | 3-9: Set winning score</p>
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
    </div>
  );
}