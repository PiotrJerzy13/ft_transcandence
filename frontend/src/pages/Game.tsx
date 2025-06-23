import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}


const WINNING_SCORE = 5;

type GameProps = {
  onNavigateToLobby?: () => void;
};

export default function Game({ onNavigateToLobby }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [winner, setWinner] = useState('');
  const [gameMode, setGameMode] = useState('one-player'); // 'one-player', 'two-player'
  const [history, setHistory] = useState<{ mode: string; score: number; opponent_score: number; winner: string; created_at: string }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);

  const scaleRef = useRef(1);
  const baseWidth = 800;
  const baseHeight = 500;
  
  // Add a ref to track if the current game has been saved
  const gameScoreSaved = useRef(false);
  
  // Update gameVars type to include particles
  const gameVars = useRef<{
    playerScore: number;
    opponentScore: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    paddle1Y: number;
    paddle2Y: number;
    particles: Particle[];
    keys: {
      w: boolean;
      s: boolean;
      up: boolean;
      down: boolean;
    };
  }>({
    playerScore: 0,
    opponentScore: 0,
    ballX: canvasSize.width / 2,
    ballY: canvasSize.height / 2,
    ballSpeedX: 4,
    ballSpeedY: 4,
    paddle1Y: canvasSize.height / 2 - 50,
    paddle2Y: canvasSize.height / 2 - 50,
    particles: [],
    keys: {
      w: false,
      s: false,
      up: false,
      down: false
    }
  });
  
  // Update createParticles function with proper typing
  const createParticles = (x: number, y: number, color: string = "#60a5fa") => {
    for (let i = 0; i < 12; i++) {
      gameVars.current.particles.push({
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

  const resetGame = () => {
    // Reset game score saved flag
    gameScoreSaved.current = false;
    
    gameVars.current.playerScore = 0;
    gameVars.current.opponentScore = 0;
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
    gameVars.current.ballX = canvasSize.width / 2;
    gameVars.current.ballY = canvasSize.height / 2;
    const speed = 4 * scaleRef.current;
    gameVars.current.ballSpeedX = gameVars.current.ballSpeedX > 0 ? -speed : speed;
    gameVars.current.ballSpeedY = (Math.random() - 0.5) * speed;
  };

  const resetPaddles = () => {
    const scale = scaleRef.current;
    gameVars.current.paddle1Y = canvasSize.height / 2 - (100 * scale) / 2;
    gameVars.current.paddle2Y = canvasSize.height / 2 - (100 * scale) / 2;
  };

    const handleBackToLobby = () => {
    if (onNavigateToLobby) {
      onNavigateToLobby();
    } else {
      // Fallback if no navigation function is provided
      console.log('Navigate to lobby');
    }
  };
	
  // Calculate XP for winning a game
  const calculateWinXp = (score: number, opponentScore: number): number => {
    const baseXp = 100; // Base XP for winning
    const scoreBonus = Math.floor(score / 2); // 1 XP per 2 points
    const marginBonus = Math.floor((score - opponentScore) * 5); // Bonus for winning by a larger margin
    return baseXp + scoreBonus + marginBonus;
  };

  // Calculate XP for losing a game
  const calculateLossXp = (score: number): number => {
    const baseXp = 25; // Base XP for losing
    const scoreBonus = Math.floor(score / 4); // Less XP per point for losing
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
    xpGainElement.style.fontSize = '24px';
    xpGainElement.style.top = '50%';
    xpGainElement.style.left = '50%';
    xpGainElement.style.transform = 'translate(-50%, -50%)';
    xpGainElement.style.zIndex = '1000';
    xpGainElement.style.pointerEvents = 'none';
    xpGainElement.style.animation = 'floatUp 2s ease-out forwards';
    
    // Add CSS animation if it doesn't exist
    if (!document.getElementById('xp-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'xp-animation-styles';
      style.textContent = `
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-50px);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(xpGainElement);
    setTimeout(() => xpGainElement.remove(), 2000);
  };

  const savePongScore = async () => {
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

      // Calculate XP based on game result
      const isWinner = winner.includes('You') || winner.includes('Player 1');
      const xpEarned = isWinner 
        ? calculateWinXp(gameVars.current.playerScore, gameVars.current.opponentScore)
        : calculateLossXp(gameVars.current.playerScore);

      console.log('Saving game:', {
        mode: gameMode,
        score: gameVars.current.playerScore,
        opponentScore: gameVars.current.opponentScore,
        winner: isWinner ? 'player' : 'opponent',
        xpEarned: xpEarned
      });

      // Show XP gain effect
      showXpGain(xpEarned);

      // Calculate total XP (current + earned this session)
      const totalXp = currentTotalXp + xpEarned;

      const response = await fetch('/api/pong/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: gameMode,
          score: gameVars.current.playerScore,
          opponentScore: gameVars.current.opponentScore,
          winner: isWinner ? 'player' : 'opponent',
          xpEarned: xpEarned,
          totalXp: totalXp,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Score and XP saved successfully:', data);
      
      // Refresh history after saving
      fetchHistory();
    } catch (err) {
      console.error('Failed to save Pong score:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/pong/history', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎮 Pong Score History:', data.history);
      setHistory(data.history);
    } catch (err) {
      console.error('Failed to load Pong history:', err);
    }
  };

  const checkWinCondition = () => {
    const vars = gameVars.current;
    if (vars.playerScore >= WINNING_SCORE) {
      const winnerText = gameMode === 'one-player' ? 'You Win!' : 'Player 1';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(200, 250, "#06b6d4");
      createParticles(300, 150, "#06b6d4");
      createParticles(400, 350, "#06b6d4");
      // Save score when game ends
      setTimeout(() => savePongScore(), 500);
    } else if (vars.opponentScore >= WINNING_SCORE) {
      const winnerText = gameMode === 'one-player' ? 'AI Wins!' : 'Player 2';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(600, 250, "#f59e0b");
      createParticles(500, 150, "#f59e0b");
      createParticles(700, 350, "#f59e0b");
      // Save score when game ends
      setTimeout(() => savePongScore(), 500);
    }
  };

  useEffect(() => {
    fetchHistory();

    const checkDeviceType = () => {
      setIsMobile(window.innerWidth < 768); // Threshold for mobile devices
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const container = canvas.parentElement;
      if (container) {
        const { width } = container.getBoundingClientRect();
        const newWidth = Math.min(width, baseWidth);
        const newHeight = (newWidth / baseWidth) * baseHeight;
        
        setCanvasSize({ width: newWidth, height: newHeight });
        scaleRef.current = newWidth / baseWidth;
        
        resetPaddles();
        resetBall();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main game loop effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Reset keys on state change
    gameVars.current.keys = { w: false, s: false, up: false, down: false };
    
    // Define scaled dimensions here to be available in the entire scope
    const paddleWidth = 15 * scaleRef.current;
    const paddleHeight = 100 * scaleRef.current;
    const ballSize = 10 * scaleRef.current;
    
    const drawPaddle = (
      x: number,
      y: number,
      color1: string,
      color2: string,
      shadowColor: string
    ) => {
      ctx.save();
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 15;
      
      const gradient = ctx.createLinearGradient(x, y, x, y + paddleHeight);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, paddleWidth, paddleHeight);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(x + 2, y + 2, paddleWidth - 4, 3);
      
      ctx.restore();
    };

    const draw = () => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
      gradient.addColorStop(0, "#0f0f23");
      gradient.addColorStop(0.5, "#1a1a3e");
      gradient.addColorStop(1, "#0f0f23");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Dashed line
      ctx.strokeStyle = "#4338ca";
      ctx.lineWidth = 4 * scaleRef.current;
      ctx.setLineDash([10 * scaleRef.current, 10 * scaleRef.current]);
      ctx.beginPath();
      ctx.moveTo(canvasSize.width / 2, 0);
      ctx.lineTo(canvasSize.width / 2, canvasSize.height);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Paddles
      drawPaddle(30 * scaleRef.current, gameVars.current.paddle1Y, "#06b6d4", "#0891b2", "#06b6d4");
      drawPaddle(canvasSize.width - (30 * scaleRef.current) - paddleWidth, gameVars.current.paddle2Y, "#a855f7", "#9333ea", "#a855f7");
      
      // Ball
      ctx.save();
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 20;
      const ballGradient = ctx.createRadialGradient(
        gameVars.current.ballX, gameVars.current.ballY, 0,
        gameVars.current.ballX, gameVars.current.ballY, ballSize
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(gameVars.current.ballX, gameVars.current.ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Scores
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${48 * scaleRef.current}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(String(score.left), canvasSize.width / 2 - 60 * scaleRef.current, 60 * scaleRef.current);
      ctx.fillText(String(score.right), canvasSize.width / 2 + 60 * scaleRef.current, 60 * scaleRef.current);

      // Particles
      gameVars.current.particles = gameVars.current.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * scaleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return p.life > 0;
      });

      // Game state overlays
      if (gameState === 'paused') {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        
        ctx.font = `bold ${36 * scaleRef.current}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#f59e0b";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.fillText("PAUSED", canvasSize.width / 2, canvasSize.height / 2 - 20 * scaleRef.current);
        
        ctx.font = `${18 * scaleRef.current}px 'Courier New', monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#4338ca";
        ctx.shadowBlur = 10;
        ctx.fillText("PRESS SPACE TO RESUME", canvasSize.width / 2, canvasSize.height / 2 + 20 * scaleRef.current);
        ctx.restore();
      }

      if (gameState === 'gameOver') {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        
        ctx.font = `bold ${36 * scaleRef.current}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        
        const winnerColor = winner.includes('You') || winner.includes('Player 1') ? '#06b6d4' : '#f59e0b';
        ctx.fillStyle = winnerColor;
        ctx.shadowColor = winnerColor;
        ctx.shadowBlur = 15;
        ctx.fillText(winner, canvasSize.width / 2, canvasSize.height / 2 - 40 * scaleRef.current);
        
        ctx.font = `${20 * scaleRef.current}px 'Courier New', monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#4338ca";
        ctx.shadowBlur = 10;
        ctx.fillText(`Final Score: ${score.left} - ${score.right}`, canvasSize.width / 2, canvasSize.height / 2);
        
        ctx.font = `${18 * scaleRef.current}px 'Courier New', monospace`;
        ctx.fillText("PRESS R TO PLAY AGAIN", canvasSize.width / 2, canvasSize.height / 2 + 40 * scaleRef.current);
        ctx.restore();
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;

      const paddleSpeed = 6 * scaleRef.current;

      // Player 1 movement
      if (gameVars.current.keys.w && gameVars.current.paddle1Y > 0) {
        gameVars.current.paddle1Y -= paddleSpeed;
      }
      if (gameVars.current.keys.s && gameVars.current.paddle1Y < canvasSize.height - paddleHeight) {
        gameVars.current.paddle1Y += paddleSpeed;
      }

      // Player 2 / AI movement
      if (gameMode === 'two-player') {
        if (gameVars.current.keys.up && gameVars.current.paddle2Y > 0) {
          gameVars.current.paddle2Y -= paddleSpeed;
        }
        if (gameVars.current.keys.down && gameVars.current.paddle2Y < canvasSize.height - paddleHeight) {
          gameVars.current.paddle2Y += paddleSpeed;
        }
      } else { // AI logic
        const paddle2Center = gameVars.current.paddle2Y + paddleHeight / 2;
        if (paddle2Center < gameVars.current.ballY - 35) {
          gameVars.current.paddle2Y += paddleSpeed * 0.8;
        } else if (paddle2Center > gameVars.current.ballY + 35) {
          gameVars.current.paddle2Y -= paddleSpeed * 0.8;
        }
      }

      // Ball movement
      gameVars.current.ballX += gameVars.current.ballSpeedX;
      gameVars.current.ballY += gameVars.current.ballSpeedY;

      // Ball collision with top/bottom walls
      if (gameVars.current.ballY < ballSize || gameVars.current.ballY > canvasSize.height - ballSize) {
        gameVars.current.ballSpeedY *= -1;
      }

      // Ball collision with paddles
      const paddle1X = 30 * scaleRef.current;
      const paddle2X = canvasSize.width - (30 * scaleRef.current) - paddleWidth;
      // Left paddle
      if (gameVars.current.ballX - ballSize < paddle1X + paddleWidth &&
          gameVars.current.ballY > gameVars.current.paddle1Y &&
          gameVars.current.ballY < gameVars.current.paddle1Y + paddleHeight) {
        if (gameVars.current.ballSpeedX < 0) {
          gameVars.current.ballSpeedX *= -1.1; // Increase speed on hit
          createParticles(gameVars.current.ballX, gameVars.current.ballY, "#06b6d4");
        }
      }
      // Right paddle
      if (gameVars.current.ballX + ballSize > paddle2X &&
          gameVars.current.ballY > gameVars.current.paddle2Y &&
          gameVars.current.ballY < gameVars.current.paddle2Y + paddleHeight) {
        if (gameVars.current.ballSpeedX > 0) {
          gameVars.current.ballSpeedX *= -1.1; // Increase speed on hit
          createParticles(gameVars.current.ballX, gameVars.current.ballY, "#a855f7");
        }
      }

      // Scoring
      if (gameVars.current.ballX < 0) {
        gameVars.current.opponentScore++;
        setScore({ left: gameVars.current.playerScore, right: gameVars.current.opponentScore });
        resetBall();
      } else if (gameVars.current.ballX > canvasSize.width) {
        gameVars.current.playerScore++;
        setScore({ left: gameVars.current.playerScore, right: gameVars.current.opponentScore });
        resetBall();
      }
      checkWinCondition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Movement keys are always tracked
      if (e.key === 'w' || e.key === 'W') gameVars.current.keys.w = true;
      if (e.key === 's' || e.key === 'S') gameVars.current.keys.s = true;
      if (e.key === 'ArrowUp') gameVars.current.keys.up = true;
      if (e.key === 'ArrowDown') gameVars.current.keys.down = true;

      // Game state controls
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }

      if (gameState === 'gameOver' && (e.key === 'r' || e.key === 'R')) {
        resetGame();
        setGameState('playing');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') gameVars.current.keys.w = false;
      if (e.key === 's' || e.key === 'S') gameVars.current.keys.s = false;
      if (e.key === 'ArrowUp') gameVars.current.keys.up = false;
      if (e.key === 'ArrowDown') gameVars.current.keys.down = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (gameState !== 'playing') return;

      const canvasRect = canvas.getBoundingClientRect();
      
      Array.from(e.touches).forEach(touch => {
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        
        if (touchX < canvasSize.width / 2) { // Left half
          let newY = touchY - paddleHeight / 2;
          if (newY < 0) newY = 0;
          if (newY > canvasSize.height - paddleHeight) newY = canvasSize.height - paddleHeight;
          gameVars.current.paddle1Y = newY;
        } else { // Right half
          if (gameMode === 'two-player') {
            let newY = touchY - paddleHeight / 2;
            if (newY < 0) newY = 0;
            if (newY > canvasSize.height - paddleHeight) newY = canvasSize.height - paddleHeight;
            gameVars.current.paddle2Y = newY;
          }
        }
      });
    };

    const gameLoop = () => {
      if (gameState === 'playing') {
        update();
      }
      if (gameState !== 'menu') {
        draw();
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchMove, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, gameMode, canvasSize, score, winner]);

  const startGame = (mode: 'one-player' | 'two-player') => {
    setGameMode(mode);
    resetGame();
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-mono tracking-wider">
        CYBER PONG
      </h1>
      <div className="relative w-full max-w-4xl aspect-[16/10] bg-black rounded-lg shadow-2xl shadow-purple-500/50 border-2 border-purple-500/50">
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-mono tracking-wider mb-8 animate-pulse">
              CYBER PONG
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => startGame('one-player')}
                className="px-8 py-4 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-all duration-300 font-mono"
              >
                1 Player
              </button>
              {!isMobile && (
                <button
                  onClick={() => startGame('two-player')}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 font-mono"
                >
                  2 Players
                </button>
              )}
            </div>
            {isMobile && (
              <p className="mt-4 text-sm text-gray-400 font-mono">
                Two-player mode is available on larger screens.
              </p>
            )}
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          width={canvasSize.width} 
          height={canvasSize.height}
          className="w-full h-full rounded-lg"
          style={{ display: gameState === 'menu' ? 'none' : 'block' }}
        />
      </div>
      <div className="flex justify-between w-full max-w-4xl mt-4 text-lg px-2">
        <div className="text-cyan-400">P1: <span className="font-bold">{score.left}</span></div>
        <div className="text-purple-400">P2: <span className="font-bold">{score.right}</span></div>
      </div>
      
      <button
        onClick={handleBackToLobby}
        className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-mono text-sm"
      >
        Back to Lobby
      </button>

      {history.length > 0 && (
        <div className="mt-6 text-left text-sm text-gray-300 font-mono w-full max-w-2xl">
          <h2 className="text-lg sm:text-xl text-cyan-400 font-bold mb-2">Your Pong History</h2>
          <div className="max-h-32 overflow-y-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left border-b border-gray-500">
                  <th className="pb-1 px-1">Date</th>
                  <th className="pb-1 px-1">Mode</th>
                  <th className="pb-1 px-1">Score</th>
                  <th className="pb-1 px-1">Winner</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 px-1">{new Date(entry.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-1">{entry.mode}</td>
                    <td className="py-2 px-1">{entry.score} - {entry.opponent_score}</td>
                    <td className="py-2 px-1">{entry.winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}