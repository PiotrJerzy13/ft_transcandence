import React from 'react';
import { useNavigate } from 'react-router-dom';

console.log('🔍 MultiplayerGame component: Starting to load...');

export default function MultiplayerGame() {
  console.log('🔍 MultiplayerGame: Component function called');
  
  try {
    const navigate = useNavigate();
    console.log('🔍 MultiplayerGame: useNavigate hook successful');

    console.log('🔍 MultiplayerGame: About to render JSX');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Multiplayer Pong</h1>
        <div className="text-white mb-4">Debug Mode - Component Loaded!</div>
        <div className="text-green-400 mb-4">✅ React is working!</div>
        <div className="text-blue-400 mb-4">✅ JSX is working!</div>
        <div className="text-yellow-400 mb-4">✅ Component rendered!</div>
        <button
          onClick={() => {
            console.log('🔍 MultiplayerGame: Button clicked!');
            navigate('/lobby');
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    );
  } catch (error) {
    console.error('❌ MultiplayerGame: Error in component:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-900 p-4">
        <h1 className="text-3xl font-bold text-white mb-4">❌ Error Loading Component</h1>
        <div className="text-red-400 mb-4">Error: {error instanceof Error ? error.message : String(error)}</div>
        <div className="text-white mb-4">Check console for details</div>
      </div>
    );
  }
}
