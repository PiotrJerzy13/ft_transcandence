import { BarChart3, Trophy } from 'lucide-react';
import type { PlayerStats, ArkanoidScore, PongGame } from '../../types';

// Helper Type Guards
function isPongStats(stats: any): stats is { wins?: number; total?: number } {
  return 'wins' in stats || 'total' in stats;
}
function isArkanoidStats(stats: any): stats is { highScore?: number; highestLevel?: number } {
  return 'highScore' in stats || 'highestLevel' in stats;
}

interface GameHistorySectionProps {
  playerStats: PlayerStats;
  pongHistory: PongGame[];
  pongStats: any;
  arkanoidHistory: ArkanoidScore[];
  arkanoidStats: any;
}

export default function GameHistorySection({ playerStats, pongHistory, pongStats, arkanoidHistory, arkanoidStats }: GameHistorySectionProps) {
  const winRate = playerStats.totalGames > 0 ? Math.round((playerStats.wins / playerStats.totalGames) * 100) : 0;

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
        Performance Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{playerStats.wins}</div>
          <div className="text-sm text-gray-300">Wins</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{playerStats.losses}</div>
          <div className="text-sm text-gray-300">Losses</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{winRate}%</div>
          <div className="text-sm text-gray-300">Win Rate</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{playerStats.winStreak}</div>
          <div className="text-sm text-gray-300">Win Streak</div>
        </div>
      </div>
      
      {/* Game Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6 md:mt-8">
        {/* Arkanoid Stats Table */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-purple-400" />
            Arkanoid Stats
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400">High Score</div>
              <div className="text-2xl font-bold text-cyan-400">{isArkanoidStats(arkanoidStats) ? arkanoidStats.highScore || 0 : 0}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400">Highest Level</div>
              <div className="text-2xl font-bold text-purple-400">{isArkanoidStats(arkanoidStats) ? arkanoidStats.highestLevel || 1 : 1}</div>
            </div>
          </div>
          {arkanoidHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Scores</h4>
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-900/20">
                        <th className="px-4 py-2 text-left text-gray-300">Date</th>
                        <th className="px-4 py-2 text-right text-gray-300">Score</th>
                        <th className="px-4 py-2 text-right text-gray-300">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arkanoidHistory.slice(0, 5).map((score, index) => (
                        <tr key={index} className="border-t border-purple-500/10">
                          <td className="px-4 py-2 text-gray-400">
                            {new Date(score.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right text-cyan-400">{score.score}</td>
                          <td className="px-4 py-2 text-right text-purple-400">{score.level_reached}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Pong Stats Table */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-purple-400" />
            Pong Stats
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Games</div>
              <div className="text-2xl font-bold text-cyan-400">{isPongStats(pongStats) ? pongStats.total || 0 : 0}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-400">Wins</div>
              <div className="text-2xl font-bold text-purple-400">{isPongStats(pongStats) ? pongStats.wins || 0 : 0}</div>
            </div>
          </div>
          {pongHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Games</h4>
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-900/20">
                        <th className="px-4 py-2 text-left text-gray-300">Date</th>
                        <th className="px-4 py-2 text-left text-gray-300">Mode</th>
                        <th className="px-4 py-2 text-right text-gray-300">Score</th>
                        <th className="px-4 py-2 text-right text-gray-300">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pongHistory.slice(0, 5).map((game, index) => (
                        <tr key={index} className="border-t border-purple-500/10">
                          <td className="px-4 py-2 text-gray-400">
                            {new Date(game.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-gray-400">
                            {game.mode === 'one-player' ? 'Single Player' : 'Two Player'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            <span className="text-cyan-400">{game.left_score}</span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="text-amber-400">{game.right_score}</span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className={`font-mono ${
                              game.winner.includes('You') || game.winner.includes('Player 1')
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }`}>
                              {game.winner}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}