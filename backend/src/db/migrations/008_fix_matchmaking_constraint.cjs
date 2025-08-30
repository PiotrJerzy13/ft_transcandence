/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('matchmaking_queue', (table) => {
    // Drop the problematic unique constraint
    table.dropUnique(['user_id', 'game_type', 'is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('matchmaking_queue', (table) => {
    // Re-add the constraint if needed to rollback
    table.unique(['user_id', 'game_type', 'is_active']);
  });
};
