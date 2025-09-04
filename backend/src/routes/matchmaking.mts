import { FastifyInstance, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/error.js';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketManager } from '../websocket/WebSocketManager.js';

export default async function matchmakingRoutes(fastify: FastifyInstance) {
  console.log('🚀 MATCHMAKING ROUTES REGISTERED');
  
  // Join matchmaking queue
  fastify.post('/matchmaking/join', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['gameType'],
        properties: {
          gameType: { type: 'string', enum: ['pong', 'arkanoid'] }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    console.log('🎮 JOIN MATCHMAKING REQUEST RECEIVED:', request.body);
    const { gameType } = request.body as { gameType: string };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      // Check if already in queue (active entries only)
      const existingQueue = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('game_type', gameType)
        .where('is_active', true)
        .first();
      
      if (existingQueue) {
        throw new BadRequestError('Already in matchmaking queue');
      }
      
      // Clean up any old inactive entries for this user and game type
      await db('matchmaking_queue')
        .where('user_id', userId)
        .where('game_type', gameType)
        .where('is_active', false)
        .del();
      
      // Join the queue
      const [queueEntry] = await db('matchmaking_queue').insert({
        user_id: userId,
        game_type: gameType,
        min_rating: 0,
        max_rating: 9999,
        is_active: true,
        joined_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }).returning('*');
      
      console.log(`🎮 User ${userId} joined ${gameType} matchmaking queue`);
      
      // Try to find a match immediately
      await tryFindMatch(gameType, userId);
      
      return reply.send({
        success: true,
        message: 'Joined matchmaking queue',
        queueEntry: {
          id: queueEntry.id,
          gameType: queueEntry.game_type,
          joinedAt: queueEntry.joined_at,
          expiresAt: queueEntry.expires_at
        }
      });
      
    } catch (error) {
      console.error('Error joining matchmaking queue:', error);
      throw error;
    }
  });

  // Leave matchmaking queue
  fastify.delete('/matchmaking/leave', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['gameType'],
        properties: {
          gameType: { type: 'string', enum: ['pong', 'arkanoid'] }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    console.log('🚪 LEAVE MATCHMAKING REQUEST RECEIVED:', request.body);
    const { gameType } = request.body as { gameType: string };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      // First, check if user is actually in the queue
      console.log(`🔍 DEBUG: Looking for queue entry - userId: ${userId}, gameType: ${gameType}`);
      
      const existingEntry = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('game_type', gameType)
        .where('is_active', true)
        .first();
      
      console.log(`🔍 DEBUG: Found existing entry:`, existingEntry);
      
      if (!existingEntry) {
        // Debug: Check what entries exist for this user
        const allUserEntries = await db('matchmaking_queue')
          .where('user_id', userId)
          .select('*');
        console.log(`🔍 DEBUG: All entries for user ${userId}:`, allUserEntries);
        throw new BadRequestError('Not in matchmaking queue');
      }
      
      // Update the entry to inactive
      const result = await db('matchmaking_queue')
        .where('id', existingEntry.id)
        .update({ is_active: false });
      
      if (result === 0) {
        throw new BadRequestError('Not in matchmaking queue');
      }
      
      console.log(`🚪 User ${userId} left ${gameType} matchmaking queue`);
      console.log(`🔍 DEBUG: Updated entry ID ${existingEntry.id} to inactive`);
      
      // Debug: Check if there are any remaining active entries
      const remainingActive = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('is_active', true)
        .select('*');
      console.log(`🔍 DEBUG: Remaining active entries for user ${userId}:`, remainingActive);
      
      return reply.send({
        success: true,
        message: 'Left matchmaking queue'
      });
      
    } catch (error) {
      console.error('Error leaving matchmaking queue:', error);
      throw error;
    }
  });

  // Get queue status
  fastify.get('/matchmaking/status', {
    preHandler: authenticate
  }, async (request, reply: FastifyReply) => {
    console.log('📊 MATCHMAKING STATUS REQUEST RECEIVED - START');
    console.log('📊 Request URL:', request.url);
    console.log('📊 Request method:', request.method);
    console.log('📊 Request headers:', request.headers);
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      // Debug: Check all entries for this user first
      const allEntries = await db('matchmaking_queue')
        .where('user_id', userId)
        .select('*');
      console.log(`🔍 DEBUG: All entries for user ${userId}:`, allEntries);
      
      const queueEntries = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('is_active', true)
        .select('game_type', 'joined_at', 'expires_at');
      
      console.log(`📊 Found ${queueEntries.length} ACTIVE queue entries for user ${userId}:`, queueEntries);
      
      return reply.send({
        success: true,
        queueEntries: queueEntries.map(entry => ({
          gameType: entry.game_type,
          joinedAt: entry.joined_at,
          expiresAt: entry.expires_at
        }))
      });
      
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  });

  // Get active game sessions for user
  fastify.get('/game-sessions/active', {
    preHandler: authenticate
  }, async (request, reply: FastifyReply) => {
    console.log('🎮 ACTIVE GAME SESSIONS REQUEST RECEIVED');
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const sessions = await db('game_sessions')
        .where(function() {
          this.where('player1_id', userId).orWhere('player2_id', userId);
        })
        .whereIn('status', ['waiting', 'active'])
        .select('*')
        .orderBy('created_at', 'desc');
      
      console.log(`🎮 Found ${sessions.length} active sessions for user ${userId}`);
      
      return reply.send({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          sessionId: session.session_id,
          gameType: session.game_type,
          status: session.status,
          player1Id: session.player1_id,
          player2Id: session.player2_id,
          player1Score: session.player1_score,
          player2Score: session.player2_score,
          maxScore: session.max_score,
          createdAt: session.created_at,
          startedAt: session.started_at
        }))
      });
      
    } catch (error) {
      console.error('Error getting active game sessions:', error);
      throw error;
    }
  });

  // Get game session details
  fastify.get('/game-sessions/:sessionId', {
    preHandler: authenticate
  }, async (request, reply: FastifyReply) => {
    const { sessionId } = request.params as { sessionId: string };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const session = await db('game_sessions')
        .where('session_id', sessionId)
        .where(function() {
          this.where('player1_id', userId).orWhere('player2_id', userId);
        })
        .first();
      
      if (!session) {
        throw new NotFoundError('Game session not found');
      }
      
      return reply.send({
        success: true,
        session: {
          id: session.id,
          sessionId: session.session_id,
          gameType: session.game_type,
          status: session.status,
          player1Id: session.player1_id,
          player2Id: session.player2_id,
          player1Score: session.player1_score,
          player2Score: session.player2_score,
          maxScore: session.max_score,
          createdAt: session.created_at,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          gameState: session.game_state
        }
      });
      
    } catch (error) {
      console.error('Error getting game session details:', error);
      throw error;
    }
  });

  // Update game score
  fastify.put('/game-sessions/:sessionId/score', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['player1Score', 'player2Score'],
        properties: {
          player1Score: { type: 'number', minimum: 0 },
          player2Score: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { player1Score, player2Score } = request.body as { player1Score: number; player2Score: number };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const session = await db('game_sessions')
        .where('session_id', sessionId)
        .where(function() {
          this.where('player1_id', userId).orWhere('player2_id', userId);
        })
        .first();
      
      if (!session) {
        throw new NotFoundError('Game session not found');
      }
      
      // Update scores
      await db('game_sessions')
        .where('session_id', sessionId)
        .update({
          player1_score: player1Score,
          player2_score: player2Score
        });
      
      // Check if game is completed
      const maxScore = session.max_score || 11;
      if (player1Score >= maxScore || player2Score >= maxScore) {
        const winnerId = player1Score >= maxScore ? session.player1_id : session.player2_id;
        
        await db('game_sessions')
          .where('session_id', sessionId)
          .update({
            status: 'completed',
            winner_id: winnerId,
            completed_at: new Date().toISOString()
          });
        
        // Update user stats
        await updateUserStats(session.player1_id, session.player2_id, winnerId);
      }
      
      return reply.send({
        success: true,
        message: 'Score updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating game score:', error);
      throw error;
    }
  });
}

