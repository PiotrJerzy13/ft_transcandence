import { useState, useEffect } from "react";
import { User, Trophy, Target, Zap, Crown, Star, Users, BarChart3, Award, Clock, TrendingUp } from "lucide-react";

// Type definition for Arkanoid score history entries
type ArkanoidScore = {
  score: number;
  level_reached: number;
  created_at: string;
};

// Type definition for Pong game history entries
type PongGame = {
  created_at: string;
  mode: string;
  left_score: number;
  right_score: number;
  winner: string;
};

// Type definition for player stats
type PlayerStats = {
  level: number;
  xp: number;
  xpToNext: number;
  rank: string;
  wins: number;
  losses: number;
  totalGames: number;
  winStreak: number;
  bestStreak: number;
  totalPlayTime: string;
};

// Type definition for achievements
type Achievement = {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  date?: string;
};

// Icon mapping for achievements
const iconMap: Record<string, React.ComponentType<any>> = {
  Trophy,
  Zap,
  Target,
  Star,
  Crown,
  Clock
};

// Default achievements structure
const defaultAchievements: Achievement[] = [
  {
    id: 1,
    name: "First Victory",
    description: "Win your first game",
    icon: "Trophy",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 2,
    name: "Speed Demon",
    description: "Win a game in under 60 seconds",
    icon: "Zap",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 3,
    name: "Sharpshooter",
    description: "Score 10 consecutive hits",
    icon: "Target",
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 4,
    name: "Rising Star",
    description: "Reach Pro rank",
    icon: "Star",
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 5,
    name: "Unstoppable",
    description: "Win 10 games in a row",
    icon: "Crown",
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 6,
    name: "Marathon Player",
    description: "Play for 2 hours straight",
    icon: "Clock",
    unlocked: false,
    progress: 0,
    maxProgress: 120
  }
];

