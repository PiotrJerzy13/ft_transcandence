import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface QueueEntry {
  gameType: string;
  joinedAt: string;
  expiresAt: string;
}

interface GameSession {
  id: number;
  sessionId: string;
  gameType: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  player1Id: number;
  player2Id: number;
  player1Score: number;
  player2Score: number;
  maxScore: number;
  createdAt: string;
  startedAt?: string;
}

interface MatchmakingQueueProps {
  onGameFound?: (session: GameSession) => void;
}

export default function MatchmakingQueue({ onGameFound }: MatchmakingQueueProps) {
  const [isInQueue, setIsInQueue] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'pong' | 'arkanoid'>('pong');
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Function to show message and clear it after 3 seconds
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // Check queue status on component mount
  useEffect(() => {
    checkQueueStatus();
    checkActiveSessions();
  }, []);

  const checkQueueStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MATCHMAKING_STATUS, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setQueueEntries(data.queueEntries || []);
        setIsInQueue(data.queueEntries && data.queueEntries.length > 0);
      }
    } catch (error) {
      console.error('Error checking queue status:', error);
    }
  };

  const checkActiveSessions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ACTIVE_GAME_SESSIONS, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions || []);
        
        // Check for new waiting sessions (potential matches found)
        const waitingSessions = data.sessions?.filter((s: GameSession) => s.status === 'waiting') || [];
        if (waitingSessions.length > 0 && onGameFound) {
          onGameFound(waitingSessions[0]);
        }
      }
    } catch (error) {
      console.error('Error checking active sessions:', error);
    }
  };

  const joinQueue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.JOIN_MATCHMAKING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gameType: selectedGame,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsInQueue(true);
        setQueueEntries([data.queueEntry]);
        showMessage(`✅ Joined ${selectedGame} matchmaking queue!`);
        
        // Start polling for active sessions
        setTimeout(checkActiveSessions, 2000);
      } else {
        const errorData = await response.json();
        showMessage(`❌ ${errorData.message || 'Failed to join queue'}`);
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      showMessage('❌ Failed to join queue');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveQueue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LEAVE_MATCHMAKING, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gameType: selectedGame,
        }),
      });

      if (response.ok) {
        setIsInQueue(false);
        setQueueEntries([]);
        showMessage('✅ Left matchmaking queue');
      } else {
        const errorData = await response.json();
        showMessage(`❌ ${errorData.message || 'Failed to leave queue'}`);
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
      showMessage('❌ Failed to leave queue');
    } finally {
      setIsLoading(false);
    }
  };

  const getGameDisplayName = (gameType: string) => {
    switch (gameType) {
      case 'pong':
        return '🏓 Pong';
      case 'arkanoid':
        return '🧱 Arkanoid';
      default:
        return gameType;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'waiting':
        return '⏳ Waiting for players';
      case 'active':
        return '🎮 Game in progress';
      case 'completed':
        return '✅ Completed';
      case 'cancelled':
        return '❌ Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">🎮 Quick Match</h2>
      
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.includes('❌') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {message}
        </div>
      )}
      
      {/* Game Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Game
        </label>
        <div className="flex gap-4">
          {(['pong', 'arkanoid'] as const).map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                selectedGame === game
                  ? 'border-blue-400 bg-blue-400/20 text-blue-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {getGameDisplayName(game)}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Controls */}
      <div className="mb-6">
        {!isInQueue ? (
          <button
            onClick={joinQueue}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : `Join ${getGameDisplayName(selectedGame)} Queue`}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-gray-300">Searching for opponent...</p>
              <p className="text-sm text-gray-400 mt-1">
                Game: {getGameDisplayName(selectedGame)}
              </p>
            </div>
            <button
              onClick={leaveQueue}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Leaving...' : 'Leave Queue'}
            </button>
          </div>
        )}
      </div>

      {/* Active Game Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Games</h3>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">
                    {getGameDisplayName(session.gameType)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                    {getStatusDisplayName(session.status)}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  <div>Score: {session.player1Score} - {session.player2Score}</div>
                  <div>Created: {new Date(session.createdAt).toLocaleString()}</div>
                </div>
                {session.status === 'waiting' && (
                  <button
                    onClick={() => onGameFound?.(session)}
                    className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Join Game
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Information */}
      {queueEntries.length > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Queue Status</h3>
          {queueEntries.map((entry, index) => (
            <div key={index} className="text-sm text-gray-400">
              <div>Game: {getGameDisplayName(entry.gameType)}</div>
              <div>Joined: {new Date(entry.joinedAt).toLocaleTimeString()}</div>
              <div>Expires: {new Date(entry.expiresAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
