// src/db/repositories/UserRepository.ts
import { Knex } from 'knex';
import { getDb } from '../db/index.js';
import { User, UserStats } from '../types/database.js';

export class UserRepository {
  private db: Knex | null = null;

  private getDb(): Knex {
    if (!this.db) {
      this.db = getDb();
    }
    return this.db;
  }

  // Create a new user and their initial stats within a transaction
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const db = this.getDb();
    let createdUser: User | null = null;

    await db.transaction(async (trx) => {
      // 1. Insert the new user and get the ID.
      // For sqlite3, the insert method returns an array with the new ID.
      const [newUserId] = await trx('users').insert(userData);

      if (!newUserId) {
        throw new Error("User creation failed, no ID returned.");
      }

      // 2. Create the initial user stats record using the new ID.
      await trx('user_stats').insert({
        user_id: newUserId,
        total_games: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        best_streak: 0,
        total_play_time: 0,
        rank: 'Novice',
        level: 1,
        xp: 0
      });

      // 3. Fetch the complete user object to return it.
      createdUser = await trx('users').where('id', newUserId).first();
    });

    if (!createdUser) {
      // This should ideally not happen if the transaction was successful.
      throw new Error("Failed to retrieve created user after transaction.");
    }

    return createdUser;
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    const user = await this.getDb()('users').where('id', id).first();
    return user || null;
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.getDb()('users').where('username', username).first();
    return user || null;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.getDb()('users').where('email', email).first();
    return user || null;
  }

  // Find all users
  async findAll(): Promise<User[]> {
    return await this.getDb()('users').select('*');
  }

  // Find user by ID with stats
  async findByIdWithStats(id: number): Promise<(User & { stats: UserStats }) | null> {
    const result = await this.getDb()('users')
      .leftJoin('user_stats', 'users.id', 'user_stats.user_id')
      .select(
        'users.*',
        'user_stats.id as stats_id',
        'user_stats.total_games',
        'user_stats.wins',
        'user_stats.losses',
        'user_stats.win_streak',
        'user_stats.best_streak',
        'user_stats.total_play_time',
        'user_stats.rank',
        'user_stats.level',
        'user_stats.xp',
        'user_stats.created_at as stats_created_at',
        'user_stats.updated_at as stats_updated_at'
      )
      .where('users.id', id)
      .first();

    if (!result) return null;

    const { 
      stats_id, total_games, wins, losses, win_streak, best_streak, 
      total_play_time, rank, level, xp, stats_created_at, stats_updated_at, 
      ...user 
    } = result;
    
    return {
      ...user,
      stats: {
        id: stats_id,
        user_id: id,
        total_games: total_games || 0,
        wins: wins || 0,
        losses: losses || 0,
        win_streak: win_streak || 0,
        best_streak: best_streak || 0,
        total_play_time: total_play_time || 0,
        rank: rank || 'Novice',
        level: level || 1,
        xp: xp || 0,
        created_at: stats_created_at,
        updated_at: stats_updated_at
      }
    };
  }

  // Update user
  async update(id: number, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
    const [updatedUser] = await this.getDb()('users')
      .where('id', id)
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return updatedUser || null;
  }

  // Update user stats
  async updateStats(userId: number, statsData: Partial<Omit<UserStats, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserStats | null> {
    const [updatedStats] = await this.getDb()('user_stats')
      .where('user_id', userId)
      .update({
        ...statsData,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return updatedStats || null;
  }

  // Delete user (cascade will handle related records)
  async delete(id: number): Promise<boolean> {
    const deletedCount = await this.getDb()('users').where('id', id).del();
    return deletedCount > 0;
  }

  // Get user leaderboard
  async getLeaderboard(limit: number = 10): Promise<(User & { stats: UserStats })[]> {
    const leaderboardData = await this.getDb()('users')
      .leftJoin('user_stats', 'users.id', 'user_stats.user_id')
      .select(
        'users.*',
        'user_stats.id as stats_id',
        'user_stats.total_games',
        'user_stats.wins',
        'user_stats.losses',
        'user_stats.win_streak',
        'user_stats.best_streak',
        'user_stats.total_play_time',
        'user_stats.rank',
        'user_stats.level',
        'user_stats.xp',
        'user_stats.created_at as stats_created_at',
        'user_stats.updated_at as stats_updated_at'
      )
      .orderBy('user_stats.xp', 'desc')
      .orderBy('user_stats.level', 'desc')
      .limit(limit);

    return leaderboardData.map(player => {
      const {
        stats_id, total_games, wins, losses, win_streak, best_streak,
        total_play_time, rank, level, xp, stats_created_at, stats_updated_at,
        ...user
      } = player;
      return {
        ...user,
        stats: {
          id: stats_id,
          user_id: user.id,
          total_games: total_games || 0,
          wins: wins || 0,
          losses: losses || 0,
          win_streak: win_streak || 0,
          best_streak: best_streak || 0,
          total_play_time: total_play_time || 0,
          rank: rank || 'Novice',
          level: level || 1,
          xp: xp || 0,
          created_at: stats_created_at,
          updated_at: stats_updated_at
        }
      };
    });
  }

  // Search users by username
  async searchByUsername(username: string, limit: number = 10): Promise<User[]> {
    return await this.getDb()('users')
      .where('username', 'like', `%${username}%`)
      .limit(limit);
  }

  // Get online users
  async getOnlineUsers(): Promise<User[]> {
    return await this.getDb()('users')
      .where('status', 'online')
      .select('*');
  }

  // Update user status
  async updateStatus(id: number, status: User['status']): Promise<boolean> {
    const updatedCount = await this.getDb()('users')
      .where('id', id)
      .update({
        status,
        updated_at: new Date().toISOString()
      });
    
    return updatedCount > 0;
  }

  // Get user count
  async getCount(): Promise<number> {
    const result = await this.getDb()('users').count('* as count').first();
    return result ? Number(result.count) : 0;
  }

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }
}

let userRepositoryInstance: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}

export default getUserRepository();