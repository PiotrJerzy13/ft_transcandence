# 🏓 ft_transcendence – Multiplayer Pong Platform (WIP)

A Dockerized single-page web platform for playing real-time Pong, built with **React**, **Fastify**, and **SQLite**, developed as part of the 42 curriculum. Includes authentication, game logic, and tournament planning (in progress).

---

## ✅ Current Progress Overview

| Feature                                   | Status            |
|-------------------------------------------|-------------------|
| SPA Architecture                          | ✅ Implemented    |
| Dockerized setup                          | ✅ Implemented    |
| Fastify backend (Framework module)        | ✅ Implemented    |
| SQLite database (Database module)         | ✅ Implemented    |
| Pong local 2-player game                  | ✅ Implemented    |
| Secure password hashing                   | ✅ Implemented    |
| JWT Authentication                        | ✅ Implemented    |
| Server-side form validation               | ✅ Implemented    |
| Tournament system                         | ✅ **IMPLEMENTED** 🏆 |
| **🎮 Matchmaking System**                 | ✅ **IMPLEMENTED** 🏆 |
| **🔌 Phase 1: WebSocket Foundation**      | ✅ **IMPLEMENTED** 🏆 |
| **🎯 Phase 2: Game State Synchronization**| ✅ **IMPLEMENTED** 🏆 |
| Tournament aliases                        | ❌ Not implemented|
| HTTPS / WSS                               | ❌ Not implemented|
| AI opponent                               | ⚠️ Basic          |
| Game #2 (Arkanoid + history)              | ⚠️ Partial        |
| 2FA                                       | ❌ Not implemented|
| Responsive design / mobile support        | ✅ Implemented    |

---

## 🧩 Modules Summary

You need **7 major modules** for full credit. Current estimated count: **7.5/9.5 majors**

| Category             | Module                                 | Status        | Points |
|----------------------|----------------------------------------|---------------|--------|
| ✅ Web               | Backend with Fastify                   | Done          | 1.0    |
| ✅ Web               | SQLite for backend                     | Done          | 1.0    |
| ✅ Devops            | ELK                                    | Done          | 1.0    |
| ✅ Devops            | Prometheus + Grafana                   | Done          | 0.5    |
| ✅ Accessibility     | Responsive design Mobile               | Done          | 0.5    |
| ✅ Accessibility     | Expanding Browser Compatibility.       | Done          | 0.5    |
| ✅ Web               | Real-time WebSocket Infrastructure      | Done          | 1.0    |
| ✅ Web               | Game State Management System           | Done          | 1.0    |
| ✅ Web               | Real-time Game Synchronization         | Done          | 1.0    |
| ⚠️ Web               | User and Game Stats Dashboards.        | Partial       | ~0.5   |
| ⚠️ AI-Algo           | AI Opponent                            | Partial       | ~1.0   |
| ⚠️ User Management   | Standard user management               | Partial       | ~1.0   |
| ⚠️ Add another game  | Gameplay                               | Partial       | ~1.0   |
| ⚠️ AI-Algo           | User and Game Stats Dashboards         | Partial       | ~0.5   |
| ⚠️ Cybersecurity     | Two-Factor Authentication (2FA) and JWT| Partial       | ~1.0   |

> **💡 To reach 100%**, prioritize:  
> – Tournament logic  
> – Matchmaking  
> – Google OAuth / 2FA  
> – Remote play  
> – At least one more major module (e.g., live chat or CLI play)

---

## 🛠️ Stack

- **Frontend**: React + TypeScript (SPA)
- **Backend**: Node.js + Fastify
- **Database**: SQLite
- **Auth**: JWT (bcrypt, cookies)
- **Realtime**: WebSocket + Real-time Game Synchronization
- **DevOps**: Docker Compose (multi-service)
- **Testing DB**: SQLite Web (via `coleifer/sqlite-web`)

---

## 📚 Database & Knex.js Usage

