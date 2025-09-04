// Manual migration script for bracket system
// This will apply the migration directly to the database

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the knex config
const knexConfigPath = path.resolve(__dirname, 'knexfile.cjs');
const knexConfigModule = await import(knexConfigPath);
const knexConfig = knexConfigModule.default || knexConfigModule;

const environment = process.env.NODE_ENV || 'development';
const dbConfig = knexConfig[environment];

async function applyMigration() {
  console.log('🔧 Applying manual migration for bracket system...');
  
  const db = knex(dbConfig);
  
  try {
    // Check if the migration has already been applied
    const migrationExists = await db.schema.hasColumn('tournaments', 'bracket_type');
    
    if (migrationExists) {
      console.log('✅ Migration already applied');
      return;
    }
    
    console.log('📝 Adding bracket system fields to tournaments table...');
    
    // Add bracket system fields to tournaments table
    await db.schema.alterTable('tournaments', (table) => {
      table.enum('bracket_type', ['single_elimination', 'double_elimination', 'swiss']).defaultTo('single_elimination');
      table.enum('seeding_method', ['random', 'ranked', 'manual']).defaultTo('random');
      table.integer('total_rounds').defaultTo(1);
      table.json('bracket_config').nullable();
    });
    
    console.log('📝 Adding bracket system fields to matches table...');
    
    // Add bracket system fields to matches table
    await db.schema.alterTable('matches', (table) => {
      table.enum('bracket_type', ['winners', 'losers', 'final']).defaultTo('winners');
      table.integer('winner_advances_to').nullable();
      table.integer('loser_advances_to').nullable();
      table.integer('round').defaultTo(1);
      table.integer('match_number').defaultTo(1);
      table.boolean('is_bye').defaultTo(false);
    });
    
    console.log('📝 Adding indexes for better performance...');
    
    // Add indexes for better performance
    await db.schema.alterTable('matches', (table) => {
      table.index(['tournament_id', 'round']);
      table.index(['tournament_id', 'bracket_type']);
      table.index(['winner_advances_to']);
      table.index(['loser_advances_to']);
    });
    
    console.log('✅ Migration applied successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run the migration
applyMigration().catch(console.error);





