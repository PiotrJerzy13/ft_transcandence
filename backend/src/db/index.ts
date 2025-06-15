// VS Code shows "Cannot find module" because node_modules are in Docker, not locally. 
// Run `docker exec -it ft_backend sh` then `sqlite3 --version` to confirm it's installed.
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

// Update for src/db/index.ts - Replace the runMigrations function

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
    
    -- User Stats table
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      total_games INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      win_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_play_time INTEGER DEFAULT 0,
      rank TEXT DEFAULT 'Novice',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Achievements table
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- User Achievements table
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
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
      duration INTEGER DEFAULT 0,
      played_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id)
    );
	-- Arkanoid Scores table
	CREATE TABLE IF NOT EXISTS arkanoid_scores (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		score INTEGER NOT NULL,
		level_reached INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);
	-- Pong Matches table
	DROP TABLE IF EXISTS pong_matches;
	CREATE TABLE IF NOT EXISTS pong_matches (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	mode TEXT NOT NULL, -- 'one-player' or 'two-player'
	score INTEGER NOT NULL, -- player's score
	opponent_score INTEGER NOT NULL, -- opponent's score
	winner TEXT NOT NULL, -- 'player' or 'opponent'
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);
  `);
  
  // Insert default achievements if they don't exist
  await db?.exec(`
    INSERT OR IGNORE INTO achievements (id, name, description, icon, requirement_type, requirement_value) VALUES
    (1, 'First Victory', 'Win your first game', 'Trophy', 'first_win', 1),
    (2, 'Speed Demon', 'Win a game in under 2 minutes', 'Zap', 'game_duration', 120),
    (3, 'Unstoppable', 'Achieve a 5-game win streak', 'Target', 'win_streak', 5),
    (4, 'Century Club', 'Play 100 games', 'Star', 'games_played', 100),
    (5, 'Perfect Game', 'Win without opponent scoring', 'Crown', 'perfect_game', 1),
    (6, 'Marathon', 'Play for 10 hours total', 'Clock', 'play_time', 600);
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