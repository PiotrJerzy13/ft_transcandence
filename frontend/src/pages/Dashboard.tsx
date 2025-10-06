import React, { useState } from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useGameHistory } from '../hooks/useGameHistory';
import { usePlayerData } from '../context/PlayerDataContext';
import AdvancedDashboard from './components/AdvancedDashboard';
import GameStatsDashboard from './components/GameStatsDashboard';
import GameHistorySection from './components/GameHistorySection';
import { 
  BarChart3, 
  Gamepad2, 
  Trophy, 
  TrendingUp,
  Settings,
  User
} from 'lucide-react';
import type { ArkanoidScore, PongGame } from '../types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'history'>('overview');
  const { stats: playerStats, loading: statsLoading, error: statsError } = usePlayerStats();
  const { playerData, loading: playerLoading } = usePlayerData();
  
  const { 
    history: pongHistory, 
    loading: pongLoading, 
    error: pongError 
  } = useGameHistory<PongGame>('pong');
  
  const { 
    history: arkanoidHistory, 
    loading: arkanoidLoading, 
    error: arkanoidError 
  } = useGameHistory<ArkanoidScore>('arkanoid');

  // Calculate game statistics
  const pongStats = {
    total: pongHistory.length,
    wins: pongHistory.filter(game => game.winner === 'player').length,
    losses: pongHistory.filter(game => game.winner === 'opponent').length
  };

  const arkanoidStats = {
    highScore: Math.max(...arkanoidHistory.map(game => game.score), 0),
    highestLevel: Math.max(...arkanoidHistory.map(game => game.level_reached), 1),
    totalGames: arkanoidHistory.length,
    totalXp: arkanoidHistory.reduce((sum, game) => sum + (game.xp || 0), 0)
  };

  if (statsLoading || playerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || !playerStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erreur lors du chargement des statistiques</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Dashboard
              </h1>
              <p className="text-gray-300">
                Bienvenue, {playerData?.username || 'Joueur'} ! Voici vos statistiques de jeu.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Niveau</div>
                <div className="text-2xl font-bold text-purple-400">{playerStats.level}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">XP</div>
                <div className="text-2xl font-bold text-cyan-400">{playerStats.xp}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'games', label: 'Statistiques', icon: Gamepad2 },
              { id: 'history', label: 'Historique', icon: Trophy }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-black/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <AdvancedDashboard
              playerStats={playerStats}
              pongHistory={pongHistory}
              arkanoidHistory={arkanoidHistory}
              pongStats={pongStats}
              arkanoidStats={arkanoidStats}
            />
          )}

          {activeTab === 'games' && (
            <GameStatsDashboard
              pongHistory={pongHistory}
              arkanoidHistory={arkanoidHistory}
              pongStats={pongStats}
              arkanoidStats={arkanoidStats}
            />
          )}

          {activeTab === 'history' && (
            <GameHistorySection
              playerStats={playerStats}
              pongHistory={pongHistory}
              pongStats={pongStats}
              arkanoidHistory={arkanoidHistory}
              arkanoidStats={arkanoidStats}
            />
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 bg-black/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Résumé Rapide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{playerStats.wins}</div>
              <div className="text-sm text-gray-400">Victoires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{playerStats.losses}</div>
              <div className="text-sm text-gray-400">Défaites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {playerStats.totalGames > 0 ? Math.round((playerStats.wins / playerStats.totalGames) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-400">Taux de Victoire</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{playerStats.winStreak}</div>
              <div className="text-sm text-gray-400">Série Actuelle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
