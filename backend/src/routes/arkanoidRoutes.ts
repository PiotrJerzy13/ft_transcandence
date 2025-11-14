import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError } from './error.js';
import userStatsRepository from '../repositories/userStatsRepository.js';
import { InternalServerError } from './error.js';

export default async function arkanoidRoutes(fastify: FastifyInstance) {
  // POST /arkanoid/score - Save score + xp (NEW HANDLER)
  fastify.post('/score', { preHandler: authenticate }, async (req, reply) => {
    req.log.info('[ARKANOID] Received score submission request');
    const { score, levelReached, xpEarned, duration, blocksDestroyed = 0, powerUpsCollected = 0 } = req.body as {
      score: number;
      levelReached: number;
      xpEarned: number;
      duration: number;
      blocksDestroyed?: number;
      powerUpsCollected?: number;
    };
    const userId = req.user!.id;
    req.log.debug({ userId, score, levelReached, xpEarned, duration }, '[ARKANOID] Score submission');

    if (score == null || levelReached == null || xpEarned == null || duration == null) {
      throw new BadRequestError('Missing score, level, xp, or duration');
    }

    // For Arkanoid, every game is a win (single player)
    const isWin = true;

    try {
      const db = getDb();
      await db('arkanoid_scores').insert({
        user_id: userId,
        score,
        level_reached: levelReached,
        xp_earned: xpEarned,
        duration,
        blocks_destroyed: blocksDestroyed,
        power_ups_collected: powerUpsCollected
      });

      const { updatedStats, newAchievements } = await userStatsRepository.processGameResult(userId, {
        isWin,
        duration,
        xpEarned,
        isPerfectGame: false, // Arkanoid doesn't have a "perfect game" achievement in this context
        arkanoidLevelReached: levelReached,
        arkanoidScore: score
      });

      req.log.info({ userId, newAchievements: newAchievements.map(a => a.name) }, '[ARKANOID] Game processed, achievements unlocked');

      return reply.send({
        success: true,
        message: 'Score saved successfully',
        userStats: updatedStats,
        newAchievements
      });
    } catch (error) {
      req.log.error({ err: error }, 'Error processing arkanoid game result');
      throw new InternalServerError('Failed to process game result');
    }
  });

  // GET /arkanoid/history - Fetch personal history
  fastify.get('/history', { preHandler: authenticate }, async (req, reply) => {
    req.log.info('[ARKANOID] Received history request');
    const userId = req.user?.id;
    req.log.debug({ userId }, '[ARKANOID] History request');

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const db = getDb();
    const scores = await db('arkanoid_scores')
      .select('score', 'level_reached', 'xp_earned as xp', 'created_at')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    req.log.debug({ userId, scoreCount: scores.length }, `[ARKANOID] Found ${scores.length} scores for user ${userId}`);
    return reply.send({ history: scores });
  });
}