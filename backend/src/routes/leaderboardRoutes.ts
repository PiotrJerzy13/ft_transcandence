import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';


// --- IMPORT THE REPOSITORY ---
import userRepository from '../repositories/userRepository.js';

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/leaderboard', { preHandler: authenticate }, async (req, reply) => {
    try {
      req.log.info('[LEADERBOARD] Fetching top players from repository');


      const topPlayersData = await userRepository.getLeaderboard(10); // Get top 10 players
      
      const playersWithWinRate = topPlayersData.map(player => {
        // Access stats from the nested 'stats' object
        const totalGames = (player.stats.wins || 0) + (player.stats.losses || 0);
        const winRate = totalGames > 0 ? ((player.stats.wins || 0) / totalGames) * 100 : 0;
        
        return {
          id: player.id,
          username: player.username,
          level: player.stats.level || 1,
          rank: player.stats.rank || 'Novice',
          totalGames: totalGames,
          wins: player.stats.wins || 0,
          losses: player.stats.losses || 0,
          xp: player.stats.xp || 0,
          winRate: winRate, // Changed from win_rate to winRate
          bestStreak: player.stats.best_streak || 0 // Changed from best_streak to bestStreak
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