// src/db/seeds/001_achievements.ts
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('achievements').del();

  // Insert default achievements
  await knex('achievements').insert([
    {
      id: 1,
      name: 'First Victory',
      description: 'Win your first game',
      icon: 'Trophy',
      requirement_type: 'first_win',
      requirement_value: 1,
      xp_reward: 100,
      is_hidden: false
    },
    {
      id: 2,
      name: 'Speed Demon',
      description: 'Win a game in under 2 minutes',
      icon: 'Zap',
      requirement_type: 'game_duration',
      requirement_value: 120,
      xp_reward: 150,
      is_hidden: false
    },
    {
      id: 3,
      name: 'Unstoppable',
      description: 'Achieve a 5-game win streak',
      icon: 'Target',
      requirement_type: 'win_streak',
      requirement_value: 5,
      xp_reward: 250,
      is_hidden: false
    },
    {
      id: 4,
      name: 'Century Club',
      description: 'Play 100 games',
      icon: 'Star',
      requirement_type: 'games_played',
      requirement_value: 100,
      xp_reward: 500,
      is_hidden: false
    },
    {
      id: 5,
      name: 'Perfect Game',
      description: 'Win without opponent scoring',
      icon: 'Crown',
      requirement_type: 'perfect_game',
      requirement_value: 1,
      xp_reward: 200,
      is_hidden: false
    },
    {
      id: 6,
      name: 'Marathon Runner',
      description: 'Play for 10 hours total',
      icon: 'Clock',
      requirement_type: 'play_time',
      requirement_value: 36000, // 10 hours in seconds
      xp_reward: 300,
      is_hidden: false
    },
    {
      id: 7,
      name: 'High Scorer',
      description: 'Score 10,000 points in Arkanoid',
      icon: 'Gamepad2',
      requirement_type: 'score_threshold',
      requirement_value: 10000,
      xp_reward: 400,
      is_hidden: false
    },
    {
      id: 8,
      name: 'Level Master',
      description: 'Reach level 20 in Arkanoid',
      icon: 'Mountain',
      requirement_type: 'level_reached',
      requirement_value: 20,
      xp_reward: 600,
      is_hidden: false
    },
    {
      id: 9,
      name: 'Dedication',
      description: 'Play 1000 games total',
      icon: 'Award',
      requirement_type: 'games_played',
      requirement_value: 1000,
      xp_reward: 1000,
      is_hidden: true
    },
    {
      id: 10,
      name: 'Legend',
      description: 'Achieve a 25-game win streak',
      icon: 'Flame',
      requirement_type: 'win_streak',
      requirement_value: 25,
      xp_reward: 1500,
      is_hidden: true
    }
  ]);
}