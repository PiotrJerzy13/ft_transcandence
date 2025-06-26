import { useEffect, useRef, useState, useCallback } from "react";
import { Arkanoid } from "./arkanoid";
import { calculateGameOverXp, calculateLevelXp, showXpGain } from "./xpCalculator";

interface ArkanoidProps {
  onNavigateToLobby?: () => void;
}

export default function ArkanoidGame({ onNavigateToLobby }: ArkanoidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver', 'levelComplete'
  const [history, setHistory] = useState<{ score: number; level_reached: number; created_at: string }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const animationFrameRef = useRef<number | null>(null);
  const gameInstanceRef = useRef<Arkanoid | null>(null);
  
  const blockColors = [
    { primary: "#ef4444", secondary: "#dc2626", glow: "#ef4444" },
    { primary: "#f97316", secondary: "#ea580c", glow: "#f97316" },
    { primary: "#eab308", secondary: "#ca8a04", glow: "#eab308" },
    { primary: "#22c55e", secondary: "#16a34a", glow: "#22c55e" },
    { primary: "#3b82f6", secondary: "#2563eb", glow: "#3b82f6" },
    { primary: "#a855f7", secondary: "#9333ea", glow: "#a855f7" },
  ];

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxWidth = Math.min(window.innerWidth - 20, 800);
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? window.innerHeight * 0.8 : 600 * (maxWidth / 800);

    setCanvasSize({ 
      width: Math.floor(maxWidth),
      height: Math.floor(maxHeight) 
    });

    if (gameInstanceRef.current) {
      gameInstanceRef.current.scale = maxWidth / 800;
    }
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(handleResize, 300);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [handleResize]);

  useEffect(() => {
    // Initialize game instance
    const gameSettings = {
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      paddleWidth: 120,
      paddleHeight: 15,
      ballSize: 12,
      initialLives: 3
    };

    const scale = canvasSize.width / 800;
    gameInstanceRef.current = new Arkanoid(gameSettings, scale, blockColors);

    // Set up callbacks
    gameInstanceRef.current.setCallbacks({
      onScoreChange: (newScore) => setScore(newScore),
      onLivesChange: (newLives) => setLives(newLives),
      onLevelChange: (newLevel) => setLevel(newLevel),
      onGameOver: () => {
        const xpGained = calculateGameOverXp(score, level);
        setXpEarned(prev => prev + xpGained);
        showXpGain(xpGained);
        setGameState('gameOver');
      },
      onLevelComplete: () => {
        const xpGained = calculateLevelXp(score, level, lives);
        setXpEarned(prev => prev + xpGained);
        showXpGain(xpGained);
        setGameState('levelComplete');
      },
      onXpEarned: (xp) => setXpEarned(prev => prev + xp)
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasSize]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameInstanceRef.current) return;

    if (gameState === 'playing') {
      gameInstanceRef.current.update();
    }

    gameInstanceRef.current.draw(ctx, canvas.width, canvas.height);
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameInstanceRef.current) return;

    if (e.key === 'ArrowLeft' || e.key === 'a') {
      gameInstanceRef.current.setKeyState('left', true);
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      gameInstanceRef.current.setKeyState('right', true);
    }

    if (e.key === 'Enter') {
      if (gameState === 'menu' || gameState === 'gameOver') {
        gameInstanceRef.current.resetGame(true);
        setGameState('playing');
      } else if (gameState === 'levelComplete') {
        gameInstanceRef.current.nextLevel();
        setGameState('playing');
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
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!gameInstanceRef.current) return;

    if (e.key === 'ArrowLeft' || e.key === 'a') {
      gameInstanceRef.current.setKeyState('left', false);
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      gameInstanceRef.current.setKeyState('right', false);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing' || !gameInstanceRef.current) return;

    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    const scaledPaddleWidth = 120 * (canvasSize.width / 800);
    const targetX = touchX - scaledPaddleWidth / 2;
    gameInstanceRef.current.state.paddleX = Math.max(0, Math.min(canvas.width - scaledPaddleWidth, targetX));
  }, [gameState, canvasSize]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!gameInstanceRef.current) return;

    if (gameState === 'menu' || gameState === 'gameOver') {
      gameInstanceRef.current.resetGame(true);
      setGameState('playing');
    } else if (gameState === 'levelComplete') {
      gameInstanceRef.current.nextLevel();
      setGameState('playing');
    } else {
      handleTouchMove(e);
    }
  }, [gameState, handleTouchMove]);

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

  const handleBackToLobby = () => {
    if (onNavigateToLobby) {
      onNavigateToLobby();
    }
  };

  useEffect(() => {
    setGameState('menu'); // Always reset to menu on mount
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
        {(gameState === 'menu' || gameState === 'gameOver') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <h2 className="text-3xl font-bold mb-4">
              {gameState === 'menu' ? 'ARKANOID' : 'Game Over'}
            </h2>
            <p className="text-lg mb-2">
              {gameState === 'menu'
                ? 'Press Enter to Start'
                : 'Press Enter to Play Again'}
            </p>
            {gameState === 'gameOver' && (
              <p className="text-lg mb-2">Score: {score} | Level: {level}</p>
            )}
          </div>
        )}
        
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
            onTouchStart={() => gameInstanceRef.current?.setKeyState('left', true)}
            onTouchEnd={() => gameInstanceRef.current?.setKeyState('left', false)}
            className="bg-indigo-600/80 text-white text-xl w-20 h-20 rounded-full flex items-center justify-center active:scale-105 active:bg-indigo-500"
          >
            ←
          </button>
          <button
            onTouchStart={() => gameInstanceRef.current?.setKeyState('right', true)}
            onTouchEnd={() => gameInstanceRef.current?.setKeyState('right', false)}
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