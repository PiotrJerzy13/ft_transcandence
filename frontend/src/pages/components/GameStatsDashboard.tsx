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
  Gamepad2,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import type { PlayerStats, ArkanoidScore, PongGame } from '../../types';

interface GameStatsDashboardProps {
  pongHistory: PongGame[];
  arkanoidHistory: ArkanoidScore[];
  pongStats: any;
  arkanoidStats: any;
}

interface GameSession {
  date: string;
  duration: number;
  score: number;
  xp: number;
  level?: number;
  mode?: string;
  winner?: string;
}

export default function GameStatsDashboard({ 
  pongHistory, 
  arkanoidHistory, 
  pongStats, 
  arkanoidStats 
}: GameStatsDashboardProps) {
  const [selectedGame, setSelectedGame] = useState<'pong' | 'arkanoid'>('pong');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);

  // Calculate game sessions based on selected game and timeframe
  useEffect(() => {
    const calculateSessions = () => {
      const now = new Date();
      const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365;
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      
      let sessions: GameSession[] = [];
      
      if (selectedGame === 'pong') {
        sessions = pongHistory
          .filter(game => new Date(game.created_at) >= cutoffDate)
          .map(game => ({
            date: game.created_at,
            duration: 0, // Pong games don't track duration yet
            score: game.score,
            xp: 0,
            mode: game.mode,
            winner: game.winner
          }));
      } else {
        sessions = arkanoidHistory
          .filter(game => new Date(game.created_at) >= cutoffDate)
          .map(game => ({
            date: game.created_at,
            duration: 0, // Arkanoid games don't track duration yet
            score: game.score,
            xp: game.xp || 0,
            level: game.level_reached
          }));
      }
      
      setGameSessions(sessions);
    };

    calculateSessions();
  }, [selectedGame, timeframe, pongHistory, arkanoidHistory]);

  // Calculate statistics
  const totalSessions = gameSessions.length;
  const avgScore = totalSessions > 0 
    ? Math.round(gameSessions.reduce((sum, session) => sum + session.score, 0) / totalSessions)
    : 0;
  const bestScore = Math.max(...gameSessions.map(session => session.score), 0);
  const totalXp = gameSessions.reduce((sum, session) => sum + session.xp, 0);
  
  // For Pong: calculate win rate
  const pongWins = gameSessions.filter(session => session.winner === 'player').length;
  const winRate = totalSessions > 0 ? Math.round((pongWins / totalSessions) * 100) : 0;
  
  // For Arkanoid: calculate highest level
  const highestLevel = Math.max(...gameSessions.map(session => session.level || 1), 1);

  // Calculate daily activity
  const dailyActivity = gameSessions.reduce((acc, session) => {
    const date = session.date.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentSessions = gameSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Game Selector and Timeframe */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2">
          {(['pong', 'arkanoid'] as const).map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGame === game
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {game === 'pong' ? 'Pong' : 'Arkanoid'}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', 'all'] as const).map((time) => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === time
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {time === '7d' ? '7j' : time === '30d' ? '30j' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Gamepad2 className="w-5 h-5" />}
          title="Parties"
          value={totalSessions}
          color="text-cyan-400"
          bgColor="bg-cyan-900/30"
          borderColor="border-cyan-500/30"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          title="Score Moyen"
          value={avgScore}
          color="text-green-400"
          bgColor="bg-green-900/30"
          borderColor="border-green-500/30"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          title="Meilleur Score"
          value={bestScore}
          color="text-yellow-400"
          bgColor="bg-yellow-900/30"
          borderColor="border-yellow-500/30"
        />
        {selectedGame === 'pong' ? (
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Taux de Victoire"
            value={`${winRate}%`}
            color="text-purple-400"
            bgColor="bg-purple-900/30"
            borderColor="border-purple-500/30"
          />
        ) : (
          <StatCard
            icon={<Star className="w-5 h-5" />}
            title="Niveau Max"
            value={highestLevel}
            color="text-pink-400"
            bgColor="bg-pink-900/30"
            borderColor="border-pink-500/30"
          />
        )}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-400" />
            Activité Quotidienne
          </h3>
          <div className="space-y-3">
            {Object.entries(dailyActivity)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-7)
              .map(([date, count]) => {
                const maxCount = Math.max(...Object.values(dailyActivity));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
                
                return (
                  <div key={date} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{dayName}</span>
                      <span className="text-sm text-gray-400">{count} parties</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Tendances de Performance
          </h3>
          <div className="space-y-4">
            {selectedGame === 'pong' ? (
              <>
                <TrendItem
                  label="Victoires"
                  current={pongWins}
                  previous={Math.max(0, pongWins - 2)}
                  icon={<Trophy className="w-4 h-4" />}
                />
                <TrendItem
                  label="Parties Total"
                  current={totalSessions}
                  previous={Math.max(0, totalSessions - 3)}
                  icon={<Gamepad2 className="w-4 h-4" />}
                />
              </>
            ) : (
              <>
                <TrendItem
                  label="Score Moyen"
                  current={avgScore}
                  previous={Math.max(0, avgScore - 50)}
                  icon={<Target className="w-4 h-4" />}
                />
                <TrendItem
                  label="XP Total"
                  current={totalXp}
                  previous={Math.max(0, totalXp - 100)}
                  icon={<Zap className="w-4 h-4" />}
                />
                <TrendItem
                  label="Niveau Max"
                  current={highestLevel}
                  previous={Math.max(1, highestLevel - 1)}
                  icon={<Star className="w-4 h-4" />}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-400" />
          Sessions Récentes
        </h3>
        <div className="space-y-2">
          {recentSessions.length > 0 ? (
            recentSessions.map((session, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-400">
                    {new Date(session.date).toLocaleDateString('fr-FR')}
                  </div>
                  {selectedGame === 'pong' && session.mode && (
                    <div className="text-xs text-gray-500">
                      {session.mode === 'one-player' ? 'Solo' : 'Multijoueur'}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-cyan-400">
                      Score: {session.score}
                    </div>
                    {session.xp > 0 && (
                      <div className="text-xs text-green-400">
                        +{session.xp} XP
                      </div>
                    )}
                    {session.level && (
                      <div className="text-xs text-purple-400">
                        Niveau {session.level}
                      </div>
                    )}
                    {session.winner && (
                      <div className={`text-xs ${
                        session.winner === 'player' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {session.winner === 'player' ? 'Victoire' : 'Défaite'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              Aucune session récente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
}

function StatCard({ icon, title, value, color, bgColor, borderColor }: StatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-300 mb-1">{title}</div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
        <div className={`${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface TrendItemProps {
  label: string;
  current: number;
  previous: number;
  icon: React.ReactNode;
}

function TrendItem({ label, current, previous, icon }: TrendItemProps) {
  const change = current - previous;
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className="bg-black/20 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400">{icon}</div>
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-white">{current}</span>
          {change !== 0 && (
            <div className={`flex items-center text-xs ${
              isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
            }`}>
              {isPositive ? <ArrowUp className="w-3 h-3" /> : 
               isNegative ? <ArrowDown className="w-3 h-3" /> : 
               <Minus className="w-3 h-3" />}
              {Math.abs(changePercent)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
