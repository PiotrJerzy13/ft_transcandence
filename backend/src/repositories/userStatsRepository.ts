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

  private getDb(): Knex {
    if (!this.db) {
      this.db = getDb();
    }
    return this.db;
  }

  async findByUserId(userId: number): Promise<UserStats | undefined> {
    const row = await this.getDb()('user_stats')
      .where('user_id', userId)
      .first();
    
    console.log("DEBUG (findByUserId) raw row:", row);
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
    console.log("DEBUG (findByUserId) returned stats:", stats);
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

  async checkAndUnlockAchievements(userId: number): Promise<Achievement[]> {
    const stats = await this.findByUserId(userId);
    if (!stats) return [];

    const achievements = await this.getAllAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      switch (achievement.requirement_type) {
        case 'first_win':
          shouldUnlock = stats.wins >= 1;
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
        case 'perfect_game':
          // This would need to be tracked separately in match results
          break;
      }

      if (shouldUnlock) {
        await this.getDb()('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
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