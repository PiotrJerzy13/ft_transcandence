import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { BadRequestError, UnauthorizedError } from './error.js';

export default async function pongRoutes(fastify: FastifyInstance) {
  // POST /pong/score - Save a completed pong match
  fastify.post('/score', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[PONG] Received score submission request');

    const { mode, score, opponentScore, winner, xpEarned, totalXp } = req.body as {
      mode: 'one-player' | 'two-player';
      score: number;
      opponentScore: number;
      winner: 'player' | 'opponent';
      xpEarned: number;
      totalXp: number;
    };
    const userId = req.user?.id;

    if (!userId || score == null || opponentScore == null || !winner || !mode || xpEarned == null || totalXp == null) {
      console.log('[PONG] Invalid score submission - missing data');
      throw new BadRequestError('Missing required fields');
    }

    const db = getDb();
    console.log('[PONG] Saving match with XP:', { userId, mode, score, opponentScore, winner, xpEarned, totalXp });

    // Save the match with XP data
    await db.run(
      `INSERT INTO pong_matches (user_id, mode, score, opponent_score, winner, xp_earned, total_xp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, mode, score, opponentScore, winner, xpEarned, totalXp]
    );

    // Get current user stats
    const currentStats = await db.get(
      `SELECT xp, level FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    // Calculate new total XP and level
    const currentTotalXp = currentStats?.xp || 0;
    const newTotalXp = currentTotalXp + xpEarned;
    const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;

    // Update user stats with XP
    await db.run(
      `INSERT INTO user_stats (user_id, xp, level, total_games, wins, losses, win_streak, best_streak, total_play_time, rank, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, 0, 'Novice', datetime('now'))
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         xp = ?,
         level = ?,
         total_games = total_games + 1,
         wins = wins + ?,
         losses = losses + ?,
         win_streak = CASE 
           WHEN ? = 'player' THEN win_streak + 1 
           ELSE 0 
         END,
         best_streak = CASE 
           WHEN ? = 'player' AND win_streak + 1 > best_streak THEN win_streak + 1 
           ELSE best_streak 
         END,
         updated_at = datetime('now')`,
      [
        userId, newTotalXp, newLevel,
        winner === 'player' ? 1 : 0, winner === 'opponent' ? 1 : 0,
        winner === 'player' ? 1 : 0, winner === 'player' ? 1 : 0,
        newTotalXp, newLevel,
        winner === 'player' ? 1 : 0, winner === 'opponent' ? 1 : 0,
        winner, winner
      ]
    );

    const updatedStats = await db.get(
      `SELECT xp, level FROM user_stats WHERE user_id = ?`,
      [userId]
    );

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
    const history = await db.all(
      `SELECT mode, score, opponent_score, winner, created_at
       FROM pong_matches
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    console.log(`[PONG] Found ${history.length} matches for user ${userId}`);
    return reply.send({ history });
  });
}
