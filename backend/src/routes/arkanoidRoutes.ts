import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError } from './error.js';

export default async function arkanoidRoutes(fastify: FastifyInstance) {
  // POST /arkanoid/score - Save score + xp
  fastify.post('/score', { preHandler: authenticate }, async (req, reply) => {
    req.log.info('[ARKANOID] Received score submission request');
    const { score, levelReached, xpEarned, totalXp } = req.body as {
      score: number;
      levelReached: number;
      xpEarned: number;
      totalXp?: number;
    };
    const userId = req.user?.id;
    req.log.debug({ userId, score, levelReached, xpEarned, totalXp }, '[ARKANOID] Score submission');

    if (!userId || score == null || levelReached == null || xpEarned == null) {
      throw new BadRequestError('Missing score, level or xp');
    }

    const db = getDb();

    // Get current user stats
    const currentStats = await db('user_stats')
      .select('xp', 'level')
      .where('user_id', userId)
      .first();

    // Calculate new total XP
    const currentTotalXp = currentStats?.xp || 0;
    const newTotalXp = currentTotalXp + xpEarned;
    const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;

    // Save game result
    await db('arkanoid_scores').insert({
      user_id: userId,
      score,
      level_reached: levelReached,
      xp_earned: xpEarned
    });

    // Update user_stats table with new total XP and increment total_games and wins
    await db('user_stats')
      .insert({
        user_id: userId,
        xp: newTotalXp,
        level: newLevel,
        total_games: 1,
        wins: 1,
        losses: 0,
        win_streak: 1,
        best_streak: 1,
        total_play_time: 0,
        rank: 'Novice'
      })
      .onConflict('user_id')
      .merge({
        xp: newTotalXp,
        level: newLevel,
        total_games: db.raw('total_games + 1'),
        wins: db.raw('wins + 1'),
        updated_at: new Date().toISOString()
      });

    const updatedStats = await db('user_stats')
      .select('xp', 'level')
      .where('user_id', userId)
      .first();

    req.log.info({ userId, newTotalXp, newLevel }, '[ARKANOID] Score and XP saved successfully');
    return reply.send({
      success: true,
      message: 'Score saved successfully',
      userStats: updatedStats,
    });
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