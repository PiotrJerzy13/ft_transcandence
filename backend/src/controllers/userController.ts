import type { FastifyRequest, FastifyReply } from 'fastify';
import userStatsRepository from '../repositories/userStatsRepository.js';

class UserController {
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      request.log.info('Authenticated user:', request.user);

      if (!request.user) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const userId = request.user.id;
      const stats = await this.ensureUserStats(userId);
      request.log.info('DEBUG: Raw stats from DB:', JSON.stringify(stats, null, 2));
      request.log.debug({ type: typeof stats.total_games }, 'Type of stats.total_games');
      request.log.debug({ keys: Object.keys(stats) }, 'Keys in stats');

      // Fetch user object (exclude password_hash)
      const userRecord = await userStatsRepository.getDb()('users').where('id', userId).first();
      if (!userRecord) {
        return reply.status(404).send({ error: 'User not found' });
      }
      const { password_hash, ...user } = userRecord;

      // Fetch achievements
      const allAchievements = await userStatsRepository.getAllAchievements();
      const userAchievements = await userStatsRepository.getUserAchievements(userId);

      const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

      const achievements = allAchievements.map(achievement => {
        const userEntry = userAchievements.find(ua => ua.achievement_id === achievement.id);

        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          unlocked: unlockedIds.has(achievement.id),
          date: userEntry?.unlocked_at || null,
          progress: userEntry?.progress ?? 0,
          maxProgress: achievement.requirement_value,
        };
      });

      const formattedStats = {
        totalGames: stats.total_games,
        wins: stats.wins,
        losses: stats.losses,
        winStreak: stats.win_streak,
        bestStreak: stats.best_streak,
        totalPlayTime: this.formatPlayTime(stats.total_play_time),
        rank: stats.rank,
        level: stats.level,
        xp: stats.xp,
        xpToNext: 1000 - (stats.xp % 1000),
      };
      request.log.info('DEBUG: Formatted stats:', JSON.stringify(formattedStats, null, 2));

      request.log.info('📊 Profile data prepared', {
        stats: formattedStats,
        achievements: achievements.length,
      });

      // Include user in the response
      return reply.send({ user, stats: formattedStats, achievements });

    } catch (error) {
      request.log.error({ err: error }, 'Error in getProfile');
      return reply.status(500).send({ 
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateGameResult(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const { won, duration } = request.body as { won: boolean; duration: number };
      const userId = request.user.id;

      if (typeof won !== 'boolean' || typeof duration !== 'number') {
        return reply.status(400).send({ error: 'Invalid input data' });
      }

      await userStatsRepository.updateGameStats(userId, won, duration);

      const newAchievements = await userStatsRepository.checkAndUnlockAchievementsStandalone(userId);

      request.log.info('🏆 Game updated, new achievements unlocked:', newAchievements.length);

      return reply.send({
        success: true,
        message: 'Game result updated successfully',
        newAchievements
      });

    } catch (error) {
      request.log.error({ err: error }, 'Error in updateGameResult');
      return reply.status(500).send({ 
        error: 'Failed to update game result',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async ensureUserStats(userId: number) {
    let stats = await userStatsRepository.findByUserId(userId);
    if (!stats) {
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
        xp: 0,
      };
      await userStatsRepository.createOrUpdate(stats);
    }
    return stats;
  }

  private formatPlayTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
}

// export default new UserController();
const userController = new UserController();

export default {
  getProfile: userController.getProfile.bind(userController),
  updateGameResult: userController.updateGameResult.bind(userController),
};
