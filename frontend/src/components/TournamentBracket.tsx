import React, { useState } from 'react';

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
  bracket_type?: 'winners' | 'losers' | 'final';
  winner_advances_to?: number;
  loser_advances_to?: number;
}

interface TournamentBracketProps {
  matches: Match[];
  participants: Array<{ id: number; username: string }>;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => void;
  isEditable?: boolean;
}

export default function TournamentBracket({ 
  matches, 
  participants, 
  onMatchUpdate,
  isEditable = false 
}: TournamentBracketProps) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [editScores, setEditScores] = useState({ player1: 0, player2: 0 });

  // Group matches by round and bracket type
  const matchesByRound = matches.reduce((acc, match) => {
    const key = `${match.bracket_type || 'winners'}_${match.round}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Sort rounds and matches within each round
  const sortedRounds = Object.keys(matchesByRound)
    .map(key => {
      const [bracketType, round] = key.split('_');
      return { key, bracketType, round: parseInt(round) };
    })
    .sort((a, b) => {
      // Sort by bracket type first (winners, losers, final)
      const bracketOrder = { winners: 0, losers: 1, final: 2 };
      const aOrder = bracketOrder[a.bracketType as keyof typeof bracketOrder] || 0;
      const bOrder = bracketOrder[b.bracketType as keyof typeof bracketOrder] || 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Then by round
      return a.round - b.round;
    });

  const getPlayerDisplay = (playerId: number | null, playerUsername?: string) => {
    if (playerId === null) return 'TBD';
    if (playerUsername) return playerUsername;
    const participant = participants.find(p => p.id === playerId);
    return participant ? participant.username : `Player ${playerId}`;
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-900/20';
      case 'ongoing':
        return 'border-blue-500 bg-blue-900/20';
      case 'pending':
        return 'border-gray-600 bg-gray-900/20';
      default:
        return 'border-gray-600 bg-gray-900/20';
    }
  };

  const getBracketTypeColor = (bracketType?: string) => {
    switch (bracketType) {
      case 'winners':
        return 'border-blue-400 bg-blue-900/10';
      case 'losers':
        return 'border-orange-400 bg-orange-900/10';
      case 'final':
        return 'border-purple-400 bg-purple-900/10';
      default:
        return 'border-gray-400 bg-gray-900/10';
    }
  };

  const getScoreDisplay = (match: Match) => {
    if (match.player1_score === null || match.player2_score === null) {
      return 'vs';
    }
    return `${match.player1_score} - ${match.player2_score}`;
  };

  const getRoundTitle = (round: number, bracketType: string) => {
    if (bracketType === 'final') {
      return 'Finals';
    }
    
    const roundNames = {
      1: 'First Round',
      2: 'Second Round', 
      3: 'Quarter Finals',
      4: 'Semi Finals',
      5: 'Finals'
    };
    
    return roundNames[round as keyof typeof roundNames] || `Round ${round}`;
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match.id);
    setEditScores({
      player1: match.player1_score || 0,
      player2: match.player2_score || 0
    });
  };

  const handleSaveScore = () => {
    if (editingMatch && onMatchUpdate) {
      onMatchUpdate(editingMatch, editScores.player1, editScores.player2);
      setEditingMatch(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const renderMatch = (match: Match) => {
    const isEditing = editingMatch === match.id;
    
    return (
      <div
        key={match.id}
        className={`border-2 rounded-lg p-3 min-w-[220px] ${getMatchStatusColor(match.status)} ${getBracketTypeColor(match.bracket_type)}`}
      >
        <div className="text-xs text-gray-400 mb-2 flex justify-between">
          <span>Match {match.match_number}</span>
          {match.bracket_type && (
            <span className="capitalize">{match.bracket_type}</span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {getPlayerDisplay(match.player1_id, match.player1_username)}
            </span>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editScores.player1}
                onChange={(e) => setEditScores(prev => ({ ...prev, player1: parseInt(e.target.value) || 0 }))}
                className="w-12 text-center bg-gray-800 border border-gray-600 rounded px-1 text-sm"
              />
            ) : (
              <span className="text-sm font-bold">
                {match.player1_score !== null ? match.player1_score : '-'}
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {getPlayerDisplay(match.player2_id, match.player2_username)}
            </span>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editScores.player2}
                onChange={(e) => setEditScores(prev => ({ ...prev, player2: parseInt(e.target.value) || 0 }))}
                className="w-12 text-center bg-gray-800 border border-gray-600 rounded px-1 text-sm"
              />
            ) : (
              <span className="text-sm font-bold">
                {match.player2_score !== null ? match.player2_score : '-'}
              </span>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSaveScore}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {isEditable && !isEditing && match.status !== 'completed' && (
          <button
            onClick={() => handleEditMatch(match)}
            className="w-full mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Update Score
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Tournament Bracket</h3>
      
      {matches.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-400">Tournament brackets will be generated when the tournament starts</p>
        </div>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-4">
          {sortedRounds.map(({ key, bracketType, round }) => (
            <div key={key} className="flex-shrink-0">
              <h4 className="text-lg font-semibold text-white mb-4 text-center">
                {getRoundTitle(round, bracketType)}
                {bracketType !== 'winners' && (
                  <span className="block text-sm text-gray-400 capitalize">
                    {bracketType} Bracket
                  </span>
                )}
              </h4>
              
              <div className="space-y-6">
                {matchesByRound[key]
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((match) => renderMatch(match))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
