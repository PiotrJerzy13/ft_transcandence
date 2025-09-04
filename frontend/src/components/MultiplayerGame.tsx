import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToasts } from '../context/ToastContext';
import { usePlayerData } from '../context/PlayerDataContext';
import {
  GameState,
  GameStatus,
  PlayerAction,
  GameEvent,
  Position,
  WebSocketStats,
  MatchmakingStatus
} from '../types';

interface MultiplayerGameProps {
  sessionId?: string;
  onGameEnd?: (winner: string, finalScore: { left: number; right: number }) => void;
}

export default function MultiplayerGame({ sessionId, onGameEnd }: MultiplayerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  
  const { addToast } = useToasts();
  const { playerData } = usePlayerData();

  // Game constants
  const GAME_CONSTANTS = {
    PADDLE_SPEED: 300,
    BALL_SPEED: 400,
    PADDLE_WIDTH: 20,
    PADDLE_HEIGHT: 100,
    BALL_RADIUS: 10,
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    MAX_SCORE: 11,
    COUNTDOWN_DURATION: 3,
    UPDATE_RATE: 60,
    NETWORK_UPDATE_RATE: 20,
  };

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://${window.location.hostname}:3000/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received message:', data);
        handleWebSocketMessage(data);
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    return ws;
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'connection_established':
        setLocalPlayerId(message.userId);
        break;
      
      case 'game_state_update':
        setGameState(message.gameState);
        break;
      
      case 'game_event':
        handleGameEvent(message.event);
        break;
      
      case 'match_found':
        // Handle match found notification
        addToast({
          id: Date.now(),
          name: 'Match Found!',
          description: `Starting game with ${message.opponentUsername}`,
          icon: '🎮',
          unlocked: true,
          progress: 1,
          maxProgress: 1,
        });
        break;
      
      default:
        console.log('📨 Unhandled message type:', message.type);
    }
  };

  // Handle game events
  const handleGameEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'countdown':
        setCountdown(event.data.countdown || 3);
        break;
      
      case 'game_start':
        setCountdown(null);
        addToast({
          id: Date.now(),
          name: 'Game Started!',
          description: 'Good luck!',
          icon: '🚀',
          unlocked: true,
          progress: 1,
          maxProgress: 1,
        });
        break;
      
      case 'game_end':
        if (onGameEnd && event.data.playerId) {
          const winner = gameState?.players.find(p => p.id === event.data.playerId)?.username || 'Unknown';
          const finalScore = {
            left: gameState?.players[0]?.score || 0,
            right: gameState?.players[1]?.score || 0,
          };
          onGameEnd(winner, finalScore);
        }
        break;
      
      case 'score_change':
        // Score updates are handled by game state updates
        break;
    }
  };

  // Send player actions to server
  const sendPlayerAction = useCallback((action: Omit<PlayerAction, 'timestamp' | 'playerId'>) => {
    if (!wsRef.current || !localPlayerId || !gameState) return;

    const playerAction: PlayerAction = {
      ...action,
      playerId: localPlayerId,
      timestamp: Date.now(),
    };

    wsRef.current.send(JSON.stringify({
      type: 'player_action',
      action: playerAction,
    }));
  }, [localPlayerId, gameState]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameState || gameState.status !== GameStatus.ACTIVE) return;

    const key = e.key.toLowerCase();
    if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
      e.preventDefault();
      
      if (!keysPressed.has(key)) {
        setKeysPressed(prev => new Set(prev).add(key));
        
        let direction: 'up' | 'down' | 'stop' = 'stop';
        if (key === 'w' || key === 'arrowup') direction = 'up';
        else if (key === 's' || key === 'arrowdown') direction = 'down';
        
        sendPlayerAction({
          type: 'move_paddle',
          sessionId: gameState.sessionId,
          data: { direction },
        });
      }
    }
  }, [gameState, keysPressed, sendPlayerAction]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      if (gameState) {
        sendPlayerAction({
          type: 'move_paddle',
          sessionId: gameState.sessionId,
          data: { direction: 'stop' },
        });
      }
    }
  }, [gameState, sendPlayerAction]);

  // Send ready status
  const sendReady = useCallback(() => {
    if (!gameState) return;
    
    sendPlayerAction({
      type: 'ready',
      sessionId: gameState.sessionId,
      data: {},
    });
  }, [gameState, sendPlayerAction]);

  // Game rendering
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameState) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    gameState.players.forEach((player, index) => {
      const isLeftPlayer = index === 0;
      const x = isLeftPlayer ? 20 : width - 40;
      const y = player.position.y;
      
      ctx.fillStyle = isLeftPlayer ? '#06b6d4' : '#a855f7';
      ctx.fillRect(x, y, GAME_CONSTANTS.PADDLE_WIDTH, GAME_CONSTANTS.PADDLE_HEIGHT);
      
      // Draw player name
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = isLeftPlayer ? 'left' : 'right';
      ctx.fillText(player.username, isLeftPlayer ? x + 25 : x - 5, 30);
      
      // Draw score
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.score.toString(), isLeftPlayer ? width / 4 : (width * 3) / 4, 80);
    });
    
    // Draw ball
    if (gameState.ball) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(
        gameState.ball.position.x,
        gameState.ball.position.y,
        GAME_CONSTANTS.BALL_RADIUS,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw countdown
    if (countdown !== null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '72px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(countdown.toString(), width / 2, height / 2);
    }
    
    // Draw game status
    if (gameState.status === GameStatus.WAITING) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for players to be ready...', width / 2, height / 2);
    }
  }, [gameState, countdown]);

  // Game loop
  useEffect(() => {
    if (!gameState) return;

    const gameLoop = () => {
      renderGame();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, renderGame]);

  // Initialize WebSocket on mount
  useEffect(() => {
    const ws = initializeWebSocket();
    
    return () => {
      ws.close();
    };
  }, [initializeWebSocket]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Multiplayer Pong</h1>
          <div className="text-white mb-4">
            {connectionStatus === 'connecting' && 'Connecting to server...'}
            {connectionStatus === 'disconnected' && 'Disconnected from server'}
            {error && <div className="text-red-400">Error: {error}</div>}
          </div>
          <button
            onClick={initializeWebSocket}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Multiplayer Pong</h1>
          <div className="text-white mb-4">Waiting for game to start...</div>
          <div className="text-gray-400 text-sm">
            Connected as: {playerData?.username || 'Unknown'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">Multiplayer Pong</h1>
      
      {/* Game Canvas */}
      <div className="relative w-full max-w-4xl aspect-[16/10] bg-black rounded-lg shadow-2xl shadow-purple-500/50 border-2 border-purple-500/50">
        <canvas
          ref={canvasRef}
          width={GAME_CONSTANTS.GAME_WIDTH}
          height={GAME_CONSTANTS.GAME_HEIGHT}
          className="w-full h-full rounded-lg"
        />
        
        {/* Game Overlay */}
        {gameState.status === GameStatus.WAITING && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Waiting for Players</h2>
              <div className="mb-4">
                {gameState.players.map((player, index) => (
                  <div key={player.id} className="mb-2">
                    <span className={player.isReady ? 'text-green-400' : 'text-yellow-400'}>
                      {player.username} {player.isReady ? '✅' : '⏳'}
                    </span>
                  </div>
                ))}
              </div>
              {!gameState.players.find(p => p.id === localPlayerId)?.isReady && (
                <button
                  onClick={sendReady}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  I'm Ready!
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Game Info */}
      <div className="mt-4 text-white text-center">
        <div className="mb-2">
          <span className="text-cyan-400">Status: </span>
          <span className="capitalize">{gameState.status}</span>
        </div>
        {countdown !== null && (
          <div className="text-2xl font-bold text-yellow-400">
            Game starts in: {countdown}
          </div>
        )}
      </div>
      
      {/* Controls Info */}
      <div className="mt-4 text-gray-400 text-sm text-center">
        <div>Controls: W/S or ↑/↓ to move paddle</div>
        <div>Space to pause/resume</div>
      </div>
      
      {/* Back to Lobby */}
      <button
        onClick={() => navigate('/lobby')}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Back to Lobby
      </button>
    </div>
  );
}
