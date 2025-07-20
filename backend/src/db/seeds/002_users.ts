import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('users').del();

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Insert admin user
  const [adminUser] = await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hashedPassword,
      status: 'online',
      created_at: new Date().toISOString()
    }
  ]).returning('id');

  // Create user stats for admin
  await knex('user_stats').insert([
    {
      user_id: adminUser.id,
      total_games: 0,
      wins: 0,
      losses: 0,
      win_streak: 0,
      best_streak: 0,
      total_play_time: 0,
      rank: 'Novice',
      level: 1,
      xp: 0,
      updated_at: new Date().toISOString()
    }
  ]);

  console.log('Admin user created successfully');
} 