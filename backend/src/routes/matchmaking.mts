import { FastifyInstance, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/error.js';
import { v4 as uuidv4 } from 'uuid';

export default async function matchmakingRoutes(fastify: FastifyInstance) {
  // Join matchmaking queue
  fastify.post('/matchmaking/join', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['gameType'],
        properties: {
          gameType: { type: 'string', enum: ['pong', 'arkanoid'] },
          minRating: { type: 'number', minimum: 0 },
          maxRating: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const { gameType, minRating = 0, maxRating = 9999 } = request.body as {
      gameType: string;
      minRating?: number;
      maxRating?: number;
    };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      // Check if user is already in queue
      const existingQueue = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('game_type', gameType)
        .where('is_active', true)
        .first();
      
      if (existingQueue) {
        throw new BadRequestError('Already in matchmaking queue');
      }
      
      // Join the queue
      const [queueEntry] = await db('matchmaking_queue').insert({
        user_id: userId,
        game_type: gameType,
        min_rating: minRating,
        max_rating: maxRating,
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
    const { gameType } = request.body as { gameType: string };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const result = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('game_type', gameType)
        .where('is_active', true)
        .update({ is_active: false });
      
      if (result === 0) {
        throw new BadRequestError('Not in matchmaking queue');
      }
      
      console.log(`🚪 User ${userId} left ${gameType} matchmaking queue`);
      
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
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const queueEntries = await db('matchmaking_queue')
        .where('user_id', userId)
        .where('is_active', true)
        .select('game_type', 'joined_at', 'expires_at');
      
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
        .first();
      
      if (!session) {
        throw new NotFoundError('Game session not found');
      }
      
      // Check if user is a participant
      if (session.player1_id !== userId && session.player2_id !== userId) {
        throw new UnauthorizedError('Not a participant in this game session');
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
          winnerId: session.winner_id,
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
      console.error('Error getting game session:', error);
      throw error;
    }
  });

  // Update game score
  fastify.put('/game-sessions/:sessionId/score', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' }
        }
      },
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
    const { player1Score, player2Score } = request.body as {
      player1Score: number;
      player2Score: number;
    };
    const userId = request.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    
    try {
      const session = await db('game_sessions')
        .where('session_id', sessionId)
        .first();
      
      if (!session) {
        throw new NotFoundError('Game session not found');
      }
      
      // Check if user is a participant
      if (session.player1_id !== userId && session.player2_id !== userId) {
        throw new UnauthorizedError('Not a participant in this game session');
      }
      
      // Check if game is active
      if (session.status !== 'active') {
        throw new BadRequestError('Game is not active');
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
      let newStatus = session.status;
      let winnerId = session.winner_id;
      
      if (player1Score >= maxScore || player2Score >= maxScore) {
        newStatus = 'completed';
        winnerId = player1Score >= maxScore ? session.player1_id : session.player2_id;
        
        await db('game_sessions')
          .where('session_id', sessionId)
          .update({
            status: newStatus,
            winner_id: winnerId,
            completed_at: new Date().toISOString()
          });
        
        // Update user stats
        await updateUserStats(session.player1_id, session.player2_id, winnerId);
      }
      
      return reply.send({
        success: true,
        message: 'Score updated',
        gameCompleted: newStatus === 'completed',
        winnerId: winnerId
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
    // Get user's rating
    const userStats = await db('user_stats')
      .where('user_id', userId)
      .first();
    
    const userRating = userStats?.rating || 1000;
    
    // Find potential opponents
    const potentialMatches = await db('matchmaking_queue')
      .join('user_stats', 'matchmaking_queue.user_id', 'user_stats.user_id')
      .where('matchmaking_queue.game_type', gameType)
      .where('matchmaking_queue.is_active', true)
      .where('matchmaking_queue.user_id', '!=', userId)
      .where('user_stats.rating', '>=', userRating - 200) // Within 200 rating points
      .where('user_stats.rating', '<=', userRating + 200)
      .select(
        'matchmaking_queue.*',
        'user_stats.rating as opponent_rating'
      )
      .orderBy('matchmaking_queue.joined_at', 'asc')
      .limit(5);
    
    if (potentialMatches.length > 0) {
      const opponent = potentialMatches[0];
      
      // Create game session
      const sessionId = uuidv4();
      const [gameSession] = await db('game_sessions').insert({
        session_id: sessionId,
        game_type: gameType,
        status: 'waiting',
        player1_id: userId,
        player2_id: opponent.user_id,
        player1_score: 0,
        player2_score: 0,
        max_score: 11,
        created_at: new Date().toISOString()
      }).returning('*');
      
      // Remove both players from queue
      await db('matchmaking_queue')
        .whereIn('user_id', [userId, opponent.user_id])
        .where('game_type', gameType)
        .where('is_active', true)
        .update({ is_active: false });
      
      console.log(`🎯 Match found! Session ${sessionId} created for ${gameType} game`);
      
      // TODO: Send WebSocket notifications to both players
      
      return gameSession;
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
    // Get current stats
    const player1Stats = await db('user_stats').where('user_id', player1Id).first();
    const player2Stats = await db('user_stats').where('user_id', player2Id).first();
    
    // Update wins/losses
    if (winnerId === player1Id) {
      await db('user_stats')
        .where('user_id', player1Id)
        .update({
          wins: (player1Stats?.wins || 0) + 1,
          total_games: (player1Stats?.total_games || 0) + 1
        });
      
      await db('user_stats')
        .where('user_id', player2Id)
        .update({
          losses: (player2Stats?.losses || 0) + 1,
          total_games: (player2Stats?.total_games || 0) + 1
        });
    } else {
      await db('user_stats')
        .where('user_id', player2Id)
        .update({
          wins: (player2Stats?.wins || 0) + 1,
          total_games: (player2Stats?.total_games || 0) + 1
        });
      
      await db('user_stats')
        .where('user_id', player1Id)
        .update({
          losses: (player1Stats?.losses || 0) + 1,
          total_games: (player1Stats?.total_games || 0) + 1
        });
    }
    
    console.log(`📊 Updated stats for game completion. Winner: ${winnerId}`);
    
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}
