exports.up = async function(knex) {
  // Create pong_matches table (for single player and detailed tracking)
  await knex.schema.createTableIfNotExists('pong_matches', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.enum('mode', ['one-player', 'two-player']).notNullable();
    table.integer('score').notNullable();
    table.integer('opponent_score').notNullable();
    table.enum('winner', ['player', 'opponent']).notNullable();
    table.integer('xp_earned').defaultTo(0);
    table.integer('total_xp').defaultTo(0);
    table.integer('duration').defaultTo(0); // in seconds
    table.timestamps(true, true);
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    // Indexes
    table.index(['user_id']);
    table.index(['mode']);
    table.index(['winner']);
    table.index(['created_at']);
  });

  // Create arkanoid_scores table
  await knex.schema.createTableIfNotExists('arkanoid_scores', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('score').notNullable();
    table.integer('xp_earned').defaultTo(0);
    table.integer('level_reached').notNullable();
    table.integer('blocks_destroyed').defaultTo(0);
    table.integer('power_ups_collected').defaultTo(0);
    table.integer('duration').defaultTo(0); // in seconds
    table.timestamps(true, true);
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    // Indexes
    table.index(['user_id']);
    table.index(['score']);
    table.index(['level_reached']);
    table.index(['created_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('arkanoid_scores');
  await knex.schema.dropTableIfExists('pong_matches');
}; 