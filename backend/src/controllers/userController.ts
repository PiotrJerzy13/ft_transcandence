import type { FastifyRequest, FastifyReply } from 'fastify';
import userStatsRepository from '../repositories/userStatsRepository.js';

class UserController {
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      request.log.info('Authenticated as user', request.user);

      if (!request.user) {
        console.log('No user in request');
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const userId = request.user.id;
      console.log('Fetching stats for user ID:', userId);

      // Get user stats
      let stats = await userStatsRepository.findByUserId(userId);
      
      if (!stats) {
        console.log('Creating initial stats for user:', userId);
        // Create initial stats if they don't exist
        stats = {
          user_id: userId,
          total_games: 0,
          wins: 0,
          losses: 0,
          win_streak: 0,
          best_streak: 0,
          total_play_time: 0,
          rank: 'Novice',
          level: 1,
          xp: 0
        };
        await userStatsRepository.createOrUpdate(stats);
      }

      // Get achievements
      const allAchievements = await userStatsRepository.getAllAchievements();
      const userAchievements = await userStatsRepository.getUserAchievements(userId);
      const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

      // Format achievements for frontend
      const achievements = allAchievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: unlockedIds.has(achievement.id),
        date: userAchievements.find(ua => ua.achievement_id === achievement.id)?.unlocked_at,
        progress: userAchievements.find(ua => ua.achievement_id === achievement.id)?.progress || 0,

        maxProgress: achievement.requirement_value
      }));

      // Format stats for frontend
      const formattedStats = {
        totalGames: stats.total_games,
        wins: stats.wins,
        losses: stats.losses,
        winStreak: stats.win_streak,
        bestStreak: stats.best_streak,
        totalPlayTime: `${Math.floor(stats.total_play_time / 60)}h ${stats.total_play_time % 60}m`,
        rank: stats.rank,
        level: stats.level,
        xp: stats.xp,
        xpToNext: 1000 - (stats.xp % 1000)
      };

      console.log('Profile data prepared:', { stats: formattedStats, achievements: achievements.length });

      return reply.send({
        stats: formattedStats,
        achievements
      });

    } catch (error) {
      console.error('💥 Error in getProfile:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateGameResult(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🎮 Game result update for user:', request.user);
      
      if (!request.user) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const { won, duration } = request.body as { won: boolean; duration: number };
      const userId = request.user.id;

      console.log('Updating game stats:', { userId, won, duration });

      // Update game stats
      await userStatsRepository.updateGameStats(userId, won, duration);

      // Check for new achievements
      const newAchievements = await userStatsRepository.checkAndUnlockAchievements(userId);

      console.log(' New achievements unlocked:', newAchievements.length);

      return reply.send({
        success: true,
        message: 'Game result updated successfully',
        newAchievements
      });

    } catch (error) {
      console.error('Error in updateGameResult:', error);
      return reply.status(500).send({ 
        error: 'Failed to update game result',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new UserController();