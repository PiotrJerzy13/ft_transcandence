// src/db/index.ts
import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Helper to get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import the CJS knexfile
const knexConfigPath = path.resolve(__dirname, '../../knexfile.cjs');
const knexConfigModule = await import(knexConfigPath);
const knexConfig = knexConfigModule.default || knexConfigModule;

const environment = process.env.NODE_ENV || 'development';
const dbConfig = knexConfig[environment as keyof typeof knexConfig];

// Ensure the directory for the SQLite database file exists
const dbDir = path.dirname(dbConfig.connection.filename);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Knex | null = null;

export async function initializeDatabase(): Promise<void> {
  if (db) {
    console.log('Database connection already initialized.');
    return;
  }
  try {
    console.log(`Initializing database connection for ${environment} environment...`);
    db = knex(dbConfig);
    
    // Test the connection to ensure it's working
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful.');

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    db = null; // Reset on failure
    throw error;
  }
}

export function getDb(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    console.log('Database connection closed.');
  }
}