export default function GameLobby() {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arkanoidStats, setArkanoidStats] = useState({
    highScore: 0,
    highestLevel: 1,
    recentScores: [] as ArkanoidScore[]
  });
  const [pongStats, setPongStats] = useState({
    totalGames: 0,
    wins: 0,
    recentGames: [] as PongGame[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 [DEBUG] Starting API fetch...');
        
        // Fetch user profile and stats
        const profileResponse = await fetch('/api/user/profile', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // Fetch Arkanoid history
        const arkanoidResponse = await fetch('/api/arkanoid/history', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // Fetch Pong history
        const pongResponse = await fetch('/api/pong/history', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!profileResponse.ok) {
          throw new Error(`HTTP error! status: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        console.log('🔍 [DEBUG] Raw profile data:', profileData);

        // Process Arkanoid stats if available
        if (arkanoidResponse.ok) {
          const arkanoidData = await arkanoidResponse.json();
          console.log('🔍 [DEBUG] Arkanoid history:', arkanoidData);
          
          if (arkanoidData.history && arkanoidData.history.length > 0) {
			const highScore = Math.max(...arkanoidData.history.map((score: ArkanoidScore) => score.score));
			const highestLevel = Math.max(...arkanoidData.history.map((score: ArkanoidScore) => score.level_reached));
            const recentScores = arkanoidData.history.slice(0, 5); // Get last 5 scores
            
            setArkanoidStats({
              highScore,
              highestLevel,
              recentScores
            });
          }
        }

        // Process Pong stats if available
        if (pongResponse.ok) {
          const pongData = await pongResponse.json();
          console.log('🔍 [DEBUG] Pong history:', pongData);
          
          if (pongData.history && pongData.history.length > 0) {
			const wins = pongData.history.filter((game: PongGame) => 
			  game.winner.includes('You') || game.winner.includes('Player 1')
			).length;
            
            setPongStats({
              totalGames: pongData.history.length,
              wins,
              recentGames: pongData.history.slice(0, 5) // Get last 5 games
            });
          }
        }

        // Handle the profile response structure
        let stats, achievementsData;
        
        if (profileData.stats) {
          stats = profileData.stats;
          achievementsData = profileData.achievements || defaultAchievements;
        } else {
          stats = profileData;
          achievementsData = defaultAchievements;
        }

        // Transform backend data to frontend format
        const transformedStats = {
          level: stats.level || 1,
          xp: stats.xp || 0,
          xpToNext: stats.xp ? (1000 - (stats.xp % 1000)) : 1000,
          rank: stats.rank || "Novice",
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          totalGames: stats.total_games || 0,
          winStreak: stats.win_streak || 0,
          bestStreak: stats.best_streak || 0,
          totalPlayTime: stats.total_play_time || "0h 0m"
        };

        setPlayerStats(transformedStats);
        setAchievements(achievementsData);
        
      } catch (err) {
        console.error('❌ Error loading profile:', err);
        console.error('❌ Error details:', (err as any)?.message);
        setError((err as any)?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

interface GameMode {
	mode: 'pong' | 'arkanoid';
}

const handleGameModeSelect = (mode: GameMode['mode']): void => {
	if (mode === 'pong') {
		// Replace with your actual navigation logic
		window.location.href = '/game';
	} else if (mode === 'arkanoid') {
		window.location.href = '/game2';
	}
};

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        window.location.href = '/login';
      } else {
        alert('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      alert('Logout error');
    }
  };

//   type Rank = 'Novice' | 'Amateur' | 'Pro' | 'Elite' | 'Master' | 'Legend';
  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Novice': 'text-gray-400',
      'Amateur': 'text-green-400',
      'Pro': 'text-blue-400',
      'Elite': 'text-purple-400',
      'Master': 'text-yellow-400',
      'Legend': 'text-red-400'
    };
    return colors[rank] || 'text-gray-400';
  };

  if (loading) {
    console.log('🔍 [DEBUG] Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading player data...</div>
      </div>
    );
  }

  if (error) {
    console.log('🔍 [DEBUG] Rendering error state:', error);
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
    console.log('🔍 [DEBUG] Rendering no data state');
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

  console.log('🔍 [DEBUG] Rendering main lobby with playerStats:', playerStats);

  const winRate = playerStats.totalGames > 0 ? Math.round((playerStats.wins / playerStats.totalGames) * 100) : 0;
  const progressPercent = playerStats.xp > 0 ? 
    ((playerStats.xp % 1000) / 1000) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white font-mono tracking-wider mb-2">
              CYBER PONG ARENA
            </h1>
            <p className="text-gray-300">Choose your battle, champion</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white font-mono text-lg">Player</p>
              <p className={`text-sm font-bold ${getRankColor(playerStats.rank)}`}>
                {playerStats.rank} • Level {playerStats.level}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Game Mode Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-purple-400" />
                Select Game Mode
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pong Mode */}
                <div 
                  className="group bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-cyan-500/30 rounded-xl p-6 cursor-pointer hover:border-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                  onClick={() => handleGameModeSelect('pong')}
                >
                  <div className="flex items-center mb-4">
                    <Users className="w-8 h-8 text-cyan-400 mr-3" />
                    <h3 className="text-xl font-bold text-white">Cyber Pong</h3>
                  </div>
                  <p className="text-gray-300 mb-4">Play the classic Pong in futuristic style. Local multiplayer or vs AI!</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-400 font-mono">PONG</span>
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400 group-hover:bg-cyan-400 transition-colors"></div>
                  </div>
                </div>

                {/* Arkanoid Mode */}
                <div 
                  className="group bg-gradient-to-br from-indigo-900/50 to-pink-900/50 border border-indigo-500/30 rounded-xl p-6 cursor-pointer hover:border-indigo-400 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
                  onClick={() => handleGameModeSelect('arkanoid')}
                >
                  <div className="flex items-center mb-4">
                    <Target className="w-8 h-8 text-indigo-400 mr-3" />
                    <h3 className="text-xl font-bold text-white">Cyber Arkanoid</h3>
                  </div>
                  <p className="text-gray-300 mb-4">Break blocks, level up, and survive in this retro-style challenge!</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-400 font-mono">ARKANOID</span>
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-400 group-hover:bg-indigo-400 transition-colors"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Arkanoid Stats */}
                <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-purple-400" />
                    Arkanoid Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-gray-400">High Score</div>
                      <div className="text-2xl font-bold text-cyan-400">{arkanoidStats.highScore}</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Highest Level</div>
                      <div className="text-2xl font-bold text-purple-400">{arkanoidStats.highestLevel}</div>
                    </div>
                  </div>
                  {arkanoidStats.recentScores.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Scores</h4>
                      <div className="bg-black/20 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-purple-900/20">
                              <th className="px-4 py-2 text-left text-gray-300">Date</th>
                              <th className="px-4 py-2 text-right text-gray-300">Score</th>
                              <th className="px-4 py-2 text-right text-gray-300">Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {arkanoidStats.recentScores.map((score, index) => (
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
                  )}
                </div>

                {/* Pong Stats */}
                <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-purple-400" />
                    Pong Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Total Games</div>
                      <div className="text-2xl font-bold text-cyan-400">{pongStats.totalGames}</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Wins</div>
                      <div className="text-2xl font-bold text-purple-400">{pongStats.wins}</div>
                    </div>
                  </div>
                  {pongStats.recentGames.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Games</h4>
                      <div className="bg-black/20 rounded-lg overflow-hidden">
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
                            {pongStats.recentGames.map((game, index) => (
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
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player Stats & Achievements Sidebar */}
          <div className="space-y-6">
            
            {/* Player Level Progress */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                Level Progress
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Level {playerStats.level}</span>
                  <span className="text-gray-300">{playerStats.xp % 1000}/{1000} XP</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">{playerStats.xpToNext} XP to Level {playerStats.level + 1}</p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <button 
                onClick={() => setShowStats(!showStats)}
                className="w-full flex justify-between items-center mb-4"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                  Detailed Stats
                </h3>
                <div className={`transform transition-transform ${showStats ? 'rotate-180' : ''}`}>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              
              {showStats && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Games:</span>
                    <span className="text-white font-mono">{playerStats.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Best Streak:</span>
                    <span className="text-yellow-400 font-mono">{playerStats.bestStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Play Time:</span>
                    <span className="text-blue-400 font-mono">{playerStats.totalPlayTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Rank:</span>
                    <span className={`font-mono font-bold ${getRankColor(playerStats.rank)}`}>{playerStats.rank}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                Achievements
              </h3>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {achievements.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon] || Trophy;
                  return (
                    <div 
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all ${
                        achievement.unlocked 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-gray-900/20 border-gray-600/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent 
                          className={`w-5 h-5 mt-0.5 ${
                            achievement.unlocked ? 'text-green-400' : 'text-gray-500'
                          }`} 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm ${
                            achievement.unlocked ? 'text-white' : 'text-gray-400'
                          }`}>
                            {achievement.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {achievement.description}
                          </p>
                          {achievement.unlocked && achievement.date && (
                            <p className="text-xs text-green-400 mt-1">
                              Unlocked: {new Date(achievement.date).toLocaleDateString()}
                            </p>
                          )}
                          {!achievement.unlocked && achievement.progress !== undefined && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div 
                                  className="bg-purple-500 h-1 rounded-full"
                                  style={{ width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Progress: {achievement.progress}/{achievement.maxProgress}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center space-x-4">
		<button 
		onClick={() => window.location.href = '/leaderboard'}


		className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
		>
		View Leaderboard
		</button>
          <button 
            onClick={() => alert('Settings feature coming soon!')}
            className="px-6 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300"
          >
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-red-900/50 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-900/70 transition-all duration-300"
          >
            Logout
          </button>
        </div>

        {/* Debug Info - Remove this in production
        <div className="mt-8 bg-black/60 border border-gray-600 rounded-lg p-4">
          <h4 className="text-white font-bold mb-2">Debug Info:</h4>
          <pre className="text-xs text-gray-300 overflow-auto">
            {JSON.stringify({ playerStats, error, loading }, null, 2)}
          </pre>
        </div> */}

      </div>
    </div>
  );
}