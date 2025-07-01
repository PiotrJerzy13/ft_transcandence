import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from './error.js';

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
  // List all tournaments - Public endpoint, no authentication required
  fastify.get('/tournaments', async (_request, reply: FastifyReply) => {
    const db = getDb();
    // Fetch tournaments from database
    const tournamentRows = await db('tournaments')
      .select(
        'tournaments.id',
        'tournaments.name',
        'tournaments.status',
        db.raw('COUNT(tournament_participants.user_id) as participants')
      )
      .leftJoin('tournament_participants', 'tournaments.id', 'tournament_participants.tournament_id')
      .groupBy('tournaments.id');
    
    // Transform database rows to match the API format
    const tournaments: Tournament[] = tournamentRows.map(row => ({
      id: row.id,
      name: row.name,
      status: mapDatabaseStatus(row.status),
      participants: row.participants || 0
    }));
    return reply.send({ tournaments });
  });

  // Get tournament details - Public endpoint, no authentication required
  fastify.get(
    '/tournaments/:id', 
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      // Fetch tournament details
      const tournament = await db('tournaments')
        .select(
          'tournaments.id',
          'tournaments.name',
          'tournaments.description',
          'tournaments.status',
          db.raw('COUNT(tournament_participants.user_id) as participants')
        )
        .leftJoin('tournament_participants', 'tournaments.id', 'tournament_participants.tournament_id')
        .where('tournaments.id', parseInt(id))
        .groupBy('tournaments.id')
        .first();
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      
      // Fetch tournament matches
      const matchRows = await db('matches')
        .select(
          'matches.id',
          'u1.username as player1_username',
          'u2.username as player2_username',
          'matches.player1_score',
          'matches.player2_score',
          'matches.status'
        )
        .join('users as u1', 'matches.player1_id', 'u1.id')
        .join('users as u2', 'matches.player2_id', 'u2.id')
        .where('matches.tournament_id', parseInt(id));
      
      // Transform matches data
      const matches: Match[] = matchRows.map(match => ({
        id: match.id,
        player1: match.player1_username,
        player2: match.player2_username,
        score: `${match.player1_score}-${match.player2_score}`,
        status: mapMatchStatus(match.status)
      }));
      
      return reply.send({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: mapDatabaseStatus(tournament.status),
        participants: tournament.participants || 0,
        matches
      });
    }
  );

  // Create a new tournament - Protected endpoint
  fastify.post(
    '/tournaments', 
    {
      preHandler: authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['name', 'startDate', 'maxParticipants'],
          properties: {
            name: { type: 'string' },
            startDate: { type: 'string' },
            maxParticipants: { type: 'number' },
            description: { type: 'string' }
          }
        }
      }
    }, 
    async (request, reply: FastifyReply) => {
      const { name, startDate, description = '' } = request.body as {
        name: string;
        startDate: string;
        maxParticipants: number;
        description?: string;
      };
      // Validate input
      if (!name || !startDate) {
        throw new BadRequestError('Missing required fields');
      }
      // Access authenticated user information
      const username = request.user?.username;
      const userId = request.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }
      const db = getDb();
      // Insert tournament into database
      const [result] = await db('tournaments')
        .insert({
          name,
          description,
          start_date: startDate,
          status: 'pending',
          created_by: userId
        })
        .returning('id');
      
      const tournamentId = result.id;
      return reply.status(201).send({
        success: true, 
        message: 'Tournament created successfully',
        tournamentId,
        createdBy: username
      });
    }
  );

  // Join a tournament - Protected endpoint
  fastify.post(
    '/tournaments/:id/join', 
    { 
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }, 
    async (request, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const username = request.user?.username;
      const userId = request.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }
      const db = getDb();
      // Check if tournament exists
      const tournament = await db('tournaments')
        .select('id', 'status')
        .where('id', parseInt(id))
        .first();
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      // Check if tournament is open for registration
      if (tournament.status !== 'pending' && tournament.status !== 'upcoming') {
        throw new BadRequestError('Tournament is not open for registration');
      }
      // Check if user is already registered
      const existingRegistration = await db('tournament_participants')
        .select('id')
        .where({
          tournament_id: parseInt(id),
          user_id: userId
        })
        .first();
      
      if (existingRegistration) {
        throw new BadRequestError('You are already registered for this tournament');
      }
      // Add user to tournament
      await db('tournament_participants')
        .insert({
          tournament_id: parseInt(id),
          user_id: userId
        });
      
      return reply.send({ 
        success: true, 
        message: `Successfully joined tournament ${id} as ${username}` 
      });
    }
  );

  // Get tournament matches - Public endpoint, no authentication required
  fastify.get(
    '/tournaments/:id/matches', 
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      // Check if tournament exists
      const tournament = await db('tournaments')
        .select('id')
        .where('id', parseInt(id))
        .first();
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      // Fetch matches for tournament
      const matchRows = await db('matches')
        .select(
          'matches.id',
          'u1.username as player1_username',
          'u2.username as player2_username',
          'matches.player1_score',
          'matches.player2_score',
          'matches.status'
        )
        .join('users as u1', 'matches.player1_id', 'u1.id')
        .join('users as u2', 'matches.player2_id', 'u2.id')
        .where('matches.tournament_id', parseInt(id))
        .orderBy('matches.id');
      
      // Transform matches data
      const matches: Match[] = matchRows.map(match => ({
        id: match.id,
        player1: match.player1_username,
        player2: match.player2_username,
        score: `${match.player1_score}-${match.player2_score}`,
        status: mapMatchStatus(match.status)
      }));
      
      return reply.send({
        tournamentId: parseInt(id),
        matches
      });
    }
  );

  // Get specific match details - Public endpoint, no authentication required
  fastify.get(
    '/matches/:id', 
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      // Fetch match details
      const match = await db('matches')
        .select(
          'matches.id',
          'u1.username as player1_username',
          'u2.username as player2_username',
          'matches.player1_score',
          'matches.player2_score',
          'matches.played_at as start_time',
          db.raw(`CASE 
            WHEN matches.status = 'completed' THEN matches.played_at 
            ELSE NULL 
          END as end_time`),
          'matches.status'
        )
        .join('users as u1', 'matches.player1_id', 'u1.id')
        .join('users as u2', 'matches.player2_id', 'u2.id')
        .where('matches.id', parseInt(id))
        .first();
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }
      // Transform to match API format
      const matchDetails: MatchDetails = {
        id: match.id,
        player1: {
          username: match.player1_username,
          score: match.player1_score
        },
        player2: {
          username: match.player2_username,
          score: match.player2_score
        },
        startTime: match.start_time || new Date().toISOString(),
        endTime: match.end_time,
        status: mapMatchStatus(match.status)
      };
      return reply.send(matchDetails);
    }
  );

  // Update match score - Protected endpoint (only participants should update scores)
  fastify.put(
    '/matches/:id/score', 
    { 
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['player1Score', 'player2Score'],
          properties: {
            player1Score: { type: 'number' },
            player2Score: { type: 'number' }
          }
        }
      }
    }, 
    async (request, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { player1Score, player2Score } = request.body as { 
        player1Score: number, 
        player2Score: number 
      };
      const userId = request.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }
      const db = getDb();
      // Verify match exists
      const match = await db('matches')
        .select('id', 'player1_id', 'player2_id', 'status')
        .where('id', parseInt(id))
        .first();
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }
      // Verify user is a participant in this match
      if (match.player1_id !== userId && match.player2_id !== userId) {
        throw new BadRequestError('Only match participants can update scores');
      }
      // Check if match is already completed
      if (match.status === 'completed') {
        throw new BadRequestError('Cannot update score for completed match');
      }
      // Update match score in database
      await db('matches')
        .where('id', parseInt(id))
        .update({
          player1_score: player1Score,
          player2_score: player2Score,
          status: 'completed',
          played_at: new Date().toISOString()
        });
      
      return reply.send({
        success: true,
        message: 'Match score updated successfully',
        matchId: parseInt(id),
        newScore: `${player1Score}-${player2Score}`
      });
    }
  );
}

// Helper function to map database status to API status
function mapDatabaseStatus(status: string): 'upcoming' | 'ongoing' | 'completed' {
  switch (status) {
    case 'pending':
      return 'upcoming';
    case 'active':
      return 'ongoing';
    case 'completed':
      return 'completed';
    default:
      return 'upcoming'; // Default value
  }
}

// Helper function to map database match status to API status
function mapMatchStatus(status: string): 'scheduled' | 'ongoing' | 'completed' {
  switch (status) {
    case 'pending':
      return 'scheduled';
    case 'active':
      return 'ongoing';
    case 'completed':
      return 'completed';
    default:
      return 'scheduled'; // Default value
  }
}