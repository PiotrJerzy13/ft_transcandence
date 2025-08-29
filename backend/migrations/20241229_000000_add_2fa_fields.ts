import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    // 2FA fields
    table.string('two_factor_secret').nullable();
    table.boolean('two_factor_enabled').defaultTo(false);
    table.json('backup_codes').nullable(); // Array of backup codes
    table.timestamp('two_factor_setup_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('two_factor_secret');
    table.dropColumn('two_factor_enabled');
    table.dropColumn('backup_codes');
    table.dropColumn('two_factor_setup_at');
  });
}

