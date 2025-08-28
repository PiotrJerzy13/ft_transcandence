import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleToasts } from '../context/SimpleToastContext';
import { API_ENDPOINTS } from '../config/api';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'completed';
  participants: number;
  start_date?: string;
  created_by?: number;
}

interface CreateTournamentForm {
  name: string;
  description: string;
  startDate: string;
  maxParticipants: number;
}

export default function Tournaments() {
  const navigate = useNavigate();
  const { addToast } = useSimpleToasts();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTournamentForm>({
    name: '',
    description: '',
    startDate: '',
    maxParticipants: 16
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      console.log('🔍 Fetching tournaments from:', API_ENDPOINTS.TOURNAMENTS);
      const response = await fetch(API_ENDPOINTS.TOURNAMENTS, {
        credentials: 'include'
      });
      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Tournament data received:', data);
        setTournaments(data.tournaments);
      } else {
        console.error('❌ Failed to load tournaments, status:', response.status);
        addToast('Failed to load tournaments', 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching tournaments:', error);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

    const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    // Fix date format to ISO string
    const tournamentData = {
      ...createForm,
      startDate: new Date(createForm.startDate).toISOString()
    };

    console.log('🎯 Creating tournament with data:', tournamentData);

    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tournamentData)
      });
      
      console.log('📡 Create tournament response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        addToast('Tournament created successfully!', 'success');
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          description: '',
          startDate: '',
          maxParticipants: 16
        });
        fetchTournaments(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.log('Create tournament error:', errorData);
        
        // Show specific error messages
        let errorMessage = 'Failed to create tournament';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      addToast('Failed to create tournament', 'error');
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.JOIN_TOURNAMENT(tournamentId), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        addToast('Successfully joined tournament!', 'success');
        fetchTournaments(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.log('Join tournament error:', errorData);
        
        // Show specific error messages
        let errorMessage = 'Failed to join tournament';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      addToast('Failed to join tournament', 'error');
    }
  };

  const handleViewTournament = (tournamentId: number) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Registration Open';
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              🏆 Tournaments
            </h1>
            <p className="text-gray-300">
              Compete with other players in exciting tournaments
            </p>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/lobby')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Lobby
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Tournament
            </button>
          </div>
        </div>

        {/* Create Tournament Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Create Tournament</h2>
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Tournament Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full p-2 bg-slate-700 text-white rounded border border-gray-600"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="w-full p-2 bg-slate-700 text-white rounded border border-gray-600"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({...createForm, startDate: e.target.value})}
                    className="w-full p-2 bg-slate-700 text-white rounded border border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Max Participants</label>
                  <select
                    value={createForm.maxParticipants}
                    onChange={(e) => setCreateForm({...createForm, maxParticipants: parseInt(e.target.value)})}
                    className="w-full p-2 bg-slate-700 text-white rounded border border-gray-600"
                  >
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                    <option value={32}>32 Players</option>
                    <option value={64}>64 Players</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tournaments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                  {getStatusText(tournament.status)}
                </span>
              </div>
              
              {tournament.description && (
                <p className="text-gray-300 mb-4 text-sm">
                  {tournament.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">
                  👥 {tournament.participants} participants
                </span>
                {tournament.start_date && (
                  <span className="text-gray-400 text-sm">
                    📅 {new Date(tournament.start_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewTournament(tournament.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                {tournament.status === 'pending' && (
                  <button
                    onClick={() => handleJoinTournament(tournament.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">No tournaments yet</h3>
            <p className="text-gray-400 mb-6">
              Be the first to create a tournament and start competing!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create First Tournament
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
