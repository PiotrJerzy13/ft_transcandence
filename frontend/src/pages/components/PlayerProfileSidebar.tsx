import { useState } from 'react';
import { TrendingUp, BarChart3, Award, Trophy, Zap, Target, Star, Crown, Clock, Shield } from 'lucide-react';
import type { PlayerStats, Achievement } from '../../types';
import TwoFactorSettings from '../../components/TwoFactorSettings';

// Icon mapping for achievements
const iconMap: Record<string, React.ComponentType<any>> = {
  Trophy,
  Zap,
  Target,
  Star,
  Crown,
  Clock
};

interface PlayerProfileSidebarProps {
  playerStats: PlayerStats;
  achievements: Achievement[];
  rankColor: string;
}

export default function PlayerProfileSidebar({ playerStats, achievements, rankColor }: PlayerProfileSidebarProps) {
  const [showStats, setShowStats] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const progressPercent = playerStats.xp > 0 ? ((playerStats.xp % 1000) / 1000) * 100 : 0;

  return (
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
              <span className={`font-mono font-bold ${rankColor}`}>{playerStats.rank}</span>
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

      {/* Security Settings */}
      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
        <button 
          onClick={() => setShowSecurity(!showSecurity)}
          className="w-full flex justify-between items-center mb-4"
        >
          <h3 className="text-lg font-bold text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-400" />
            Security Settings
          </h3>
          <div className={`transform transition-transform ${showSecurity ? 'rotate-180' : ''}`}> 
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
        </button>
        {showSecurity && (
          <TwoFactorSettings />
        )}
      </div>
    </div>
  );
}
