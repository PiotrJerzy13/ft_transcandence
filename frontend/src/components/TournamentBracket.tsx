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

interface TournamentBracketProps {
  matches: Match[];
  participants: Array<{ id: number; username: string }>;
}

export default function TournamentBracket({ matches, participants }: TournamentBracketProps) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Sort rounds and matches within each round
  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getPlayerDisplay = (playerId: number | null, playerUsername?: string) => {
    if (playerId === null) return 'TBD';
    if (playerUsername) return playerUsername;
    return `Player ${playerId}`;
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

  const getScoreDisplay = (match: Match) => {
    if (match.player1_score === null || match.player2_score === null) {
      return 'vs';
    }
    return `${match.player1_score} - ${match.player2_score}`;
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
        <div className="flex gap-8 overflow-x-auto">
          {sortedRounds.map((round) => (
            <div key={round} className="flex-shrink-0">
              <h4 className="text-lg font-semibold text-white mb-4 text-center">
                {round === 1 ? 'First Round' : 
                 round === 2 ? 'Quarter Finals' :
                 round === 3 ? 'Semi Finals' :
                 round === 4 ? 'Finals' : `Round ${round}`}
              </h4>
              
              <div className="space-y-4">
                {matchesByRound[round]
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((match) => (
                    <div
                      key={match.id}
                      className={`border-2 rounded-lg p-3 min-w-[200px] ${getMatchStatusColor(match.status)}`}
                    >
                                             <div className="text-xs text-gray-400 mb-2">
                         Match {match.match_number}
                       </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {getPlayerDisplay(match.player1_id, match.player1_username)}
                          </span>
                          {match.player1_score !== null && (
                            <span className="text-sm font-bold">
                              {match.player1_score}
                            </span>
                          )}
                        </div>
                        
                                                 <div className="text-center text-xs text-gray-400 font-medium">
                           {getScoreDisplay(match)}
                         </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {getPlayerDisplay(match.player2_id, match.player2_username)}
                          </span>
                          {match.player2_score !== null && (
                            <span className="text-sm font-bold">
                              {match.player2_score}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' :
                          match.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {match.status === 'completed' ? 'Finished' :
                           match.status === 'ongoing' ? 'In Progress' :
                           'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
