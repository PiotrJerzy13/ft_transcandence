/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // In SQLite, simply skip this migration as it's a no-op
  // The constraint doesn't actually exist in the current schema
  console.log('Migration 008: Skipping (no-op for SQLite compatibility)');
  return Promise.resolve();
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







