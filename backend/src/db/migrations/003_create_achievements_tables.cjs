exports.up = async function(knex) {
  // Create achievements table with basic schema first
  await knex.schema.createTableIfNotExists('achievements', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.string('icon').notNullable();
    table.string('requirement_type').notNullable();
    table.integer('requirement_value').notNullable();
    table.timestamps(true, true);
    // Indexes
    table.index(['requirement_type']);
  });

  // Add missing columns if they don't exist
  const hasXpReward = await knex.schema.hasColumn('achievements', 'xp_reward');
  if (!hasXpReward) {
    await knex.schema.alterTable('achievements', (table) => {
      table.integer('xp_reward').defaultTo(0);
    });
  }

  const hasIsHidden = await knex.schema.hasColumn('achievements', 'is_hidden');
  if (!hasIsHidden) {
    await knex.schema.alterTable('achievements', (table) => {
      table.boolean('is_hidden').defaultTo(false);
    });
    // Add index for is_hidden column
    await knex.schema.alterTable('achievements', (table) => {
      table.index(['is_hidden']);
    });
  }

  // Create user_achievements table
  await knex.schema.createTableIfNotExists('user_achievements', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('achievement_id').unsigned().notNullable();
    table.integer('progress').defaultTo(0);
    table.timestamp('unlocked_at').nullable();
    table.timestamps(true, true);
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('achievement_id').references('id').inTable('achievements').onDelete('CASCADE');
    // Unique constraint
    table.unique(['user_id', 'achievement_id']);
    // Indexes
    table.index(['user_id']);
    table.index(['achievement_id']);
    table.index(['unlocked_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
}; 