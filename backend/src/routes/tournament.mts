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
    const tournamentRows = await db.all(`
      SELECT 
        t.id, 
        t.name, 
        t.status, 
        COUNT(tp.user_id) as participants
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      GROUP BY t.id
    `);
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
      const tournament = await db.get(`
        SELECT 
          t.id, 
          t.name, 
          t.description, 
          t.status, 
          COUNT(tp.user_id) as participants
        FROM tournaments t
        LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
        WHERE t.id = ?
        GROUP BY t.id
      `, parseInt(id));
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      // Fetch tournament matches
      const matchRows = await db.all(`
        SELECT 
          m.id, 
          u1.username as player1_username,
          u2.username as player2_username,
          m.player1_score,
          m.player2_score,
          m.status
        FROM matches m
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE m.tournament_id = ?
      `, parseInt(id));
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
      const result = await db.run(`
        INSERT INTO tournaments (name, description, start_date, status, created_by)
        VALUES (?, ?, ?, 'pending', ?)
      `, [name, description, startDate, userId]);
      const tournamentId = result.lastID;
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
      const tournament = await db.get('SELECT id, status FROM tournaments WHERE id = ?', parseInt(id));
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      // Check if tournament is open for registration
      if (tournament.status !== 'pending' && tournament.status !== 'upcoming') {
        throw new BadRequestError('Tournament is not open for registration');
      }
      // Check if user is already registered
      const existingRegistration = await db.get(
        'SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?', 
        [parseInt(id), userId]
      );
      if (existingRegistration) {
        throw new BadRequestError('You are already registered for this tournament');
      }
      // Add user to tournament
      await db.run(
        'INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)',
        [parseInt(id), userId]
      );
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
      const tournament = await db.get('SELECT id FROM tournaments WHERE id = ?', parseInt(id));
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      // Fetch matches for tournament
      const matchRows = await db.all(`
        SELECT 
          m.id, 
          u1.username as player1_username,
          u2.username as player2_username,
          m.player1_score,
          m.player2_score,
          m.status
        FROM matches m
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE m.tournament_id = ?
        ORDER BY m.id
      `, parseInt(id));
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
      const match = await db.get(`
        SELECT 
          m.id,
          u1.username as player1_username,
          u2.username as player2_username,
          m.player1_score,
          m.player2_score,
          m.played_at as start_time,
          CASE 
            WHEN m.status = 'completed' THEN m.played_at 
            ELSE NULL 
          END as end_time,
          m.status
        FROM matches m
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE m.id = ?
      `, parseInt(id));
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
      const match = await db.get(`
        SELECT 
          m.id, 
          m.player1_id, 
          m.player2_id,
          m.status
        FROM matches m
        WHERE m.id = ?
      `, parseInt(id));
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
      await db.run(`
        UPDATE matches
        SET player1_score = ?, player2_score = ?, status = ?, played_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [player1Score, player2Score, 'completed', parseInt(id)]);
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