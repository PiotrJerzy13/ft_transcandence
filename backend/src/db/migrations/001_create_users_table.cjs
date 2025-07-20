exports.up = async function(knex) {
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
};

exports.down = async function(knex) {
  return knex.schema.dropTable('users');
}; 