# 🏓 Pong Tournament Backend

A robust REST API backend for managing Pong tournaments, built with Fastify, TypeScript, and SQLite.

## 🚀 Features

- **User Authentication** - JWT-based auth with secure cookie sessions
- **Tournament Management** - Create, join, and manage tournaments
- **Match System** - Track match scores and results
- **Real-time Status** - Online/offline user status tracking
- **Secure API** - Input validation, CORS, and authentication middleware

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: SQLite with sqlite3
- **Authentication**: JWT + bcrypt
- **Validation**: Fastify JSON Schema

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

## 📁 Project Structure

```
src/
├── controllers/          # Route handlers
│   └── authController.js
├── db/                   # Database setup and migrations
│   └── index.ts
├── middleware/           # Custom middleware
│   └── auth.mts
├── repositories/         # Data access layer
│   └── userRepository.js
├── routes/              # API routes
│   ├── auth.mjs
│   ├── index.mjs
│   └── tournament.mjs
└── server.mts           # Main server file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments` - Create new tournament (auth required)
- `POST /api/tournaments/:id/join` - Join tournament (auth required)
- `GET /api/tournaments/:id/matches` - Get tournament matches

### Matches
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id/score` - Update match score (auth required)

### Utility
- `GET /` - Welcome message
- `GET /ping` - Health check
- `GET /health` - Detailed health status

## 📊 Database Schema

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tournaments
```sql
CREATE TABLE tournaments (
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
```

### Matches
```sql
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing the API

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "password": "password123"
  }'
```

### Create a tournament
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Summer Championship",
    "startDate": "2024-06-01T10:00:00Z",
    "maxParticipants": 8,
    "description": "Annual summer tournament"
  }'
```

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests (when implemented)

### Development Setup

1. **Install development dependencies**
```bash
npm install --save-dev @types/node tsx nodemon
```

2. **Run in development mode**
```bash
npm run dev
```

The server will automatically restart when you make changes.

## 🔐 Authentication

The API uses JWT tokens for authentication. Tokens are returned in:
- Response body (for programmatic access)
- HTTP-only cookies (for web browsers)

Protected endpoints require either:
- `Authorization: Bearer <token>` header
- Valid JWT cookie


## 🔮 Roadmap

### Short Term
- [ ] Add comprehensive input validation
- [ ] Implement tournament bracket generation
- [ ] Add user statistics and leaderboard
- [ ] Real-time updates with WebSocket

### Long Term
- [ ] Add PostgreSQL support
- [ ] Implement Redis caching
- [ ] Add comprehensive test suite
- [ ] API documentation with Swagger
