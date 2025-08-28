import React from 'react';

interface Match {
  id: number;
  player1_id: number | null;
  player2_id: number | null;
  player1_username?: string;
  player2_username?: string;
  player1_score: number | null;
  player2_score: number | null;
  status: 'pending' | 'ongoing' | 'completed';
  round: number;
  match_number: number;
}

interface MatchCardProps {
  match: Match;
  currentUserId?: number;
  onPlayMatch?: (matchId: number) => void;
}

export default function MatchCard({ match, currentUserId, onPlayMatch }: MatchCardProps) {
  const getPlayerDisplay = (playerId: number | null, playerUsername?: string) => {
    if (playerId === null) return 'TBD';
    if (playerUsername) return playerUsername;
    return `Player ${playerId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'ongoing':
        return 'text-blue-400 bg-blue-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getScoreDisplay = () => {
    if (match.player1_score === null || match.player2_score === null) {
      return 'vs';
    }
    return `${match.player1_score} - ${match.player2_score}`;
  };

  const isPlayerInMatch = () => {
    return currentUserId && (
      match.player1_id === currentUserId || 
      match.player2_id === currentUserId
    );
  };

  const canPlayMatch = () => {
    return match.status === 'pending' && 
           match.player1_id && 
           match.player2_id && 
           isPlayerInMatch();
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs text-gray-400">
          Round {match.round} • Match {match.match_number}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
          {match.status === 'completed' ? 'Finished' :
           match.status === 'ongoing' ? 'In Progress' :
           'Pending'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">
            {getPlayerDisplay(match.player1_id, match.player1_username)}
          </span>
          {match.player1_score !== null && (
            <span className="text-white font-bold text-lg">
              {match.player1_score}
            </span>
          )}
        </div>
        
        <div className="text-center text-gray-400 font-medium">
          {getScoreDisplay()}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">
            {getPlayerDisplay(match.player2_id, match.player2_username)}
          </span>
          {match.player2_score !== null && (
            <span className="text-white font-bold text-lg">
              {match.player2_score}
            </span>
          )}
        </div>
      </div>
      
      {canPlayMatch() && onPlayMatch && (
        <div className="mt-4 pt-3 border-t border-slate-600">
          <button
            onClick={() => onPlayMatch(match.id)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🎮 Play Match
          </button>
        </div>
      )}
      
      {match.status === 'ongoing' && isPlayerInMatch() && (
        <div className="mt-4 pt-3 border-t border-slate-600">
          <div className="text-center text-blue-400 text-sm font-medium">
            🎯 Match in progress...
          </div>
        </div>
      )}
      
      {match.status === 'completed' && (
        <div className="mt-4 pt-3 border-t border-slate-600">
          <div className="text-center text-green-400 text-sm font-medium">
            ✅ Match completed
          </div>
        </div>
      )}
    </div>
  );
}
