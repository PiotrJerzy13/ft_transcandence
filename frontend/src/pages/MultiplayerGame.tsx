import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToasts } from '../context/ToastContext';
import { usePlayerData } from '../context/PlayerDataContext';
import MultiplayerGame from '../components/MultiplayerGame';
import { MatchmakingStatus } from '../types';

export default function MultiplayerGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isInMatchmaking, setIsInMatchmaking] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatus | null>(null);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScore, setFinalScore] = useState<{ left: number; right: number } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  
  const { addToast } = useToasts();
  const { playerData } = usePlayerData();

  // Check if we have a session ID from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId) {
      setGameSessionId(sessionId);
      console.log('🎮 Joining existing game session:', sessionId);
    }
  }, [searchParams]);

  // Join matchmaking queue
  const joinMatchmaking = async () => {
    try {
      setIsInMatchmaking(true);
      
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'pong'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎮 Joined matchmaking:', data);
      
      addToast({
        id: Date.now(),
        name: 'Matchmaking',
        description: 'Searching for opponent...',
        icon: '🔍',
        unlocked: true,
        progress: 1,
        maxProgress: 1,
      });

      // Start polling for matchmaking status
      pollMatchmakingStatus();
      
    } catch (error) {
      console.error('❌ Failed to join matchmaking:', error);
      setIsInMatchmaking(false);
      addToast({
        id: Date.now(),
        name: 'Error',
        description: 'Failed to join matchmaking queue',
        icon: '❌',
        unlocked: true,
        progress: 1,
        maxProgress: 1,
      });
    }
  };

  // Leave matchmaking queue
  const leaveMatchmaking = async () => {
    try {
      const response = await fetch('/api/matchmaking/leave', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setIsInMatchmaking(false);
        setMatchmakingStatus(null);
        addToast({
          id: Date.now(),
          name: 'Matchmaking',
          description: 'Left matchmaking queue',
          icon: '🚪',
          unlocked: true,
          progress: 1,
          maxProgress: 1,
        });
      }
    } catch (error) {
      console.error('❌ Failed to leave matchmaking:', error);
    }
  };

  // Poll matchmaking status
  const pollMatchmakingStatus = async () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/matchmaking/status', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setMatchmakingStatus(data);
          
          // Check if we're still in queue
          const isStillInQueue = data.queueEntries?.some(
            (entry: any) => entry.playerId === playerData?.id
          );
          
          if (!isStillInQueue && isInMatchmaking) {
            setIsInMatchmaking(false);
            clearInterval(pollInterval);
            addToast({
              id: Date.now(),
              name: 'Matchmaking',
              description: 'Left matchmaking queue',
              icon: '🚪',
              unlocked: true,
              progress: 1,
              maxProgress: 1,
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to poll matchmaking status:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval after 5 minutes (timeout)
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isInMatchmaking) {
        setIsInMatchmaking(false);
        addToast({
          id: Date.now(),
          name: 'Matchmaking Timeout',
          description: 'No match found after 5 minutes',
          icon: '⏰',
          unlocked: true,
          progress: 1,
          maxProgress: 1,
        });
      }
    }, 5 * 60 * 1000);

    return pollInterval;
  };

  // Handle game end
  const handleGameEnd = (winnerName: string, score: { left: number; right: number }) => {
    setGameEnded(true);
    setWinner(winnerName);
    setFinalScore(score);
    
    addToast({
      id: Date.now(),
      name: 'Game Over!',
      description: `${winnerName} wins! Final score: ${score.left} - ${score.right}`,
      icon: '🏆',
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    });
  };

  // Start new game
  const startNewGame = () => {
    setGameEnded(false);
    setWinner(null);
    setFinalScore(null);
    setGameSessionId(null);
  };

  // If we have a game session, show the multiplayer game
  if (gameSessionId) {
    return (
      <MultiplayerGame
        sessionId={gameSessionId}
        onGameEnd={handleGameEnd}
      />
    );
  }

  // If game ended, show results
  if (gameEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-8">Game Over!</h1>
          
          <div className="bg-black/50 rounded-lg p-8 mb-8 border border-purple-500/50">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              🏆 {winner} Wins!
            </h2>
            
            {finalScore && (
              <div className="text-2xl text-white mb-6">
                Final Score: <span className="text-cyan-400">{finalScore.left}</span> - <span className="text-purple-400">{finalScore.right}</span>
              </div>
            )}
            
            <div className="text-gray-300 mb-6">
              Thanks for playing! 🎮
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startNewGame}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-300"
            >
              Play Again
            </button>
            
            <button
              onClick={() => navigate('/lobby')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-300"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-8 font-mono tracking-wider">
          🎮 MULTIPLAYER PONG
        </h1>
        
        <div className="bg-black/50 rounded-lg p-8 mb-8 border border-purple-500/50">
          <h2 className="text-2xl font-bold text-white mb-6">
            Challenge Players Worldwide! 🌍
          </h2>
          
          <div className="text-gray-300 mb-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Real-time multiplayer gameplay</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Live game state synchronization</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Instant matchmaking</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✅</span>
              <span>60 FPS smooth gameplay</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {!isInMatchmaking ? (
            <button
              onClick={joinMatchmaking}
              className="w-full px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 text-xl"
            >
              🚀 Find Match
            </button>
          ) : (
            <div className="space-y-4">
              <div className="px-8 py-4 bg-yellow-600 text-white rounded-lg font-semibold text-xl">
                🔍 Searching for opponent...
              </div>
              
              {matchmakingStatus && (
                <div className="text-white text-sm">
                  Players in queue: {matchmakingStatus.queueEntries?.length || 0}
                </div>
              )}
              
              <button
                onClick={leaveMatchmaking}
                className="w-full px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300"
              >
                ❌ Cancel Search
              </button>
            </div>
          )}
          
          <button
            onClick={() => navigate('/lobby')}
            className="w-full px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-300"
          >
            🏠 Back to Lobby
          </button>
        </div>
        
        {/* Game Instructions */}
        <div className="mt-8 text-gray-400 text-sm max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-2">How to Play:</h3>
          <ul className="text-left space-y-1">
            <li>• Use <kbd className="px-1 bg-gray-700 rounded">W</kbd>/<kbd className="px-1 bg-gray-700 rounded">S</kbd> or <kbd className="px-1 bg-gray-700 rounded">↑</kbd>/<kbd className="px-1 bg-gray-700 rounded">↓</kbd> to move paddle</li>
            <li>• First to 11 points wins</li>
            <li>• Ball speeds up after each hit</li>
            <li>• Both players must be ready to start</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
