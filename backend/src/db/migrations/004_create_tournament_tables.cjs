exports.up = async function(knex) {
  // Create tournaments table
  await knex.schema.createTableIfNotExists('tournaments', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.timestamp('start_date').nullable();
    table.timestamp('end_date').nullable();
    table.enum('status', ['pending', 'active', 'completed']).defaultTo('pending');
    table.integer('created_by').unsigned().nullable();
    table.timestamps(true, true);
    // Foreign key
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    // Indexes
    table.index(['status']);
    table.index(['start_date']);
  });

  // Create tournament_participants table
  await knex.schema.createTableIfNotExists('tournament_participants', (table) => {
    table.increments('id').primary();
    table.integer('tournament_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    // Foreign keys
    table.foreign('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    // Unique constraint
    table.unique(['tournament_id', 'user_id']);
    // Indexes
    table.index(['tournament_id']);
    table.index(['user_id']);
  });

  // Create matches table
  await knex.schema.createTableIfNotExists('matches', (table) => {
    table.increments('id').primary();
    table.integer('tournament_id').unsigned().nullable();
    table.integer('player1_id').unsigned().notNullable();
    table.integer('player2_id').unsigned().notNullable();
    table.integer('player1_score').defaultTo(0);
    table.integer('player2_score').defaultTo(0);
    table.enum('status', ['pending', 'active', 'completed']).defaultTo('pending');
    table.integer('duration').defaultTo(0); // in seconds
    table.timestamp('played_at').nullable();
    table.timestamps(true, true);
    // Foreign keys
    table.foreign('tournament_id').references('id').inTable('tournaments').onDelete('SET NULL');
    table.foreign('player1_id').references('id').inTable('users');
    table.foreign('player2_id').references('id').inTable('users');
    // Indexes
    table.index(['tournament_id']);
    table.index(['player1_id']);
    table.index(['player2_id']);
    table.index(['status']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('tournament_participants');
  await knex.schema.dropTableIfExists('tournaments');
}; 