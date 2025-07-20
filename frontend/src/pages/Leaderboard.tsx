import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface LeaderboardPlayer {
  id: number;
  username: string;
  level: number;
  rank: string;
  totalGames: number;
  wins: number;
  losses: number;
  xp: number;
  bestStreak: number; // Changed from best_streak to bestStreak
  winRate: number;    // Changed from win_rate to winRate
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const handleBackToLobby = () => navigate("/lobby");
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/leaderboard', {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        } else {
          setError(data.error || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white">
        <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white">
        <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8 text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">🏆 Leaderboard</h1>

      {leaderboard.length > 0 ? (
        <div className="bg-black/50 rounded-xl p-6 mt-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Top Players</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="text-left border-b border-gray-500">
                <tr>
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Player</th>
                  <th className="py-2 px-2">Level</th>
                  <th className="py-2 px-2">Rank</th>
                  <th className="py-2 px-2">XP</th>
                  <th className="py-2 px-2">Win Rate</th>
                  <th className="py-2 px-2">Best Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, idx) => (
                  <tr key={player.id} className="border-b border-gray-700">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2 text-cyan-300 font-mono">{player.username}</td>
                    <td className="py-2 px-2">{player.level}</td>
                    <td className="py-2 px-2">{player.rank}</td>
                    <td className="py-2 px-2">{player.xp}</td>
                    <td className="py-2 px-2">{typeof player.winRate === 'number' ? player.winRate.toFixed(1) : '0.0'}%</td>
                    <td className="py-2 px-2">{player.bestStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 mt-4">No leaderboard data available.</p>
      )}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleBackToLobby}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-mono"
        >
          ← BACK TO LOBBY
        </button>
      </div>
    </div>
  );
}