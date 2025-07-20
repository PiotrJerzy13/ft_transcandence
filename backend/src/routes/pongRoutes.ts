import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import userStatsRepository from '../repositories/userStatsRepository.js';
import { BadRequestError, UnauthorizedError } from './error.js';
import { InternalServerError } from './error.js';

export default async function pongRoutes(fastify: FastifyInstance) {
  // POST /pong/score - Save a completed pong match (NEW HANDLER)
  fastify.post('/score', { preHandler: authenticate }, async (req, reply) => {
    req.log.info('[PONG] Received score submission request');
    const { score, opponentScore, winner, xpEarned, duration } = req.body as {
      score: number;
      opponentScore: number;
      winner: 'player' | 'opponent';
      xpEarned: number;
      duration: number;
    };
    const userId = req.user!.id;

    // Validation...
    if (score == null || opponentScore == null || !winner || xpEarned == null || duration == null) {
      throw new BadRequestError('Missing required fields for pong score');
    }

    const isWin = winner === 'player';
    const isPerfectGame = isWin && opponentScore === 0;

    try {
      const db = getDb();
      await db('pong_matches').insert({
        user_id: userId,
        mode: 'one-player', // or use the actual mode if available
        score: score,
        opponent_score: opponentScore,
        winner,
        xp_earned: xpEarned
      });

      const { updatedStats, newAchievements } = await userStatsRepository.processGameResult(userId, {
        isWin,
        duration,
        xpEarned,
        isPerfectGame
        // arkanoidLevelReached and arkanoidScore are omitted as they are optional
      });

      req.log.info({ userId, newAchievements: newAchievements.map(a => a.name) }, '[PONG] Game processed, achievements unlocked');

      return reply.send({ 
        success: true, 
        message: 'Score saved successfully',
        userStats: updatedStats,
        newAchievements // Send new achievements to the frontend!
      });
    } catch (error) {
      req.log.error({ err: error }, 'Error processing pong game result');
      throw new InternalServerError('Failed to process game result');
    }
  });

  // GET /pong/history - Fetch personal Pong match history (CORRECTED)
  fastify.get('/history', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    req.log.info('[PONG] Received history request');
    const userId = req.user?.id;

    if (!userId) {
      req.log.warn({ body: req.body }, '[PONG] Invalid history request - no user ID');
      throw new UnauthorizedError('User not authenticated');
    }

    try {
      const db = getDb();
      const history = await db('pong_matches')
        .select(
          'mode',
          'score as left_score',
          'opponent_score as right_score',
          'winner',
          'created_at'
        )
        .where('user_id', userId)
        .orderBy('created_at', 'desc');
      
      req.log.debug({ userId, matchCount: history.length }, `[PONG] Found ${history.length} matches for user ${userId}`);
      return reply.send({ history });
      
    } catch (error) {
      req.log.error({ err: error }, 'Error fetching pong history');
      throw new InternalServerError('Failed to fetch pong history');
    }
  });
}
