/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Matchmaking queue table
    .createTable('matchmaking_queue', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('game_type').notNullable().defaultTo('pong'); // pong, arkanoid, etc.
      table.integer('min_rating').defaultTo(0);
      table.integer('max_rating').defaultTo(9999);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at'); // Will be set programmatically to now + 5 minutes
      
      // Ensure one active queue entry per user per game type
      table.unique(['user_id', 'game_type', 'is_active']);
      table.index(['game_type', 'is_active', 'joined_at']);
    })
    
    // Game sessions table
    .createTable('game_sessions', (table) => {
      table.increments('id').primary();
      table.string('session_id').unique().notNullable(); // UUID for WebSocket rooms
      table.string('game_type').notNullable().defaultTo('pong');
      table.string('status').notNullable().defaultTo('waiting').checkIn(['waiting', 'active', 'completed', 'cancelled']);
      table.integer('player1_id').references('id').inTable('users').onDelete('SET NULL');
      table.integer('player2_id').references('id').inTable('users').onDelete('SET NULL');
      table.integer('winner_id').references('id').inTable('users').onDelete('SET NULL');
      table.integer('player1_score').defaultTo(0);
      table.integer('player2_score').defaultTo(0);
      table.integer('max_score').defaultTo(11); // First to 11 wins
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.json('game_state').defaultTo('{}'); // Store game state for resuming
      
      table.index(['session_id']);
      table.index(['status', 'created_at']);
      table.index(['player1_id', 'player2_id']);
    })
    
    // Game events table for tracking game actions
    .createTable('game_events', (table) => {
      table.increments('id').primary();
      table.integer('game_session_id').notNullable().references('id').inTable('game_sessions').onDelete('CASCADE');
      table.string('event_type').notNullable(); // ball_move, paddle_move, score, etc.
      table.integer('player_id').references('id').inTable('users').onDelete('SET NULL');
      table.json('event_data').defaultTo('{}'); // Event-specific data
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      
      table.index(['game_session_id', 'timestamp']);
      table.index(['event_type', 'timestamp']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('game_events')
    .dropTableIfExists('game_sessions')
    .dropTableIfExists('matchmaking_queue');
};
