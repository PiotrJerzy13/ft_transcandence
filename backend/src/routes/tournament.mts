import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from './error.js';

interface Tournament {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
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
  // Test endpoint to verify the route is working
  fastify.get('/tournaments/test', async (_request, reply: FastifyReply) => {
    console.log('=== TEST ENDPOINT CALLED ===');
    return reply.send({ message: 'Tournament routes are working!', timestamp: new Date().toISOString() });
  });

  // Fix tournaments endpoint - force update database
  fastify.get('/tournaments/fix', async (_request, reply: FastifyReply) => {
    console.log('=== FIXING TOURNAMENTS ===');
    const db = getDb();
    
    // Update all tournaments to have 'pending' status
    await db('tournaments').update({ status: 'pending' });
    
    // Add creators as participants for all tournaments
    const tournaments = await db('tournaments').select('id', 'created_by');
    for (const tournament of tournaments) {
      if (tournament.created_by) {
        // Check if participant already exists
        const existing = await db('tournament_participants')
          .where('tournament_id', tournament.id)
          .where('user_id', tournament.created_by)
          .first();
        
        if (!existing) {
          await db('tournament_participants').insert({
            tournament_id: tournament.id,
            user_id: tournament.created_by
          });
          console.log(`Added creator ${tournament.created_by} to tournament ${tournament.id}`);
        }
      }
    }
    
    return reply.send({ message: 'Tournaments fixed!', tournaments });
  });
  // List all tournaments - Public endpoint, no authentication required
  fastify.get('/tournaments', async (_request, reply: FastifyReply) => {
    console.log('=== TOURNAMENTS ENDPOINT CALLED ===');
    const db = getDb();
    
    // Quick fix: Add creators as participants for tournaments with 0 participants
    const tournamentsWithoutParticipants = await db('tournaments as t')
      .leftJoin('tournament_participants as tp', 't.id', 'tp.tournament_id')
      .whereNull('tp.tournament_id')
      .select('t.id', 't.created_by');
    
    for (const tournament of tournamentsWithoutParticipants) {
      if (tournament.created_by) {
        await db('tournament_participants').insert({
          tournament_id: tournament.id,
          user_id: tournament.created_by
        });
        console.log(`Fixed tournament ${tournament.id} - added creator ${tournament.created_by} as participant`);
      }
    }
    
    // Debug: Log the raw data
    console.log('=== DEBUG: Fetching tournaments ===');
    
    // Fetch tournaments from database with proper participant count
    const tournamentRows = await db('tournaments')
      .select(
        'tournaments.id',
        'tournaments.name',
        'tournaments.status',
        'tournaments.description',
        'tournaments.start_date',
        db.raw('COALESCE(COUNT(tournament_participants.user_id), 0) as participants')
      )
      .leftJoin('tournament_participants', 'tournaments.id', 'tournament_participants.tournament_id')
      .groupBy('tournaments.id', 'tournaments.name', 'tournaments.status', 'tournaments.description', 'tournaments.start_date');
    
    console.log('Raw tournament rows:', JSON.stringify(tournamentRows, null, 2));
    
    // Transform database rows to match the API format
    const tournaments: Tournament[] = tournamentRows.map(row => {
      const tournament = {
        id: row.id,
        name: row.name,
        status: mapDatabaseStatus(row.status),
        participants: parseInt(row.participants) || 0
      };
      console.log('Transformed tournament:', tournament);
      return tournament;
    });
    
    console.log('Final tournaments array:', JSON.stringify(tournaments, null, 2));
    
    // Quick fix: If any tournament has 0 participants, add the creator as participant
    for (const tournament of tournaments) {
      if (tournament.participants === 0) {
        console.log(`Fixing tournament ${tournament.id} - adding creator as participant`);
        const tournamentData = await db('tournaments')
          .select('created_by')
          .where('id', tournament.id)
          .first();
        
        if (tournamentData && tournamentData.created_by) {
          // Check if participant already exists
          const existingParticipant = await db('tournament_participants')
            .where('tournament_id', tournament.id)
            .where('user_id', tournamentData.created_by)
            .first();
          
          if (!existingParticipant) {
            await db('tournament_participants').insert({
              tournament_id: tournament.id,
              user_id: tournamentData.created_by
            });
            console.log(`Added creator ${tournamentData.created_by} as participant to tournament ${tournament.id}`);
          }
        }
      }
    }
    
    // Fetch updated data
    const updatedTournamentRows = await db('tournaments')
      .select(
        'tournaments.id',
        'tournaments.name',
        'tournaments.status',
        'tournaments.description',
        'tournaments.start_date',
        db.raw('COALESCE(COUNT(tournament_participants.user_id), 0) as participants')
      )
      .leftJoin('tournament_participants', 'tournaments.id', 'tournament_participants.tournament_id')
      .groupBy('tournaments.id', 'tournaments.name', 'tournaments.status', 'tournaments.description', 'tournaments.start_date');
    
    const finalTournaments: Tournament[] = updatedTournamentRows.map(row => ({
      id: row.id,
      name: row.name,
      status: mapDatabaseStatus(row.status),
      participants: parseInt(row.participants) || 0
    }));
    
    console.log('Final tournaments after fix:', JSON.stringify(finalTournaments, null, 2));
    return reply.send({ tournaments: finalTournaments });
  });

