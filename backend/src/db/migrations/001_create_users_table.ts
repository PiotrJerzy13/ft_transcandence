// src/db/migrations/001_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('avatar_url').nullable();
    table.enum('status', ['online', 'offline', 'in_game']).defaultTo('offline');
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes
    table.index(['username']);
    table.index(['email']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}