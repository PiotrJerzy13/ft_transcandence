/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex('matchmaking_queue')
    .where('is_active', true)
    .update({ is_active: false });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // No rollback needed for cleanup
  return Promise.resolve();
};