  // Create new tournament - Protected endpoint
  fastify.post('/tournaments', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'description', 'startDate'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          startDate: { type: 'string', format: 'date-time' },
          maxParticipants: { type: 'number', minimum: 2, maximum: 64 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    console.log('=== CREATING TOURNAMENT ===');
    const { name, description, startDate, maxParticipants = 16 } = request.body as {
      name: string;
      description: string;
      startDate: string;
      maxParticipants?: number;
    };
    const userId = request.user?.id;
    
    console.log('Tournament data:', { name, description, startDate, maxParticipants, userId });
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    // Validate start date is in the future
    const startDateTime = new Date(startDate);
    console.log('Start date validation:', { startDate, startDateTime, now: new Date() });
    if (startDateTime <= new Date()) {
      throw new BadRequestError('Tournament start date must be in the future');
    }

    // Create tournament
    console.log('Creating tournament in database...');
    const [tournamentId] = await db('tournaments').insert({
      name,
      description,
      start_date: startDateTime.toISOString(),
      status: 'pending',
      created_by: userId
    });
    console.log('Tournament created with ID:', tournamentId);

    // Auto-join the creator
    console.log('Adding creator as participant...');
    await db('tournament_participants').insert({
      tournament_id: tournamentId,
      user_id: userId
    });
    console.log('Creator added as participant');

    return reply.status(201).send({
      success: true,
      message: 'Tournament created successfully',
      tournament: {
        id: tournamentId,
        name,
        description,
        startDate,
        maxParticipants,
        status: 'pending'
      }
    });
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
      console.log('=== FETCHING TOURNAMENT DETAILS ===');
      const { id } = request.params as { id: string };
      console.log('Tournament ID:', id);
      const db = getDb();
      
      // First check if tournament exists
      const tournamentExists = await db('tournaments')
        .select('id')
        .where('id', parseInt(id))
        .first();
      
      console.log('Tournament exists check:', tournamentExists);
      
      if (!tournamentExists) {
        console.log('Tournament not found in database');
        throw new NotFoundError('Tournament not found');
      }
      
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
        .groupBy('tournaments.id', 'tournaments.name', 'tournaments.description', 'tournaments.status')
        .first();
            if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }
      
      // Fetch tournament participants
      const participantRows = await db('tournament_participants')
        .select(
          'tournament_participants.user_id',
          'users.username',
          'tournament_participants.joined_at'
        )
        .join('users', 'tournament_participants.user_id', 'users.id')
        .where('tournament_participants.tournament_id', parseInt(id));
      
      console.log('Participant rows:', participantRows);
      
      // Transform participants data
      const participants = participantRows.map(participant => ({
        id: participant.user_id,
        username: participant.username,
        joined_at: participant.joined_at
      }));
      
      // Fetch tournament matches
      const matchRows = await db('matches')
        .select(
          'matches.id',
          'matches.player1_id',
          'matches.player2_id',
          'u1.username as player1_username',
          'u2.username as player2_username',
          'matches.player1_score',
          'matches.player2_score',
          'matches.status'
        )
        .leftJoin('users as u1', 'matches.player1_id', 'u1.id')
        .leftJoin('users as u2', 'matches.player2_id', 'u2.id')
        .where('matches.tournament_id', parseInt(id));
      
      console.log('Match rows:', matchRows);
      
      // Transform matches data
      const matches: Match[] = matchRows.map(match => ({
        id: match.id,
        player1: match.player1_username || `Player ${match.player1_id}`,
        player2: match.player2_username || `Player ${match.player2_id}`,
        score: match.player1_score !== null && match.player2_score !== null 
          ? `${match.player1_score}-${match.player2_score}` 
          : 'Not played',
        status: mapMatchStatus(match.status)
      }));
      
      // Get current user ID from request
      const currentUserId = request.user?.id;
      
      return reply.send({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: mapDatabaseStatus(tournament.status),
        participants: participants, // Now sending the actual participant list
        participantCount: tournament.participants || 0, // Keep the count for compatibility
        matches,
        created_by: tournament.created_by,
        currentUserId
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
        throw new BadRequestError('This tournament is no longer accepting participants');
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
        throw new BadRequestError('You are already a participant in this tournament');
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

  // Start tournament and generate brackets - Protected endpoint (only creator can start)
  fastify.post('/tournaments/:id/start', {
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
  }, async (request, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    // Get tournament details
    const tournament = await db('tournaments')
      .select('id', 'status', 'created_by', 'start_date')
      .where('id', parseInt(id))
      .first();
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    // Check if user is the creator
    if (tournament.created_by !== userId) {
      throw new UnauthorizedError('Only tournament creator can start the tournament');
    }
    
    // Check if tournament is in pending status
    if (tournament.status !== 'pending') {
      throw new BadRequestError('Tournament can only be started when in pending status');
    }
    
    // Check if start date has passed
    if (new Date(tournament.start_date) > new Date()) {
      throw new BadRequestError('Tournament start date has not been reached');
    }
    
    // Get participants
    const participants = await db('tournament_participants')
      .select('user_id')
      .where('tournament_id', parseInt(id))
      .orderBy('joined_at');
    
    if (participants.length < 2) {
      throw new BadRequestError('Tournament needs at least 2 participants to start');
    }
    
    const participantIds = participants.map(p => p.user_id);
    
    // Generate brackets
    const brackets = generateTournamentBrackets(participantIds);
    
    // Insert matches into database
    const matchInserts = brackets.map(match => ({
      tournament_id: parseInt(id),
      player1_id: match.player1_id === -1 ? null : match.player1_id,
      player2_id: match.player2_id === -1 ? null : match.player2_id,
      player1_score: 0,
      player2_score: 0,
      status: match.player1_id === -1 || match.player2_id === -1 ? 'completed' : 'pending',
      round: match.round,
      match_number: match.match_number
    }));
    
    await db('matches').insert(matchInserts);
    
    // Update tournament status to active
    await db('tournaments')
      .where('id', parseInt(id))
      .update({ status: 'active' });
    
    return reply.send({
      success: true,
      message: 'Tournament started successfully',
      tournamentId: parseInt(id),
      matchesGenerated: brackets.length,
      participants: participantIds.length
    });
  });



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
function mapDatabaseStatus(status: string): 'pending' | 'active' | 'completed' {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    default:
      return 'pending'; // Default value
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

// Helper function to generate tournament brackets
function generateTournamentBrackets(participants: number[]): Array<{
  player1_id: number;
  player2_id: number;
  round: number;
  match_number: number;
}> {
  const matches: Array<{
    player1_id: number;
    player2_id: number;
    round: number;
    match_number: number;
  }> = [];
  const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
  
  // Ensure we have an even number of participants (add bye if needed)
  if (shuffledParticipants.length % 2 !== 0) {
    shuffledParticipants.push(-1); // -1 represents a bye
  }
  
  // Generate first round matches
  for (let i = 0; i < shuffledParticipants.length; i += 2) {
    matches.push({
      player1_id: shuffledParticipants[i],
      player2_id: shuffledParticipants[i + 1],
      round: 1,
      match_number: Math.floor(i / 2) + 1
    });
  }
  
  return matches;
}