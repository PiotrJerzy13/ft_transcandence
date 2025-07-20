// // knexfile.js - CommonJS version for Knex CLI
// const path = require('path');

// const dbPath = process.env.DB_PATH || path.join(__dirname, 'src/db/data/ft_transcendence.db');

// module.exports = {
//   development: {
//     client: 'sqlite3',
//     connection: {
//       filename: dbPath
//     },
//     useNullAsDefault: true,
//     migrations: {
//       directory: path.join(__dirname, 'src/db/migrations'),
//       tableName: 'knex_migrations'
//     },
//     seeds: {
//       directory: path.join(__dirname, 'src/db/seeds')
//     },
//     pool: {
//       afterCreate: (conn, done) => {
//         // Enable foreign keys for SQLite
//         conn.run('PRAGMA foreign_keys = ON', done);
//       }
//     }
//   },
//   production: {
//     client: 'sqlite3',
//     connection: {
//       filename: dbPath
//     },
//     useNullAsDefault: true,
//     migrations: {
//       directory: path.join(__dirname, 'src/db/migrations'),
//       tableName: 'knex_migrations'
//     },
//     seeds: {
//       directory: path.join(__dirname, 'src/db/seeds')
//     },
//     pool: {
//       afterCreate: (conn, done) => {
//         conn.run('PRAGMA foreign_keys = ON', done);
//       }
//     }
//   }
// }; 