This project uses [Knex.js](https://knexjs.org/) as a SQL query builder and migration tool for SQLite. All database access in the backend is done via Knex.

### 🔄 Running Migrations & Seeds

- **Run all migrations:**
  ```bash
  npm run migrate
  ```
- **Rollback last migration:**
  ```bash
  npm run migrate:down
  ```
- **Run seeds (development only):**
  ```bash
  npm run seed
  ```

Migrations and seeds are located in `backend/src/db/migrations/` and `backend/src/db/seeds/`.

### ✍️ Writing Queries
- Use the `getDb()` helper from `src/db/index.ts` to get a Knex instance:
  ```ts
  import { getDb } from '../db/index.js';
  const db = getDb();
  const users = await db('users').select('*');
  ```
- Avoid using raw SQL strings; prefer Knex's query builder methods for safety and portability.

### 🏗️ Creating a New Migration
- Create a new migration file:
  ```bash
  npm run migrate:make -- <migration_name>
  ```
- Edit the generated file in `src/db/migrations/` to define your schema changes.

### 🌱 Creating a New Seed
- Create a new seed file:
  ```bash
  npm run seed:make -- <seed_name>
  ```
- Edit the generated file in `src/db/seeds/` to insert initial data.

### 🧑‍💻 Using Knex in New Code
- Always use the Knex instance from `getDb()`.
- Example insert:
  ```ts
  await db('users').insert({ username: 'alice', password: '...' });
  ```
- Example update:
  ```ts
  await db('users').where({ id: 1 }).update({ username: 'bob' });
  ```
- Example select:
  ```ts
  const user = await db('users').where({ id: 1 }).first();
  ```

### 📖 More Info
- See [Knex.js documentation](https://knexjs.org/) for advanced usage and query examples.

---

## 🔐 Security

- Passwords hashed using bcrypt
- JWT stored in cookies
- Basic whitelist input sanitation
- SQLi/XSS partially mitigated (tournaments/chat still need work)
- HTTPS not enabled yet (WSS missing)

---

## 🏆 Tournament System

**Status**: ✅ **IMPLEMENTED** 🏆  
**Contributor**: Blatifat

### **Features**
- **Tournament Creation**: Custom names, descriptions, start dates
- **Bracket Types**: Single elimination, Double elimination, Swiss system  
- **Seeding**: Random and ranked seeding options
- **Hybrid Start**: Manual start + auto-start when date reached (≥2 participants)
- **Auto-cancel**: Tournaments with <2 participants at start date
- **Stuck Detection**: Auto-complete tournaments inactive for 3 days
- **Bracket Generation**: Automatic match creation with progression links
- **Score Updates**: Frontend interface for match score editing
- **Bracket Progression**: Automatic winner/loser advancement
- **Tournament Completion**: Auto-detection and winner determination

### **API Endpoints**
```
GET    /api/tournaments              # List tournaments
POST   /api/tournaments              # Create tournament  
GET    /api/tournaments/:id          # Tournament details
POST   /api/tournaments/:id/join     # Join tournament
DELETE /api/tournaments/:id/leave    # Leave tournament
POST   /api/tournaments/:id/start    # Start tournament
DELETE /api/tournaments/:id          # Delete tournament
PUT    /api/matches/:id/score        # Update match score
```

### **Key Implementation**
- **Backend**: Enhanced auto-start with bracket generation, match progression logic
- **Frontend**: Interactive bracket visualization with score editing
- **Database**: Tournament, participants, and matches tables with progression links
- **Authentication**: Protected endpoints, creator-only actions

---

## 🎮 Matchmaking System

**Status**: ✅ **IMPLEMENTED** 🏆  
**Contributor**: Blatifat

### **Phase 1: WebSocket Foundation**
- **WebSocket Infrastructure**: Real-time communication layer
- **Connection Management**: Player connection/disconnection handling
- **Game Room System**: Dynamic game room creation and management
- **Player Tracking**: Real-time player status and session management
- **Authentication Integration**: JWT-based WebSocket authentication

### **Phase 2: Game State Synchronization**
- **Game State Manager**: Centralized game state management
- **Real-time Physics**: 60 FPS game loop with collision detection
- **State Broadcasting**: Live game state updates to all players
- **Player Action Handling**: Real-time paddle movement and game actions
- **Game Flow Management**: Waiting → Countdown → Active → Completed states

### **Features**
- **Real-time Matchmaking**: Join/leave queue with instant updates
- **Game State Creation**: Automatic game state initialization when matches found
- **Live Synchronization**: Ball physics, paddle positions, scores synchronized
- **Game Events**: Countdown, scoring, game start/end notifications
- **Performance Optimized**: 60 FPS game loop, 20 FPS network updates

### **Technical Implementation**
- **WebSocket Manager**: Handles connections, rooms, and real-time messaging
- **Game State Manager**: Manages game physics, collisions, and progression
- **TypeScript Interfaces**: Comprehensive game state and action types
- **Real-time Broadcasting**: Immediate state updates to all connected players
- **Automatic Cleanup**: Game state cleanup when sessions end

### **API Endpoints**
```
WebSocket: /api/ws                    # Real-time game communication
GET       /api/ws/stats              # WebSocket connection statistics
GET       /api/ws/health             # WebSocket health check
POST      /api/matchmaking/join      # Join matchmaking queue
DELETE    /api/matchmaking/leave     # Leave matchmaking queue
GET       /api/matchmaking/status    # Current queue status
```

### **Game Flow**
1. **Player joins matchmaking queue**
2. **System searches for compatible opponent**
3. **Match found → Game room created**
4. **Game state initialized with player positions**
5. **Both players ready → Countdown begins**
6. **Game starts with synchronized physics**
7. **Real-time updates for all game actions**
8. **Game ends → Winner determined → Cleanup**

### **Real-time Features**
- **Live Paddle Movement**: WASD/Arrow keys with immediate response
- **Ball Physics**: Realistic collision detection and bouncing
- **Score Updates**: Instant score changes visible to both players
- **Game Events**: Real-time notifications for all game milestones
- **Connection Management**: Automatic reconnection and cleanup

---
## 📋 Missing Features

- ❌ Google login
- ❌ HTTPS / WSS
- ❌ 2FA setup
- ❌ Live chat with invites/block
- ❌ Server-side rendering or multi-language

| Service           | URL / Port                                     | Description                                     |
| ----------------- | ---------------------------------------------- | ----------------------------------------------- |
| **Frontend**      | [http://localhost:5173](http://localhost:5173) | React SPA (Vite dev server + Tailwind CSS)      |
| **Backend**       | [http://localhost:3000](http://localhost:3000) | Fastify API with SQLite + Prometheus `/metrics` |
| **SQLite Web**    | [http://localhost:8086](http://localhost:8086) | Visual DB viewer (`coleifer/sqlite-web`)        |
| **Prometheus**    | [http://localhost:9090](http://localhost:9090) | System metrics collection and query interface   |
| **Grafana**       | [http://localhost:3001](http://localhost:3001) | Monitoring dashboards (`admin` / `admin`)       |
| **Kibana**        | [http://localhost:5601](http://localhost:5601) | ELK stack dashboard for logs (local only)       |
| **Elasticsearch** | [http://localhost:9200](http://localhost:9200) | Search engine & log storage (local only)        |
| **Logstash**      | `tcp://localhost:5001` / `5044`                | Log processor (ingests from backend to ES)      |



## 🚀 Development

Run backend and frontend via Docker:

```bash
make up
```

<!-- ---blatifat -->

## 🎯 Recent Development Achievements

### **🏆 Phase 1: WebSocket Foundation (COMPLETED)**
- ✅ **WebSocket Infrastructure**: Real-time communication layer implemented
- ✅ **Connection Management**: Player connection/disconnection handling
- ✅ **Game Room System**: Dynamic game room creation and management
- ✅ **Player Tracking**: Real-time player status and session management
- ✅ **Authentication Integration**: JWT-based WebSocket authentication

### **🏆 Phase 2: Game State Synchronization (COMPLETED)**
- ✅ **Game State Manager**: Centralized game state management system
- ✅ **Real-time Physics**: 60 FPS game loop with collision detection
- ✅ **State Broadcasting**: Live game state updates to all players
- ✅ **Player Action Handling**: Real-time paddle movement and game actions
- ✅ **Game Flow Management**: Complete game lifecycle (Waiting → Countdown → Active → Completed)

### **🎮 Current Status**
- **WebSocket Connection**: ✅ Stable and authenticated
- **Game State Creation**: ✅ Automatic when matches found
- **Real-time Synchronization**: ✅ 60 FPS physics, 20 FPS network updates
- **Player Actions**: ✅ Paddle movement, ready status, game controls
- **Matchmaking Integration**: ✅ Seamless queue to game flow

### **🚀 Next Steps Available**
- **Phase 3**: Frontend Game Integration
- **Phase 4**: Advanced Game Features
- **Phase 5**: Multiplayer Testing & Optimization

---

