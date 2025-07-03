//This component will contain the two cards for selecting Pong or Arkanoid.
import { Users, Target } from 'lucide-react';

interface GameModeSelectionProps {
  onSelectGame: (mode: 'pong' | 'arkanoid') => void;
}

export default function GameModeSelection({ onSelectGame }: GameModeSelectionProps) {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Target className="w-6 h-6 mr-2 text-purple-400" />
        Select Game Mode
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pong Mode */}
        <div 
          className="group bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-cyan-500/30 rounded-xl p-6 cursor-pointer hover:border-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
          onClick={() => onSelectGame('pong')}
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
          onClick={() => onSelectGame('arkanoid')}
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
  );
}