import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
// --- REMOVE getDb ---
// import { getDb } from '../db/index.js';

// --- IMPORT THE REPOSITORY ---
import userRepository from '../repositories/userRepository.js';

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/leaderboard', { preHandler: authenticate }, async (req, reply) => {
    try {
      req.log.info('[LEADERBOARD] Fetching top players from repository');

      // --- REPLACE THE ENTIRE DATABASE QUERY WITH THIS SINGLE LINE ---
      const topPlayersData = await userRepository.getLeaderboard(10); // Get top 10 players
      
      // The repository now returns the correct nested structure.
      // We just need to calculate the win rate for the final response.
      const playersWithWinRate = topPlayersData.map(player => {
        // Access stats from the nested 'stats' object
        const totalGames = (player.stats.wins || 0) + (player.stats.losses || 0);
        const winRate = totalGames > 0 ? ((player.stats.wins || 0) / totalGames) * 100 : 0;
        
        return {
          id: player.id,
          username: player.username,
          level: player.stats.level || 1,
          rank: player.stats.rank || 'Novice',
          xp: player.stats.xp || 0,
          win_rate: winRate,
          best_streak: player.stats.best_streak || 0
        };
      });

      req.log.info(`[LEADERBOARD] Returning ${playersWithWinRate.length} top players`);
      return reply.send({ leaderboard: playersWithWinRate }); // Send nested under 'leaderboard' key

    } catch (error) {
      req.log.error('[LEADERBOARD] Error:', error);
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });
}
