const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'data', 'ft_transcendence.db');

// Migration files that should be marked as completed
const migrations = [
  '001_create_users_table.ts',
  '002_create_user_stats_table.ts', 
  '003_create_achievements_tables.ts',
  '004_create_tournament_tables.ts',
  '005_create_game_tables.ts'
];

async function markMigrationsComplete() {
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Create knex_migrations table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS knex_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        batch INTEGER NOT NULL,
        migration_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating knex_migrations table:', err);
        reject(err);
        return;
      }
      
      console.log('✅ knex_migrations table created/verified');
      
      // Get the next batch number
      db.get('SELECT MAX(batch) as maxBatch FROM knex_migrations', (err, row) => {
        if (err) {
          console.error('Error getting max batch:', err);
          reject(err);
          return;
        }
        
        const nextBatch = (row?.maxBatch || 0) + 1;
        console.log(`📦 Using batch number: ${nextBatch}`);
        
        // Insert each migration
        let completed = 0;
        migrations.forEach((migration, index) => {
          db.run(
            'INSERT OR IGNORE INTO knex_migrations (name, batch) VALUES (?, ?)',
            [migration, nextBatch],
            (err) => {
              if (err) {
                console.error(`❌ Error inserting migration ${migration}:`, err);
              } else {
                console.log(`✅ Marked migration as complete: ${migration}`);
              }
              completed++;
              
              if (completed === migrations.length) {
                console.log('\n🎉 All migrations marked as complete!');
                db.close();
                resolve();
              }
            }
          );
        });
      });
    });
  });
}

markMigrationsComplete()
  .then(() => {
    console.log('✅ Migration marking completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error marking migrations:', err);
    process.exit(1);
  }); 