//This component will display the "CYBER PONG ARENA" title and 
// the user's summary on the right.

import { User } from 'lucide-react';
import type { PlayerStats } from '../../types';

interface PlayerHeaderProps {
  stats: PlayerStats;
  rankColor: string;
}

export default function PlayerHeader({ stats, rankColor }: PlayerHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-wider mb-2">
          CYBER PONG ARENA
        </h1>
        <p className="text-gray-300">Choose your battle, champion</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-white font-mono text-lg">Player</p>
          <p className={`text-sm font-bold ${rankColor}`}>
            {stats.rank} • Level {stats.level}
          </p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}