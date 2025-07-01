import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError } from './error.js';

export default async function pongRoutes(fastify: FastifyInstance) {
  // POST /pong/score - Save a completed pong match
  fastify.post('/score', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[PONG] Received score submission request');

    const { mode, score, opponentScore, winner, xpEarned } = req.body as {
      mode: 'one-player' | 'two-player';
      score: number;
      opponentScore: number;
      winner: 'player' | 'opponent';
      xpEarned: number;
    };
    const userId = req.user?.id;

    if (!userId || score == null || opponentScore == null || !winner || !mode || xpEarned == null) {
      console.log('[PONG] Invalid score submission - missing data');
      throw new BadRequestError('Missing required fields');
    }

    const db = getDb();
    console.log('[PONG] Saving match with XP:', { userId, mode, score, opponentScore, winner, xpEarned });

    // Save the match with XP data
    await db('pong_matches').insert({
      user_id: userId,
      mode,
      score,
      opponent_score: opponentScore,
      winner,
      xp_earned: xpEarned,
      total_xp: null // Optionally remove or set to null if not used
    });

    // Get current user stats
    const currentStats = await db('user_stats')
      .select('xp', 'level')
      .where('user_id', userId)
      .first();

    // Calculate new total XP and level
    const currentTotalXp = currentStats?.xp || 0;
    const newTotalXp = currentTotalXp + xpEarned;
    const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;

    // Update user stats with XP using upsert
    await db('user_stats')
      .insert({
        user_id: userId,
        xp: newTotalXp,
        level: newLevel,
        total_games: 1,
        wins: winner === 'player' ? 1 : 0,
        losses: winner === 'opponent' ? 1 : 0,
        win_streak: winner === 'player' ? 1 : 0,
        best_streak: winner === 'player' ? 1 : 0,
        total_play_time: 0,
        rank: 'Novice'
      })
      .onConflict('user_id')
      .merge({
        xp: newTotalXp,
        level: newLevel,
        total_games: db.raw('total_games + 1'),
        wins: db.raw(`wins + ${winner === 'player' ? 1 : 0}`),
        losses: db.raw(`losses + ${winner === 'opponent' ? 1 : 0}`),
        win_streak: db.raw(`CASE WHEN '${winner}' = 'player' THEN win_streak + 1 ELSE 0 END`),
        best_streak: db.raw(`CASE WHEN '${winner}' = 'player' AND win_streak + 1 > best_streak THEN win_streak + 1 ELSE best_streak END`),
        updated_at: new Date().toISOString()
      });

    const updatedStats = await db('user_stats')
      .select('xp', 'level')
      .where('user_id', userId)
      .first();

    console.log('[PONG] Score and XP saved successfully:', {
      userId,
      xpEarned,
      totalXp: updatedStats?.xp,
      level: updatedStats?.level
    });

    return reply.send({ 
      success: true, 
      message: 'Score saved successfully',
      userStats: updatedStats
    });
  });

  // GET /pong/history - Fetch personal Pong match history
  fastify.get('/history', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[PONG] Received history request');
    const userId = req.user?.id;

    if (!userId) {
      console.log('[PONG] Invalid history request - no user ID');
      throw new UnauthorizedError('User not authenticated');
    }

    const db = getDb();
    const history = await db('pong_matches')
      .select('mode', 'score', 'opponent_score', 'winner', 'created_at')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    console.log(`[PONG] Found ${history.length} matches for user ${userId}`);
    return reply.send({ history });
  });
}
