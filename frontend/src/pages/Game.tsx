import React, { useEffect, useRef, useState } from "react";
import { Pong } from "./pong";
import { useNavigate } from "react-router-dom";
import { useToasts } from '../context/ToastContext';
import { usePlayerData } from '../context/PlayerDataContext';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pongGameRef = useRef<Pong | null>(null);
  const navigate = useNavigate();
  
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [winner, setWinner] = useState('');
  const [gameMode, setGameMode] = useState<'one-player' | 'two-player'>('one-player');
  const [history, setHistory] = useState<{ mode: string; score: number; opponent_score: number; winner: string; created_at: string }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);

  const scaleRef = useRef(1);
  const baseWidth = 800;
  const baseHeight = 500;
  const gameScoreSaved = useRef(false);

  const { addToast } = useToasts();
  const { refetch: refetchPlayerData } = usePlayerData();

  // Initialize Pong game
  const initializePongGame = () => {
    const gameSettings = {
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      paddleHeight: 100,
      paddleWidth: 15,
      ballSize: 10,
      winningScore: 5,
      paddleSpeed: 6,
      ballSpeed: 4,
      aiPaddleSpeed: 4.8, // 6 * 0.8
      aiTargetOffset: 35,
      ballSpeedIncrease: 1.1
    };

    pongGameRef.current = new Pong(gameSettings, scaleRef.current);
  };

  const resetGame = () => {
    gameScoreSaved.current = false;
    if (pongGameRef.current) {
      pongGameRef.current.resetGame();
    }
    setScore({ left: 0, right: 0 });
    setWinner('');
  };

  const handleBackToLobby = () => {
	navigate("/lobby");
  };

  // XP calculation functions (same as before)
  const calculateWinXp = (score: number, opponentScore: number): number => {
    const baseXp = 100;
    const scoreBonus = Math.floor(score / 2);
    const marginBonus = Math.floor((score - opponentScore) * 5);
    return baseXp + scoreBonus + marginBonus;
  };

  const calculateLossXp = (score: number): number => {
    const baseXp = 25;
    const scoreBonus = Math.floor(score / 4);
    return baseXp + scoreBonus;
  };

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
    if (!pongGameRef.current) return;

    try {
      const gameState = pongGameRef.current.getState();
      const isWinner = winner.includes('You') || winner.includes('Player 1');
      const xpEarned = isWinner 
        ? calculateWinXp(gameState.playerScore, gameState.opponentScore)
        : calculateLossXp(gameState.playerScore);
      
      showXpGain(xpEarned);

      // The duration would be calculated from the start of the game
      const durationInSeconds = 60; // Example: 60 seconds

      const response = await fetch('/api/pong/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          score: gameState.playerScore,
          opponentScore: gameState.opponentScore,
          winner: isWinner ? 'player' : 'opponent',
          xpEarned: xpEarned,
          duration: durationInSeconds,
          isPerfectGame: isWinner && gameState.opponentScore === 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Score saved:', data);
      
      // Refetch the shared player data after the game is saved.
      refetchPlayerData(); 

      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((ach: import('../types').Achievement) => {
          addToast(ach);
        });
      }
      // fetchHistory(); // The Lobby will now have a history component
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

  // Initialize game on mount
  useEffect(() => {
    fetchHistory();

    const checkDeviceType = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // Handle canvas resizing
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
        
        // Update Pong game scale if it exists
        if (pongGameRef.current) {
          pongGameRef.current.updateScale(scaleRef.current);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize Pong game when canvas size changes
  useEffect(() => {
    initializePongGame();
  }, [canvasSize]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !pongGameRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const pongGame = pongGameRef.current;
    const scaledDimensions = pongGame.getScaledDimensions();

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
      
      const gradient = ctx.createLinearGradient(x, y, x, y + scaledDimensions.paddleHeight);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, scaledDimensions.paddleWidth, scaledDimensions.paddleHeight);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(x + 2, y + 2, scaledDimensions.paddleWidth - 4, 3);
      
      ctx.restore();
    };

    const draw = () => {
      if (!pongGameRef.current) return;
      const currentGameState = pongGameRef.current.getState();
      const particles = pongGameRef.current.getParticles();

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
      drawPaddle(scaledDimensions.paddle1X, currentGameState.paddle1Y, "#06b6d4", "#0891b2", "#06b6d4");
      drawPaddle(scaledDimensions.paddle2X, currentGameState.paddle2Y, "#a855f7", "#9333ea", "#a855f7");
      
      // Ball
      ctx.save();
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 20;
      const ballGradient = ctx.createRadialGradient(
        currentGameState.ballX, currentGameState.ballY, 0,
        currentGameState.ballX, currentGameState.ballY, scaledDimensions.ballSize
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(currentGameState.ballX, currentGameState.ballY, scaledDimensions.ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Scores
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${48 * scaleRef.current}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(String(score.left), canvasSize.width / 2 - 60 * scaleRef.current, 60 * scaleRef.current);
      ctx.fillText(String(score.right), canvasSize.width / 2 + 60 * scaleRef.current, 60 * scaleRef.current);

      // Particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * scaleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    const updateGameState = () => {
      if (!pongGameRef.current || gameState !== 'playing') return;

      const { score: scoreResult, gameResult } = pongGameRef.current.update(gameMode);
      const currentGameState = pongGameRef.current.getState();
      // Update score if needed
      if (scoreResult.scored) {
        setScore({ left: currentGameState.playerScore, right: currentGameState.opponentScore });
      }

      // Handle game over
      if (gameResult.gameOver) {
        const winnerText = gameResult.winner === 'player' 
          ? (gameMode === 'one-player' ? 'You Win!' : 'Player 1 Wins!')
          : (gameMode === 'one-player' ? 'AI Wins!' : 'Player 2 Wins!');
        setWinner(winnerText);
        setGameState('gameOver');
        // Add particles from game result (create a new array instead of mutating readonly)
        if (gameResult.particles) {
          // pongGameRef.current.getParticles().push(...gameResult.particles); // <-- invalid
          // Instead, if you want to show new particles, you should update a mutable array in Pong class, or trigger a re-render
          // For now, skip this line or refactor Pong class if needed
        }
        // Save score when game ends
        if (!gameScoreSaved.current) {
          gameScoreSaved.current = true;
          setTimeout(() => savePongScore(), 500);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pongGameRef.current) return;

      // Movement keys
      if (e.key === 'w' || e.key === 'W') pongGameRef.current.setKeyState('w', true);
      if (e.key === 's' || e.key === 'S') pongGameRef.current.setKeyState('s', true);
      if (e.key === 'ArrowUp') pongGameRef.current.setKeyState('up', true);
      if (e.key === 'ArrowDown') pongGameRef.current.setKeyState('down', true);

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
      if (!pongGameRef.current) return;

      if (e.key === 'w' || e.key === 'W') pongGameRef.current.setKeyState('w', false);
      if (e.key === 's' || e.key === 'S') pongGameRef.current.setKeyState('s', false);
      if (e.key === 'ArrowUp') pongGameRef.current.setKeyState('up', false);
      if (e.key === 'ArrowDown') pongGameRef.current.setKeyState('down', false);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!pongGameRef.current || gameState !== 'playing') return;

      const canvasRect = canvas.getBoundingClientRect();
      
      Array.from(e.touches).forEach(touch => {
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        
        pongGameRef.current?.updateTouchPaddle(
          touchX, 
          touchY, 
          canvasSize.width, 
          canvasSize.height, 
          gameMode
        );
      });
    };

    const gameLoop = () => {
      updateGameState();
      draw();
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