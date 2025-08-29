exports.up = async function(knex) {
  // Add bracket system fields to tournaments table
  await knex.schema.alterTable('tournaments', (table) => {
    table.enum('bracket_type', ['single_elimination', 'double_elimination', 'swiss']).defaultTo('single_elimination');
    table.enum('seeding_method', ['random', 'ranked', 'manual']).defaultTo('random');
    table.integer('total_rounds').defaultTo(1);
    table.json('bracket_config').nullable(); // Store bracket-specific configuration
  });

  // Add bracket system fields to matches table
  await knex.schema.alterTable('matches', (table) => {
    table.enum('bracket_type', ['winners', 'losers', 'final']).defaultTo('winners');
    table.integer('winner_advances_to').nullable(); // Next match number for winner
    table.integer('loser_advances_to').nullable(); // Next match number for loser (double elimination)
    table.integer('round').defaultTo(1); // Tournament round number
    table.integer('match_number').defaultTo(1); // Match number within the round
    table.boolean('is_bye').defaultTo(false); // Indicates if this is a bye match
  });

  // Add indexes for better performance
  await knex.schema.alterTable('matches', (table) => {
    table.index(['tournament_id', 'round']);
    table.index(['tournament_id', 'bracket_type']);
    table.index(['winner_advances_to']);
    table.index(['loser_advances_to']);
  });
};

exports.down = async function(knex) {
  // Remove indexes
  await knex.schema.alterTable('matches', (table) => {
    table.dropIndex(['tournament_id', 'round']);
    table.dropIndex(['tournament_id', 'bracket_type']);
    table.dropIndex(['winner_advances_to']);
    table.dropIndex(['loser_advances_to']);
  });

  // Remove bracket fields from matches table
  await knex.schema.alterTable('matches', (table) => {
    table.dropColumn('bracket_type');
    table.dropColumn('winner_advances_to');
    table.dropColumn('loser_advances_to');
    table.dropColumn('round');
    table.dropColumn('match_number');
    table.dropColumn('is_bye');
  });

  // Remove bracket fields from tournaments table
  await knex.schema.alterTable('tournaments', (table) => {
    table.dropColumn('bracket_type');
    table.dropColumn('seeding_method');
    table.dropColumn('total_rounds');
    table.dropColumn('bracket_config');
  });
};
