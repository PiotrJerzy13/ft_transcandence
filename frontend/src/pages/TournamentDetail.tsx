import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimpleToasts } from '../context/SimpleToastContext';
import { API_ENDPOINTS } from '../config/api';
import TournamentBracket from '../components/TournamentBracket';
import MatchCard from '../components/MatchCard';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'completed';
  participants: number;
  start_date?: string;
  created_by?: number;
  currentUserId?: number;
}

interface Participant {
  id: number;
  username: string;
  joined_at: string;
}

interface Match {
  id: number;
  player1: string;
  player2: string;
  score: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  player1_id?: number;
  player2_id?: number;
  player1_score?: number;
  player2_score?: number;
  round?: number;
  match_number?: number;
  bracket_type?: 'winners' | 'losers' | 'final';
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useSimpleToasts();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTournamentDetails();
    }
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENT_DETAIL(parseInt(id)), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tournament details response:', data);
        setTournament(data);
        setParticipants(data.participants || []);
        setMatches(data.matches || []);
        setIsParticipant(data.isParticipant || false);
        setIsCreator(data.created_by === data.currentUserId);
      } else {
        addToast('Failed to load tournament details', 'error');
        navigate('/tournaments');
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      addToast('Failed to load tournament details', 'error');
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.JOIN_TOURNAMENT(parseInt(id)), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        addToast('Successfully joined tournament!', 'success');
        fetchTournamentDetails(); // Refresh data
      } else {
        const errorData = await response.json();
        
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

  const handleStartTournament = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.START_TOURNAMENT(parseInt(id)), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        addToast('Tournament started successfully!', 'success');
        fetchTournamentDetails(); // Refresh data
      } else {
        const errorData = await response.json();
        
        // Show specific error messages
        let errorMessage = 'Failed to start tournament';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      addToast('Failed to start tournament', 'error');
    }
  };

  const handleDeleteTournament = async () => {
    if (!window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_TOURNAMENT(parseInt(id)), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        addToast('Tournament deleted successfully!', 'success');
        navigate('/tournaments'); // Go back to tournaments list
      } else {
        const errorData = await response.json();
        
        // Show specific error messages
        let errorMessage = 'Failed to delete tournament';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      addToast('Failed to delete tournament', 'error');
    }
  };

  const handleMatchUpdate = async (matchId: number, player1Score: number, player2Score: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_MATCH_SCORE(matchId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          player1Score,
          player2Score
        })
      });

      if (response.ok) {
        addToast('Match score updated successfully!', 'success');
        fetchTournamentDetails(); // Refresh data to get updated bracket
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to update match score';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error updating match score:', error);
      addToast('Failed to update match score', 'error');
    }
  };

  const handlePlayMatch = async (matchId: number) => {
    try {
      // For now, just show a message that this would start the game
      addToast('Starting tournament match... (Game integration coming soon!)', 'info');
      
      // TODO: Integrate with actual game system
      // This would typically:
      // 1. Update match status to 'ongoing'
      // 2. Redirect to game with match context
      // 3. Handle game completion and score updates
      
    } catch (error) {
      console.error('Error starting match:', error);
      addToast('Failed to start match', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-gray-400 bg-gray-400/10';
      case 'archived':
        return 'text-orange-400 bg-orange-400/10';
      case 'expired':
        return 'text-red-400 bg-red-400/10';
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

  // Transform matches for the bracket component
  const bracketMatches = matches.map(match => ({
    id: match.id,
    player1_id: match.player1_id || null,
    player2_id: match.player2_id || null,
    player1_username: match.player1,
    player2_username: match.player2,
    player1_score: match.player1_score || null,
    player2_score: match.player2_score || null,
    status: match.status === 'scheduled' ? 'pending' : 
           match.status === 'ongoing' ? 'ongoing' : 'completed',
    round: match.round || 1,
    match_number: match.match_number || match.id,
    bracket_type: match.bracket_type || 'winners'
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournament details...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Tournament not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/tournaments')}
              className="text-gray-400 hover:text-white mb-4 flex items-center"
            >
              ← Back to Tournaments
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              🏆 {tournament.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
              <span className="text-gray-400">
                👥 {participants.length} participants
              </span>
            </div>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            {!isParticipant && tournament.status === 'pending' && (
              <button
                onClick={handleJoinTournament}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Join Tournament
              </button>
            )}
            {isCreator && (tournament.status === 'pending' || tournament.status === 'archived') && participants.length >= 2 && (
              <button
                onClick={handleStartTournament}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {tournament.status === 'archived' ? 'Start Archived Tournament' : 'Start Tournament'}
              </button>
            )}
            {isCreator && tournament.status === 'pending' && participants.length < 2 && (
              <div className="px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
                Waiting for more participants (need at least 2)
              </div>
            )}
            {isCreator && tournament.status === 'archived' && participants.length < 2 && (
              <div className="px-6 py-3 bg-orange-100 text-orange-800 rounded-lg border border-orange-300">
                Archived tournament needs more participants to start
              </div>
            )}
            {isCreator && (tournament.status === 'pending' || tournament.status === 'archived') && (
              <button
                onClick={handleDeleteTournament}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Tournament
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Description</h2>
            <p className="text-gray-300">{tournament.description}</p>
          </div>
        )}

        {/* Participants */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Participants</h2>
          {participants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="font-semibold text-white">{participant.username}</div>
                  <div className="text-sm text-gray-400">
                    Joined {new Date(participant.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No participants yet</p>
          )}
        </div>

        {/* Tournament Bracket */}
        {matches.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
            <TournamentBracket 
              matches={bracketMatches} 
              participants={participants}
              onMatchUpdate={handleMatchUpdate}
              isEditable={tournament.status === 'active' && (isCreator || isParticipant)}
            />
          </div>
        )}

        {/* Matches */}
        {matches.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Match Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={tournament.currentUserId}
                  onPlayMatch={handlePlayMatch}
                />
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && tournament.status === 'active' && (
          <div className="bg-slate-800/50 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Tournament Started!</h3>
            <p className="text-gray-400">
              Matches will be generated and displayed here.
            </p>
          </div>
        )}

        {matches.length === 0 && tournament.status === 'pending' && (
          <div className="bg-slate-800/50 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-white mb-2">Tournament Not Started</h3>
            <p className="text-gray-400">
              Tournament brackets will be generated when the tournament starts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
