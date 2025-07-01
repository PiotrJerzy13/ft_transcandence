// src/db/migrations/002_create_user_stats_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists('user_stats', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique();
    table.integer('total_games').defaultTo(0);
    table.integer('wins').defaultTo(0);
    table.integer('losses').defaultTo(0);
    table.integer('win_streak').defaultTo(0);
    table.integer('best_streak').defaultTo(0);
    table.integer('total_play_time').defaultTo(0); // in seconds
    table.enum('rank', ['Novice', 'Amateur', 'Pro', 'Expert', 'Master']).defaultTo('Novice');
    table.integer('level').defaultTo(1);
    table.integer('xp').defaultTo(0);
    table.timestamps(true, true);
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['rank']);
    table.index(['level']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_stats');
}