// // src/controllers/userController.ts
// import { FastifyRequest, FastifyReply } from 'fastify';
// import userStatsRepository from '../repositories/userStatsRepository.js';
// import userRepository from '../repositories/userRepository.js';

// class UserController {
//   async getProfile(request: FastifyRequest, reply: FastifyReply) {
//     try {
//       console.log('👤 UserController.getProfile called');
//       console.log('🔍 Request.user:', request.user);
      
//       if (!request.user) {
//         console.log('❌ No user in request object');
//         return reply.status(401).send({ error: 'User not authenticated' });
//       }
      
//       console.log('✅ User authenticated:', request.user.id, request.user.username);

//       const user = await userRepository.findById(request.user.id);
//       if (!user) {
//         return reply.status(404).send({ error: 'User not found' });
//       }

//       // Get user stats
//       let stats = await userStatsRepository.findByUserId(request.user.id);
//       if (!stats) {
//         // Create initial stats for new user
//         stats = await userStatsRepository.createOrUpdate({
//           user_id: request.user.id,
//           total_games: 0,
//           wins: 0,
//           losses: 0,
//           win_streak: 0,
//           best_streak: 0,
//           total_play_time: 0,
//           rank: 'Novice',
//           level: 1,
//           xp: 0
//         });
//       }

//       // Get achievements
//       const achievements = await userStatsRepository.getAllAchievements();
//       const userAchievements = await userStatsRepository.getUserAchievements(request.user.id);
//       const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

//       const achievementsWithProgress = achievements.map(achievement => {
//         const isUnlocked = unlockedIds.has(achievement.id);
//         const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        
//         let progress = 0;
//         if (!isUnlocked) {
//           // Calculate progress based on requirement type
//           switch (achievement.requirement_type) {
//             case 'games_played':
//               progress = Math.min(stats!.total_games, achievement.requirement_value);
//               break;
//             case 'win_streak':
//               progress = Math.min(stats!.best_streak, achievement.requirement_value);
//               break;
//             case 'play_time':
//               progress = Math.min(stats!.total_play_time, achievement.requirement_value);
//               break;
//             case 'first_win':
//               progress = Math.min(stats!.wins, 1);
//               break;
//             default:
//               progress = 0;
//           }
//         }

//         return {
//           id: achievement.id,
//           name: achievement.name,
//           description: achievement.description,
//           icon: achievement.icon,
//           unlocked: isUnlocked,
//           progress,
//           maxProgress: achievement.requirement_value,
//           date: userAchievement?.unlocked_at || null
//         };
//       });

//       // Calculate XP to next level
//       const nextLevelXp = stats.level * 1000;
//       const xpToNext = nextLevelXp - stats.xp;

//       const profileData = {
//         user: {
//           id: user.id,
//           username: user.username,
//           email: user.email,
//           avatar_url: user.avatar_url,
//           status: user.status
//         },
//         stats: {
//           // Fixed property names to match frontend expectations
//           totalGames: stats.total_games,
//           wins: stats.wins,
//           losses: stats.losses,
//           winStreak: stats.win_streak,
//           bestStreak: stats.best_streak,
//           totalPlayTime: this.formatPlayTime(stats.total_play_time),
//           rank: stats.rank,
//           level: stats.level,
//           xp: stats.xp,
//           xpToNext: Math.max(0, xpToNext)
//         },
//         achievements: achievementsWithProgress
//       };

//       console.log('Sending profile data:', JSON.stringify(profileData, null, 2));
//       return reply.send(profileData);
//     } catch (error) {
//       console.error('Error getting user profile:', error);
//       return reply.status(500).send({ error: 'Internal server error' });
//     }
//   }

//   async updateGameResult(request: FastifyRequest, reply: FastifyReply) {
//     try {
//       if (!request.user) {
//         return reply.status(401).send({ error: 'User not authenticated' });
//       }

//       const { won, duration } = request.body as { won: boolean; duration: number };

//       // Update user stats
//       await userStatsRepository.updateGameStats(request.user.id, won, duration);

//       // Check for new achievements
//       const newAchievements = await userStatsRepository.checkAndUnlockAchievements(request.user.id);

//       return reply.send({
//         message: 'Game result updated successfully',
//         newAchievements: newAchievements.map(a => ({
//           name: a.name,
//           description: a.description,
//           icon: a.icon
//         }))
//       });
//     } catch (error) {
//       console.error('Error updating game result:', error);
//       return reply.status(500).send({ error: 'Internal server error' });
//     }
//   }

//   private formatPlayTime(minutes: number): string {
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return `${hours}h ${mins}m`;
//   }
// }

// export default new UserController();
// src/controllers/userController.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import userStatsRepository from '../repositories/userStatsRepository.js';

class UserController {
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      request.log.info('🔐 Authenticated as user', request.user);

      if (!request.user) {
        console.log('❌ No user in request');
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const userId = request.user.id;
      console.log('📊 Fetching stats for user ID:', userId);

      // Get user stats
      let stats = await userStatsRepository.findByUserId(userId);
      
      if (!stats) {
        console.log('📝 Creating initial stats for user:', userId);
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

      console.log('✅ Profile data prepared:', { stats: formattedStats, achievements: achievements.length });

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

      console.log('📊 Updating game stats:', { userId, won, duration });

      // Update game stats
      await userStatsRepository.updateGameStats(userId, won, duration);

      // Check for new achievements
      const newAchievements = await userStatsRepository.checkAndUnlockAchievements(userId);

      console.log('🏆 New achievements unlocked:', newAchievements.length);

      return reply.send({
        success: true,
        message: 'Game result updated successfully',
        newAchievements
      });

    } catch (error) {
      console.error('💥 Error in updateGameResult:', error);
      return reply.status(500).send({ 
        error: 'Failed to update game result',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new UserController();