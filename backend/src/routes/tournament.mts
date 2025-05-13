import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Tournament {
  id: number;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  participants: number;
}

interface Match {
  id: number;
  player1: string;
  player2: string;
  score: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

interface MatchDetails {
  id: number;
  player1: {
    username: string;
    score: number;
  };
  player2: {
    username: string;
    score: number;
  };
  startTime: string;
  endTime: string | null;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export default async function tournamentRoutes(fastify: FastifyInstance) {
  // List all tournaments
  fastify.get('/tournaments', async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // TODO: Fetch tournaments from database
    const tournaments: Tournament[] = [
      { id: 1, name: 'Weekly Pong Challenge', status: 'ongoing', participants: 8 },
      { id: 2, name: 'Pro Pong Masters', status: 'upcoming', participants: 16 }
    ];
    
    return reply.send({ tournaments });
  });

  // Get tournament details
  fastify.get('/tournaments/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    // TODO: Fetch tournament details from database
    const tournament = {
      id: parseInt(id),
      name: 'Weekly Pong Challenge',
      status: 'ongoing' as const,
      participants: 8,
      matches: [
        { id: 1, player1: 'User1', player2: 'User2', score: '10-8', status: 'completed' as const },
        { id: 2, player1: 'User3', player2: 'User4', score: '5-5', status: 'ongoing' as const }
      ] as Match[]
    };
    
    return reply.send(tournament);
  });

  // Create a new tournament
  fastify.post('/tournaments', async (
    request: FastifyRequest<{
      Body: {
        name: string;
        startDate: string;
        maxParticipants: number;
      }
    }>,
    reply: FastifyReply
  ) => {
    const { name, startDate, maxParticipants } = request.body;
    
    // TODO: Validate input
    if (!name || !startDate || !maxParticipants) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    
    // TODO: Create tournament in database
    const newTournament = {
      success: true, 
      message: 'Tournament created successfully',
      tournamentId: 123 
    };
    
    return reply.status(201).send(newTournament);
  });

  // Join a tournament
  fastify.post('/tournaments/:id/join', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    // TODO: Check if tournament exists and has space
    // TODO: Add user to tournament
    
    return reply.send({ 
      success: true, 
      message: `Successfully joined tournament ${id}` 
    });
  });

  // Get tournament matches
  fastify.get('/tournaments/:id/matches', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    // TODO: Fetch matches for tournament from database
    const matches: Match[] = [
      { id: 1, player1: 'User1', player2: 'User2', score: '10-8', status: 'completed' },
      { id: 2, player1: 'User3', player2: 'User4', score: '5-5', status: 'ongoing' },
      { id: 3, player1: 'User5', player2: 'User6', score: '0-0', status: 'scheduled' }
    ];
    
    return reply.send({
      tournamentId: parseInt(id),
      matches
    });
  });

  // Get specific match details
  fastify.get('/matches/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    // TODO: Fetch match details from database
    const match: MatchDetails = { 
      id: parseInt(id),
      player1: {
        username: 'User1',
        score: 10
      },
      player2: {
        username: 'User2',
        score: 8
      },
      startTime: '2023-07-01T15:30:00Z',
      endTime: '2023-07-01T15:45:00Z',
      status: 'completed'
    };
    
    return reply.send(match);
  });
}