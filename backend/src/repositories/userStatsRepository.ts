// src/repositories/userStatsRepository.ts
import { Knex } from 'knex';
import { getDb } from '../db/index.js';

export interface UserStats {
  id?: number;
  user_id: number;
  total_games: number;
  wins: number;
  losses: number;
  win_streak: number;
  best_streak: number;
  total_play_time: number; // in minutes
  rank: string;
  level: number;
  xp: number;
  updated_at?: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement_type: string; // 'games_played', 'win_streak', 'play_time', etc.
  requirement_value: number;
  created_at?: string;
}

export interface UserAchievement {
  id?: number;
  user_id: number;
  achievement_id: number;
  unlocked_at?: string;
  progress?: number;
}

export class UserStatsRepository {
  private db: Knex | null = null;

  public getDb(): Knex {
    if (!this.db) {
      this.db = getDb();
    }
    return this.db;
  }

  async findByUserId(userId: number): Promise<UserStats | undefined> {
    const row = await this.getDb()('user_stats')
      .where('user_id', userId)
      .first();
    
    // DEBUG (findByUserId) raw row: (use logger if available)
    if (!row) return undefined;
    
    const stats: UserStats = {
      id: row.id,
      user_id: row.user_id,
      total_games: row.total_games,
      wins: row.wins,
      losses: row.losses,
      win_streak: row.win_streak,
      best_streak: row.best_streak,
      total_play_time: row.total_play_time,
      rank: row.rank,
      level: row.level,
      xp: row.xp,
      updated_at: row.updated_at
    };
    // DEBUG (findByUserId) returned stats: (use logger if available)
    return stats;
  }

  async createOrUpdate(stats: UserStats): Promise<UserStats> {
    const existing = await this.findByUserId(stats.user_id);
    
    if (existing) {
      const [updatedStats] = await this.getDb()('user_stats')
        .where('user_id', stats.user_id)
        .update({
          total_games: stats.total_games,
          wins: stats.wins,
          losses: stats.losses,
          win_streak: stats.win_streak,
          best_streak: stats.best_streak,
          total_play_time: stats.total_play_time,
          rank: stats.rank,
          level: stats.level,
          xp: stats.xp,
          updated_at: new Date().toISOString()
        })
        .returning('*');
      
      return { ...stats, id: updatedStats.id };
    } else {
      const [newStats] = await this.getDb()('user_stats')
        .insert({
          user_id: stats.user_id,
          total_games: stats.total_games,
          wins: stats.wins,
          losses: stats.losses,
          win_streak: stats.win_streak,
          best_streak: stats.best_streak,
          total_play_time: stats.total_play_time,
          rank: stats.rank,
          level: stats.level,
          xp: stats.xp
        })
        .returning('*');
      
      return { ...stats, id: newStats.id };
    }
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await this.getDb()('achievements')
      .select('*')
      .orderBy('id');
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await this.getDb()('user_achievements')
      .select(
        'user_achievements.*',
        'achievements.name',
        'achievements.description',
        'achievements.icon',
        'achievements.requirement_type',
        'achievements.requirement_value'
      )
      .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
      .where('user_achievements.user_id', userId);
  }

  async updateGameStats(userId: number, won: boolean, gameDuration: number): Promise<void> {
    const stats = await this.findByUserId(userId);
    
    if (!stats) {
      // Create initial stats without XP (XP is handled by game routes)
      const newStats: UserStats = {
        user_id: userId,
        total_games: 1,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        win_streak: won ? 1 : 0,
        best_streak: won ? 1 : 0,
        total_play_time: Math.round(gameDuration / 60), // convert to minutes
        rank: 'Novice',
        level: 1,
        xp: 0  // XP is handled by game routes
      };
      await this.createOrUpdate(newStats);
    } else {
      const updatedStats: UserStats = {
        ...stats,
        total_games: stats.total_games + 1,
        wins: stats.wins + (won ? 1 : 0),
        losses: stats.losses + (won ? 0 : 1),
        win_streak: won ? stats.win_streak + 1 : 0,
        best_streak: won ? Math.max(stats.best_streak, stats.win_streak + 1) : stats.best_streak,
        total_play_time: stats.total_play_time + Math.round(gameDuration / 60)
        // XP and level are handled by game routes
      };
      
      // Calculate rank based on level and wins (level is set by game routes)
      updatedStats.rank = this.calculateRank(updatedStats.level, updatedStats.wins);
      
      await this.createOrUpdate(updatedStats);
    }
  }

  private calculateRank(level: number, wins: number): string {
    if (level >= 20 && wins >= 100) return 'Legend';
    if (level >= 15 && wins >= 50) return 'Master';
    if (level >= 10 && wins >= 25) return 'Elite';
    if (level >= 5 && wins >= 10) return 'Pro';
    if (level >= 3 && wins >= 5) return 'Amateur';
    return 'Novice';
  }

