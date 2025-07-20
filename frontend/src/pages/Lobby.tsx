import { useGameHistory } from '../hooks/useGameHistory';
import type { ArkanoidScore, PongGame } from '../types';
import { usePlayerData } from '../context/PlayerDataContext';

// Import your new components
import PlayerHeader from './components/PlayerHeader';
import GameModeSelection from './components/GameModeSelection';
import GameHistorySection from './components/GameHistorySection';
import PlayerProfileSidebar from './components/PlayerProfileSidebar';
import LobbyActions from './components/LobbyActions';
import { useNavigate } from 'react-router-dom';

export default function GameLobby() {
  const navigate = useNavigate();

  // --- Data fetching is now simpler ---
  const { playerData, loading: profileLoading, error: profileError } = usePlayerData();
  const { history: pongHistory, loading: pongLoading, error: pongError, stats: pongStats } = useGameHistory<PongGame>('pong');
  const { history: arkanoidHistory, loading: arkanoidLoading, error: arkanoidError, stats: arkanoidStats } = useGameHistory<ArkanoidScore>('arkanoid');

  const loading = profileLoading || pongLoading || arkanoidLoading;
  const error = profileError || pongError || arkanoidError;

  // --- Handlers stay here ---
  const handleGameModeSelect = (mode: 'pong' | 'arkanoid') => {
    navigate(mode === 'pong' ? '/game' : '/game2');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) navigate('/login', { replace: true });
      else alert('Logout failed');
    } catch (err) {
      console.error('Logout error:', err);
      alert('Logout error');
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Novice': 'text-gray-400', 'Amateur': 'text-green-400', 'Pro': 'text-blue-400',
      'Elite': 'text-purple-400', 'Master': 'text-yellow-400', 'Legend': 'text-red-400'
    };
    return colors[rank] || 'text-gray-400';
  };

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading player data...</div>
      </div>
    );
  }
  if (error || !playerData) { // Check for playerData as well
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-red-400 text-xl mb-4">Failed to Load Profile</h2>
          <p className="text-gray-300 mb-4">{error || "Could not retrieve player data. Please try logging in again."}</p>
          <button 
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const { stats: playerStats, achievements } = playerData;
  if (!playerStats) return null; // Should be handled by the error block above, but good for type safety

  const rankColor = getRankColor(playerStats.rank);

  // --- The clean, composed layout ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <PlayerHeader stats={playerStats} rankColor={rankColor} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GameModeSelection onSelectGame={handleGameModeSelect} />
            <GameHistorySection 
                playerStats={playerStats}
                pongHistory={pongHistory}
                pongStats={pongStats}
                arkanoidHistory={arkanoidHistory}
                arkanoidStats={arkanoidStats}
            />
          </div>

          <PlayerProfileSidebar
            playerStats={playerStats}
            achievements={achievements}
            rankColor={rankColor}
          />
        </div>

        <LobbyActions onLogout={handleLogout} />
      </div>
    </div>
  );
}