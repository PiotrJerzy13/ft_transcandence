// // src/db/knexfile.ts
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/ft_transcendence.db');

// const config = {
//   development: {
//     client: 'sqlite3',
//     connection: {
//       filename: dbPath
//     },
//     useNullAsDefault: true,
//     migrations: {
//       directory: path.join(__dirname, './migrations'),
//       tableName: 'knex_migrations'
//     },
//     seeds: {
//       directory: path.join(__dirname, './seeds')
//     },
//     pool: {
//       afterCreate: (conn: any, done: any) => {
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
//       directory: path.join(__dirname, './migrations'),
//       tableName: 'knex_migrations'
//     },
//     seeds: {
//       directory: path.join(__dirname, './seeds')
//     },
//     pool: {
//       afterCreate: (conn: any, done: any) => {
//         conn.run('PRAGMA foreign_keys = ON', done);
//       }
//     }
//   }
// };

// export default config;