  async processGameResult(
    userId: number,
    result: { isWin: boolean; duration: number; xpEarned: number; isPerfectGame?: boolean }
  ): Promise<{ updatedStats: UserStats, newAchievements: Achievement[] }> {
    const db = this.getDb();

    return db.transaction(async (trx) => {
      // 1. Get current stats (we know it exists since it's created during user registration)
      const currentStats = await trx('user_stats').where('user_id', userId).first();
      
      if (!currentStats) {
        throw new Error(`User stats not found for user ${userId}. This should not happen if stats are created during registration.`);
      }

      // 2. Calculate new values
      const newWinStreak = result.isWin ? currentStats.win_streak + 1 : 0;
      const newBestStreak = Math.max(currentStats.best_streak, newWinStreak);
      const newTotalGames = currentStats.total_games + 1;
      const newWins = currentStats.wins + (result.isWin ? 1 : 0);
      const newLosses = currentStats.losses + (result.isWin ? 0 : 1);
      const newTotalPlayTime = currentStats.total_play_time + result.duration;
      const newXp = currentStats.xp + result.xpEarned;
      
      // 3. Calculate level and rank
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      const newRank = this.calculateRank(newLevel, newWins);

      // 4. Update stats with explicit UPDATE query
      await trx('user_stats')
        .where('user_id', userId)
        .update({
          total_games: newTotalGames,
          wins: newWins,
          losses: newLosses,
          win_streak: newWinStreak,
          best_streak: newBestStreak,
          total_play_time: newTotalPlayTime,
          xp: newXp,
          level: newLevel,
          rank: newRank,
          updated_at: new Date().toISOString()
        });
      
      // 5. Get the updated stats
      const updatedStats = await trx('user_stats').where('user_id', userId).first();

      // 6. Check for achievements based on the new stats
      const newAchievements = await this.checkAndUnlockAchievements(userId, trx);
      
      // 7. Handle specific, event-based achievements
      if (result.isPerfectGame) {
        const perfectGameAchievement = await trx('achievements').where({ requirement_type: 'perfect_game', id: 5 }).first();
        if (perfectGameAchievement) {
          const isUnlocked = await trx('user_achievements').where({ user_id: userId, achievement_id: perfectGameAchievement.id }).first();
          if (!isUnlocked) {
            await trx('user_achievements').insert({ user_id: userId, achievement_id: perfectGameAchievement.id, unlocked_at: new Date().toISOString() });
            newAchievements.push(perfectGameAchievement);
          }
        }
      }

      return { updatedStats, newAchievements };
    });
  }

  async checkAndUnlockAchievements(userId: number, trx: Knex.Transaction): Promise<Achievement[]> {
    const stats = await trx('user_stats').where('user_id', userId).first();
    if (!stats) return [];

    const allAchievements = await trx('achievements').select('*');
    const userAchievements = await trx('user_achievements').where('user_id', userId);
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
    //   const userAch = userAchievements.find(ua => ua.achievement_id === achievement.id);
      let progress = 0;
      switch (achievement.requirement_type) {
        case 'first_win':
          progress = stats.wins;
          break;
        case 'games_played':
          progress = stats.total_games;
          break;
        case 'win_streak':
          progress = stats.best_streak;
          break;
        case 'play_time':
          progress = stats.total_play_time;
          break;
        case 'level_reached':
          // This refers to the Arkanoid game level, not the player's overall level.
          // You may want to track this separately if needed.
          progress = 0;
          break;
        case 'perfect_game':
          // This requires specific data from a game result (e.g., opponent score was 0).
          // It cannot be checked from general stats alone.
          progress = 0;
          break;
      }

      // Upsert progress for this achievement
      await trx('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          progress
        })
        .onConflict(['user_id', 'achievement_id'])
        .merge({ progress });

      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      switch (achievement.requirement_type) {
        case 'first_win':
          shouldUnlock = stats.wins >= achievement.requirement_value;
          break;
        case 'games_played':
          shouldUnlock = stats.total_games >= achievement.requirement_value;
          break;
        case 'win_streak':
          shouldUnlock = stats.best_streak >= achievement.requirement_value;
          break;
        case 'play_time':
          shouldUnlock = stats.total_play_time >= achievement.requirement_value;
          break;
        case 'level_reached':
          // This refers to the Arkanoid game level, not the player's overall level.
          // This type of achievement must be checked and awarded from the arkanoid route specifically.
          break;
        case 'perfect_game':
          // This requires specific data from a game result (e.g., opponent score was 0).
          // It cannot be checked from general stats alone. We'll address this in Step 2.
          break;
      }

      if (shouldUnlock) {
        await trx('user_achievements')
          .where({ user_id: userId, achievement_id: achievement.id })
          .update({ unlocked_at: new Date().toISOString() });
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  async checkAndUnlockAchievementsStandalone(userId: number): Promise<Achievement[]> {
    const db = this.getDb();
    return db.transaction(trx => this.checkAndUnlockAchievements(userId, trx));
  }
}

let userStatsRepositoryInstance: UserStatsRepository | null = null;

export function getUserStatsRepository(): UserStatsRepository {
  if (!userStatsRepositoryInstance) {
    userStatsRepositoryInstance = new UserStatsRepository();
  }
  return userStatsRepositoryInstance;
}

export default getUserStatsRepository();