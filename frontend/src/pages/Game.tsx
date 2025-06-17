import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface KeyboardEventWithPrevent extends KeyboardEvent {
  preventDefault(): void;
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
  const [gameMode, setGameMode] = useState('two-player'); // 'one-player', 'two-player'
  const [history, setHistory] = useState<{ mode: string; score: number; opponent_score: number; winner: string; created_at: string }[]>([]);
  
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
    ballX: 400,
    ballY: 250,
    ballSpeedX: 4,
    ballSpeedY: 4,
    paddle1Y: 200,
    paddle2Y: 200,
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
    gameVars.current.ballX = 400;
    gameVars.current.ballY = 250;
    gameVars.current.ballSpeedX = gameVars.current.ballSpeedX > 0 ? -4 : 4;
    gameVars.current.ballSpeedY = (Math.random() - 0.5) * 4;
  };

  const resetPaddles = () => {
    gameVars.current.paddle1Y = 200;
    gameVars.current.paddle2Y = 200;
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
      setTimeout(() => savePongScore(), 500); // Small delay to ensure state is updated
    } else if (vars.opponentScore >= WINNING_SCORE) {
      const winnerText = gameMode === 'one-player' ? 'AI Wins!' : 'Player 2';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(600, 250, "#f59e0b");
      createParticles(500, 150, "#f59e0b");
      createParticles(700, 350, "#f59e0b");
      // Save score when game ends
      setTimeout(() => savePongScore(), 500); // Small delay to ensure state is updated
    }
  };

  // Add useEffect for fetching history on component mount
  useEffect(() => {
    fetchHistory();
  }, []); // Only run once on mount

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

    // Define drawMenu function inside useEffect where canvas is available
    const drawMenu = (ctx: CanvasRenderingContext2D) => {
      if (!canvas) return; // Add safety check
      
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Title
      ctx.font = "bold 40px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#4338ca";
      ctx.shadowBlur = 15;
      ctx.fillText("CYBER PONG", canvas.width / 2, canvas.height / 2 - 80);
      
      // Game mode selection
      ctx.font = "24px 'Courier New', monospace";
      ctx.fillStyle = "#06b6d4";
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
      ctx.fillText("SELECT GAME MODE:", canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = "20px 'Courier New', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#4338ca";
      ctx.shadowBlur = 10;
      ctx.fillText("Press 1 for Single Player", canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText("Press 2 for Two Players", canvas.width / 2, canvas.height / 2 + 50);
      
      // Controls reminder
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillStyle = "#a855f7";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 10;
      ctx.fillText("SPACE: Start Game | L: Back to Lobby", canvas.width / 2, canvas.height / 2 + 100);
      
      ctx.restore();
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
			x + 12,
			y + 100
		);
		paddleGradient.addColorStop(0, color1);
		paddleGradient.addColorStop(1, color2);

		context.fillStyle = paddleGradient;
		context.fillRect(x, y, 12, 100);

		// Inner highlight
		context.shadowBlur = 0;
		context.fillStyle = "rgba(255, 255, 255, 0.3)";
		context.fillRect(x + 2, y + 2, 2, 96);

		context.restore();
	};

      drawPaddle(20, vars.paddle1Y, "#06b6d4", "#0891b2", "#06b6d4");
      drawPaddle(canvas.width - 32, vars.paddle2Y, "#f59e0b", "#d97706", "#f59e0b");

      // Draw ball with glow and trail effect
      context.save();
      context.shadowColor = "#ef4444";
      context.shadowBlur = 20;
      
      // Ball gradient
      const ballGradient = context.createRadialGradient(
        vars.ballX + 6, vars.ballY + 6, 0,
        vars.ballX + 6, vars.ballY + 6, 12
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      
      context.fillStyle = ballGradient;
      context.beginPath();
      context.arc(vars.ballX + 6, vars.ballY + 6, 6, 0, Math.PI * 2);
      context.fill();
      
      // Inner highlight
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.6)";
      context.beginPath();
      context.arc(vars.ballX + 2, vars.ballY + 2, 2, 0, Math.PI * 2);
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
      context.fillText(vars.playerScore.toString(), canvas.width / 4, 60);
      
      // Right score
      context.shadowColor = "#f59e0b";
      context.shadowBlur = 15;
      context.fillStyle = "#f59e0b";
      context.fillText(vars.opponentScore.toString(), (canvas.width * 3) / 4, 60);
      
      context.restore();

      // Game state overlays
      if (gameState === 'menu') {
        drawMenu(context);
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
        context.fillText(`Final Score: ${vars.playerScore} - ${vars.opponentScore}`, canvas.width / 2, canvas.height / 2);
        
        context.font = "18px 'Courier New', monospace";
        context.fillText("PRESS R TO PLAY AGAIN", canvas.width / 2, canvas.height / 2 + 40);
        context.fillText("PRESS SPACE FOR MENU", canvas.width / 2, canvas.height / 2 + 70);
        context.restore();
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;
      
      const vars = gameVars.current;
      const paddleSpeed = 8; // Increased paddle speed
      const paddleHeight = 100;
      const canvasHeight = canvasRef.current?.height || 500;

      // Move paddle 1 (left paddle - W/S keys)
      if (vars.keys.w && vars.paddle1Y > 0) {
        vars.paddle1Y = Math.max(0, vars.paddle1Y - paddleSpeed);
      }
      if (vars.keys.s && vars.paddle1Y + paddleHeight < canvasHeight) {
        vars.paddle1Y = Math.min(canvasHeight - paddleHeight, vars.paddle1Y + paddleSpeed);
      }

      // Move paddle 2 (right paddle - Arrow keys or AI)
      if (gameMode === 'two-player') {
        if (vars.keys.up && vars.paddle2Y > 0) {
          vars.paddle2Y = Math.max(0, vars.paddle2Y - paddleSpeed);
        }
        if (vars.keys.down && vars.paddle2Y + paddleHeight < canvasHeight) {
          vars.paddle2Y = Math.min(canvasHeight - paddleHeight, vars.paddle2Y + paddleSpeed);
        }
      } else {
        // AI movement for single player
        const aiSpeed = 5;
        const targetY = vars.ballY - paddleHeight / 2;
        if (vars.paddle2Y < targetY - aiSpeed) {
          vars.paddle2Y = Math.min(canvasHeight - paddleHeight, vars.paddle2Y + aiSpeed);
        } else if (vars.paddle2Y > targetY + aiSpeed) {
          vars.paddle2Y = Math.max(0, vars.paddle2Y - aiSpeed);
        }
      }
      
      vars.ballX += vars.ballSpeedX;
      vars.ballY += vars.ballSpeedY;

      // Bounce off top/bottom with particles
      if (vars.ballY <= 0 || vars.ballY + 12 >= canvas.height) {
        vars.ballSpeedY *= -1;
        createParticles(vars.ballX + 6, vars.ballY + 6, "#60a5fa");
      }

      // Bounce off left paddle
      if (
        vars.ballX <= 32 &&
        vars.ballY + 12 >= vars.paddle1Y &&
        vars.ballY <= vars.paddle1Y + paddleHeight &&
        vars.ballSpeedX < 0
      ) {
        vars.ballSpeedX *= -1;
        // Add some randomness to prevent boring rallies
        vars.ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(vars.ballX + 6, vars.ballY + 6, "#06b6d4");
      }

      // Bounce off right paddle
      if (
        vars.ballX + 12 >= canvas.width - 32 &&
        vars.ballY + 12 >= vars.paddle2Y &&
        vars.ballY <= vars.paddle2Y + paddleHeight &&
        vars.ballSpeedX > 0
      ) {
        vars.ballSpeedX *= -1;
        vars.ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(vars.ballX + 6, vars.ballY + 6, "#f59e0b");
      }

      // Score and reset
      if (vars.ballX < 0) {
        vars.opponentScore++;
        setScore(prev => ({ ...prev, right: vars.opponentScore }));
        resetBall();
        createParticles(canvas.width - 100, canvas.height / 2, "#f59e0b");
        setTimeout(checkWinCondition, 100);
      }
      
      if (vars.ballX > canvas.width) {
        vars.playerScore++;
        setScore(prev => ({ ...prev, left: vars.playerScore }));
        resetBall();
        createParticles(100, canvas.height / 2, "#06b6d4");
        setTimeout(checkWinCondition, 100);
      }

      // Limit ball speed
      vars.ballSpeedY = Math.max(-8, Math.min(8, vars.ballSpeedY));
      vars.ballSpeedX = Math.max(-10, Math.min(10, vars.ballSpeedX));

      // Check for winner
      if (vars.playerScore >= WINNING_SCORE || vars.opponentScore >= WINNING_SCORE) {
        savePongScore();
        setGameState('gameOver');
        return;
      }
    };

    const handleKeyDown = (e: KeyboardEventWithPrevent) => {
      console.log('Key pressed:', e.key, 'Game state:', gameState); // Debug log
      
      // Only prevent default for movement and control keys
      if (["ArrowUp", "ArrowDown", "w", "s", " ", "r", "Escape", "l"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Back to lobby key (L)
      if (e.key.toLowerCase() === 'l') {
        handleBackToLobby();
        return;
      }

      // Movement keys (only when playing)
      if (gameState === 'playing') {
        switch (e.key.toLowerCase()) {
          case 'w':
            gameVars.current.keys.w = true;
            break;
          case 's':
            gameVars.current.keys.s = true;
            break;
          case 'arrowup':
            gameVars.current.keys.up = true;
            break;
          case 'arrowdown':
            gameVars.current.keys.down = true;
            break;
        }
      }

      // Game state controls
      switch (gameState) {
        case 'menu':
          if (e.key === " ") {
            console.log('Starting game from menu');
            resetGame();
            setGameState('playing');
          } else if (e.key === "1") {
            setGameMode('one-player');
          } else if (e.key === "2") {
            setGameMode('two-player');
          }
          break;

        case 'playing':
          if (e.key === " ") {
            setGameState('paused');
          } else if (e.key === "Escape") {
            savePongScore();
            resetGame();
            setGameState('menu');
          } else if (e.key.toLowerCase() === 'r') {
            savePongScore();
            resetGame();
          }
          break;

        case 'paused':
          if (e.key === " ") {
            setGameState('playing');
          } else if (e.key === "Escape") {
            resetGame();
            setGameState('menu');
          }
          break;

        case 'gameOver':
          if (e.key.toLowerCase() === 'r') {
            resetGame();
            setGameState('playing');
          } else if (e.key === ' ') {
            resetGame();
            setGameState('menu');
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        switch (e.key.toLowerCase()) {
          case 'w':
            gameVars.current.keys.w = false;
            break;
          case 's':
            gameVars.current.keys.s = false;
            break;
          case 'arrowup':
            gameVars.current.keys.up = false;
            break;
          case 'arrowdown':
            gameVars.current.keys.down = false;
            break;
        }
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
  }, [gameState, gameMode]); // Add gameMode to dependencies

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white text-center mb-4 font-mono tracking-wider">
          CYBER PONG
        </h1>
        <div className="flex justify-center space-x-8 text-lg font-mono mb-2">
          <div className="text-cyan-400">
            Score: <span className="text-2xl font-bold">{score.left}</span>
          </div>
          <div className="text-amber-400">
            vs: <span className="text-2xl font-bold">{score.right}</span>
          </div>
          <div className="text-purple-400">
            Mode: <span className="text-2xl font-bold">{gameMode === 'one-player' ? 'Single' : 'Two Player'}</span>
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
          <p>Left: W/S | Right: ↑/↓ (in two-player mode)</p>
          <p className="text-amber-400 mt-2">SPACE: Pause/Resume | ESC: Back to Menu</p>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>R: Restart | L: Back to Lobby</p>
          <p>First to {WINNING_SCORE} points wins!</p>
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

      {/* Game History */}
      {gameState === 'menu' && history.length > 0 && (
        <div className="mt-8 w-full max-w-2xl bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-purple-400" />
            Recent Games
          </h3>
          <div className="bg-black/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-900/20">
                  <th className="px-4 py-2 text-left text-gray-300">Date</th>
                  <th className="px-4 py-2 text-left text-gray-300">Mode</th>
                  <th className="px-4 py-2 text-right text-gray-300">Score</th>
                  <th className="px-4 py-2 text-right text-gray-300">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((game, index) => (
                  <tr key={index} className="border-t border-purple-500/10">
                    <td className="px-4 py-2 text-gray-400">
                      {new Date(game.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {game.mode === 'one-player' ? 'Single Player' : 'Two Player'}
                    </td>
                    <td className="px-4 py-2 text-right text-cyan-400">
                      {game.score} - {game.opponent_score}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-mono ${
                        game.winner === 'player' ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {game.winner === 'player' ? 'Victory' : 'Defeat'}
                      </span>
                    </td>
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