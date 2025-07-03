import { usePlayerStats } from '../hooks/usePlayerStats';
import { usePlayerAchievements } from '../hooks/usePlayerAchievements';
import { useGameHistory } from '../hooks/useGameHistory';
import type { ArkanoidScore, PongGame } from '../types';

// Import your new components
import PlayerHeader from './components/PlayerHeader';
import GameModeSelection from './components/GameModeSelection';
import GameHistorySection from './components/GameHistorySection';
import PlayerProfileSidebar from './components/PlayerProfileSidebar';
import LobbyActions from './components/LobbyActions'

export default function GameLobby() {
  // --- Data fetching stays here ---
  const { stats: playerStats, loading: statsLoading, error: statsError } = usePlayerStats();
  const { achievements, loading: achievementsLoading, error: achievementsError } = usePlayerAchievements();
  const { history: pongHistory, loading: pongLoading, error: pongError, stats: pongStats } = useGameHistory<PongGame>('pong');
  const { history: arkanoidHistory, loading: arkanoidLoading, error: arkanoidError, stats: arkanoidStats } = useGameHistory<ArkanoidScore>('arkanoid');

  const loading = statsLoading || achievementsLoading || pongLoading || arkanoidLoading;
  const error = statsError || achievementsError || pongError || arkanoidError;

  // --- Handlers stay here ---
  const handleGameModeSelect = (mode: 'pong' | 'arkanoid') => {
    window.location.href = mode === 'pong' ? '/game' : '/game2';
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) window.location.href = '/login';
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
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md">
          <h2 className="text-red-400 text-xl mb-4">Failed to Load Profile</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!playerStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-8 max-w-md">
          <h2 className="text-yellow-400 text-xl mb-4">No Profile Data</h2>
          <p className="text-gray-300 mb-4">Unable to load your player profile. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

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