// Helper function to try finding a match
async function tryFindMatch(gameType: string, userId: number) {
  const db = getDb();
  
  try {
    // Find another player in the same queue
    const otherPlayer = await db('matchmaking_queue')
      .where('game_type', gameType)
      .where('is_active', true)
      .where('user_id', '!=', userId)
      .first();
    
    if (otherPlayer) {
      // Create a game session
      const sessionId = uuidv4();
      const [session] = await db('game_sessions').insert({
        session_id: sessionId,
        game_type: gameType,
        status: 'waiting',
        player1_id: userId,
        player2_id: otherPlayer.user_id,
        player1_score: 0,
        player2_score: 0,
        max_score: 11,
        created_at: new Date().toISOString()
      }).returning('*');
      
             // Remove both players from queue
       await db('matchmaking_queue')
         .whereIn('user_id', [userId, otherPlayer.user_id])
         .where('game_type', gameType)
         .where('is_active', true)
         .update({ is_active: false });
       
       console.log(`🎮 Match found! Created session ${sessionId} for users ${userId} and ${otherPlayer.user_id}`);
       
       // Create WebSocket game room and notify players
       try {
         const wsManager = getWebSocketManager();
         wsManager.createGameRoom(sessionId, gameType, userId, otherPlayer.user_id);
         console.log(`📡 WebSocket game room created and players notified for match ${sessionId}`);
       } catch (wsError) {
         console.error('Error creating WebSocket game room:', wsError);
         // Continue with game session creation even if WebSocket fails
       }
       
       return session;
    }
    
    return null;
  } catch (error) {
    console.error('Error trying to find match:', error);
    return null;
  }
}

// Helper function to update user stats after game completion
async function updateUserStats(player1Id: number, player2Id: number, winnerId: number) {
  const db = getDb();
  
  try {
    // Update winner stats
    await db('users')
      .where('id', winnerId)
      .increment('wins', 1);
    
    // Update loser stats
    const loserId = winnerId === player1Id ? player2Id : player1Id;
    await db('users')
      .where('id', loserId)
      .increment('losses', 1);
    
    console.log(`📊 Updated stats: Winner ${winnerId}, Loser ${loserId}`);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}
