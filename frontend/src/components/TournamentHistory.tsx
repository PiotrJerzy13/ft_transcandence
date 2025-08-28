import React from 'react';

interface TournamentHistoryProps {
  tournaments: Array<{
    id: number;
    name: string;
    status: string;
    participants: number;
    start_date: string;
    created_by?: number;
  }>;
  onViewTournament: (id: number) => void;
}

export default function TournamentHistory({ tournaments, onViewTournament }: TournamentHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'active':
        return 'text-blue-400 bg-blue-400/10';
      case 'archived':
        return 'text-orange-400 bg-orange-400/10';
      case 'expired':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'In Progress';
      case 'archived':
        return 'Archived';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const completedTournaments = tournaments.filter(t => t.status === 'completed');
  const otherTournaments = tournaments.filter(t => t.status !== 'completed');

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-6">Tournament History</h3>
      
      {tournaments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📜</div>
          <p className="text-gray-400">No tournament history yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">🏆 Completed Tournaments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-green-500/50 transition-colors cursor-pointer"
                    onClick={() => onViewTournament(tournament.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-white font-semibold truncate">{tournament.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Participants:</span>
                        <span className="text-white">{tournament.participants}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Date:</span>
                        <span className="text-white">
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-center text-green-400 text-sm font-medium">
                        🏆 Winner determined
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Tournaments */}
          {otherTournaments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">📋 Other Tournaments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition-colors cursor-pointer"
                    onClick={() => onViewTournament(tournament.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-white font-semibold truncate">{tournament.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Participants:</span>
                        <span className="text-white">{tournament.participants}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Date:</span>
                        <span className="text-white">
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-center text-purple-400 text-sm font-medium">
                        👁️ View details
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
