import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  Award,
  Activity,
  Users,
  Gamepad2,
  Star,
  Calendar
} from 'lucide-react';
import type { PlayerStats, ArkanoidScore, PongGame } from '../../types';

interface AdvancedDashboardProps {
  playerStats: PlayerStats;
  pongHistory: PongGame[];
  arkanoidHistory: ArkanoidScore[];
  pongStats: any;
  arkanoidStats: any;
}

interface WeeklyStats {
  date: string;
  pongGames: number;
  arkanoidGames: number;
  totalXp: number;
  wins: number;
}

export default function AdvancedDashboard({ 
  playerStats, 
  pongHistory, 
  arkanoidHistory, 
  pongStats, 
  arkanoidStats 
}: AdvancedDashboardProps) {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // Calculate weekly statistics
  useEffect(() => {
    const calculateWeeklyStats = () => {
      const now = new Date();
      const weeks: WeeklyStats[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const pongGames = pongHistory.filter(game => 
          game.created_at.startsWith(dateStr)
        ).length;
        
        const arkanoidGames = arkanoidHistory.filter(game => 
          game.created_at.startsWith(dateStr)
        ).length;
        
        const totalXp = arkanoidHistory
          .filter(game => game.created_at.startsWith(dateStr))
          .reduce((sum, game) => sum + (game.xp || 0), 0);
        
        const wins = pongHistory.filter(game => 
          game.created_at.startsWith(dateStr) && game.winner === 'player'
        ).length;
        
        weeks.push({
          date: dateStr,
          pongGames,
          arkanoidGames,
          totalXp,
          wins
        });
      }
      
      setWeeklyStats(weeks);
    };

    calculateWeeklyStats();
  }, [pongHistory, arkanoidHistory]);

  const winRate = playerStats.totalGames > 0 ? Math.round((playerStats.wins / playerStats.totalGames) * 100) : 0;
  const totalGames = pongHistory.length + arkanoidHistory.length;
  const avgScore = arkanoidHistory.length > 0 
    ? Math.round(arkanoidHistory.reduce((sum, game) => sum + game.score, 0) / arkanoidHistory.length)
    : 0;
  const bestScore = Math.max(...arkanoidHistory.map(game => game.score), 0);
  const highestLevel = Math.max(...arkanoidHistory.map(game => game.level_reached), 1);

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-purple-400" />
          Dashboard Avancé
        </h1>
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {timeframe === 'week' ? '7 jours' : timeframe === 'month' ? '30 jours' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={<Trophy className="w-6 h-6" />}
          title="Victoires"
          value={playerStats.wins}
          color="text-green-400"
          bgColor="bg-green-900/30"
          borderColor="border-green-500/30"
        />
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          title="Taux de Victoire"
          value={`${winRate}%`}
          color="text-purple-400"
          bgColor="bg-purple-900/30"
          borderColor="border-purple-500/30"
        />
        <MetricCard
          icon={<Zap className="w-6 h-6" />}
          title="Série Actuelle"
          value={playerStats.winStreak}
          color="text-yellow-400"
          bgColor="bg-yellow-900/30"
          borderColor="border-yellow-500/30"
        />
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          title="Meilleure Série"
          value={playerStats.bestStreak}
          color="text-orange-400"
          bgColor="bg-orange-900/30"
          borderColor="border-orange-500/30"
        />
        <MetricCard
          icon={<Gamepad2 className="w-6 h-6" />}
          title="Parties Total"
          value={totalGames}
          color="text-cyan-400"
          bgColor="bg-cyan-900/30"
          borderColor="border-cyan-500/30"
        />
        <MetricCard
          icon={<Star className="w-6 h-6" />}
          title="Niveau"
          value={playerStats.level}
          color="text-pink-400"
          bgColor="bg-pink-900/30"
          borderColor="border-pink-500/30"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-400" />
            Activité Hebdomadaire
          </h3>
          <div className="space-y-4">
            {weeklyStats.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
              const maxGames = Math.max(...weeklyStats.map(d => d.pongGames + d.arkanoidGames));
              const totalGames = day.pongGames + day.arkanoidGames;
              const percentage = maxGames > 0 ? (totalGames / maxGames) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{dayName}</span>
                    <span className="text-sm text-gray-400">{totalGames} parties</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Pong: {day.pongGames}</span>
                    <span>Arkanoid: {day.arkanoidGames}</span>
                    <span>XP: +{day.totalXp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Performance */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Performance par Jeu
          </h3>
          <div className="space-y-4">
            {/* Pong Performance */}
            <div className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Pong</span>
                <span className="text-xs text-gray-400">{pongHistory.length} parties</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Victoires:</span>
                  <span className="ml-2 text-green-400 font-bold">
                    {pongStats?.wins || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Défaites:</span>
                  <span className="ml-2 text-red-400 font-bold">
                    {(pongStats?.total || 0) - (pongStats?.wins || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Arkanoid Performance */}
            <div className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Arkanoid</span>
                <span className="text-xs text-gray-400">{arkanoidHistory.length} parties</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Meilleur Score:</span>
                  <span className="ml-2 text-cyan-400 font-bold">{bestScore}</span>
                </div>
                <div>
                  <span className="text-gray-400">Niveau Max:</span>
                  <span className="ml-2 text-purple-400 font-bold">{highestLevel}</span>
                </div>
                <div>
                  <span className="text-gray-400">Score Moyen:</span>
                  <span className="ml-2 text-yellow-400 font-bold">{avgScore}</span>
                </div>
                <div>
                  <span className="text-gray-400">XP Total:</span>
                  <span className="ml-2 text-green-400 font-bold">
                    {arkanoidHistory.reduce((sum, game) => sum + (game.xp || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-purple-400" />
          Réalisations Récentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playerStats.winStreak >= 5 && (
            <AchievementCard
              title="Série de Victoires"
              description={`${playerStats.winStreak} victoires consécutives`}
              icon="🔥"
              color="text-orange-400"
            />
          )}
          {bestScore >= 1000 && (
            <AchievementCard
              title="Score Élevé"
              description={`Score de ${bestScore} en Arkanoid`}
              icon="🎯"
              color="text-cyan-400"
            />
          )}
          {highestLevel >= 5 && (
            <AchievementCard
              title="Niveau Avancé"
              description={`Niveau ${highestLevel} atteint`}
              icon="⭐"
              color="text-purple-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
}

function MetricCard({ icon, title, value, color, bgColor, borderColor }: MetricCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 text-center`}>
      <div className={`${color} mb-2 flex justify-center`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${color} mb-1`}>
        {value}
      </div>
      <div className="text-sm text-gray-300">
        {title}
      </div>
    </div>
  );
}

interface AchievementCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
}

function AchievementCard({ title, description, icon, color }: AchievementCardProps) {
  return (
    <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className={`font-semibold ${color}`}>{title}</div>
          <div className="text-sm text-gray-400">{description}</div>
        </div>
      </div>
    </div>
  );
}
