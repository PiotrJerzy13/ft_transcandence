interface LobbyActionsProps {
    onLogout: () => void;
}

export default function LobbyActions({ onLogout }: LobbyActionsProps) {
  return (
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
        onClick={onLogout}
        className="px-6 py-3 bg-red-900/50 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-900/70 transition-all duration-300"
      >
        Logout
      </button>
    </div>
  );
}
