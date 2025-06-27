import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/leaderboard', { preHandler: authenticate }, async (_req, reply) => {
    try {
      const db = getDb();
      
      // Get counts for debugging
      const userCount = await db('users').count('* as count').first();
      const statsCount = await db('user_stats').count('* as count').first();
      
      console.log('[LEADERBOARD] Total users in database:', userCount?.count);
      console.log('[LEADERBOARD] Total user stats in database:', statsCount?.count);
      
      // Get top players with their stats
      const topPlayers = await db('users')
        .select(
          'users.id',
          'users.username',
          'user_stats.level',
          'user_stats.rank',
          'user_stats.xp',
          'user_stats.wins',
          'user_stats.losses',
          'user_stats.best_streak'
        )
        .leftJoin('user_stats', 'users.id', 'user_stats.user_id')
        .orderBy('user_stats.xp', 'desc')
        .orderBy('user_stats.level', 'desc')
        .limit(10);

      // Calculate win rates
      const playersWithWinRate = topPlayers.map(player => {
        const totalGames = (player.wins || 0) + (player.losses || 0);
        const winRate = totalGames > 0 ? ((player.wins || 0) / totalGames) * 100 : 0;
        
        return {
          id: player.id,
          username: player.username,
          level: player.level || 1,
          rank: player.rank || 'Novice',
          xp: player.xp || 0,
          win_rate: winRate,
          best_streak: player.best_streak || 0
        };
      });

      console.log('[LEADERBOARD] Returning top players:', playersWithWinRate.length);
      return reply.send(playersWithWinRate);
    } catch (error) {
      console.error('[LEADERBOARD] Error:', error);
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });
}
