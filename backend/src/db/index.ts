// src/db/index.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path (stored inside container)
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/ft_transcendence.db');

// Create the database connection
let db: Database | null = null;

export async function initializeDatabase() {
  try {
    console.log(`Initializing database at ${dbPath}`);
    
    // Ensure directory exists
    const fs = await import('fs');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Open the database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Run initial migrations
    await runMigrations();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function runMigrations() {
  console.log('Running migrations...');
  
  // Create tables if they don't exist
  await db?.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'offline',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tournaments table
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    
    -- Tournament Participants table
    CREATE TABLE IF NOT EXISTS tournament_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(tournament_id, user_id)
    );
    
    -- Matches table
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      played_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id)
    );
  `);
  
  console.log('Migrations completed');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed');
  }
}