import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/leaderboard', { preHandler: authenticate }, async (_req, reply) => {
    try {
      console.log('[LEADERBOARD] Fetching leaderboard data...');
      const db = getDb();
      
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      console.log('[LEADERBOARD] Total users in database:', userCount?.count);
      
      const statsCount = await db.get('SELECT COUNT(*) as count FROM user_stats');
      console.log('[LEADERBOARD] Total user stats in database:', statsCount?.count);
      
      const topPlayers = await db.all(`
        SELECT 
          u.id,
          u.username,
          us.level,
          us.rank,
          us.total_games,
          us.wins,
          us.losses,
          us.xp,
          us.best_streak,
          ROUND(CAST(us.wins AS FLOAT) / NULLIF(us.total_games, 0) * 100, 1) AS win_rate
        FROM users u
        JOIN user_stats us ON u.id = us.user_id
        ORDER BY us.level DESC, us.xp DESC
        LIMIT 10;
      `);
      
      console.log('[LEADERBOARD] Query result:', JSON.stringify(topPlayers, null, 2));
      
      if (!topPlayers || topPlayers.length === 0) {
        console.log('[LEADERBOARD] No players found in the leaderboard');
        return reply.send({ leaderboard: [] }); // ✅ add return
      }
      
      console.log('[LEADERBOARD] Sending leaderboard data with', topPlayers.length, 'players');
      return reply.send({ leaderboard: topPlayers }); // ✅ add return
    } catch (error) {
      console.error('[LEADERBOARD] Error fetching leaderboard:', error);
      return reply.status(500).send({ error: 'Failed to load leaderboard' }); // ✅ add return
    }
  });
}
