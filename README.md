# 🏓 ft_transcendence – Multiplayer Pong Platform

A Dockerized single-page web platform for playing real-time Pong, built with **React**, **Fastify**, and **SQLite**, developed as part of the 42 curriculum. Includes authentication, game logic, and tournament planning (in progress).

---
<img width="1895" height="867" alt="Zrzut-ekranu-2025-07-23-o-14 29 45-1" src="https://github.com/user-attachments/assets/8f464180-75c5-4ed4-a3eb-e5d85690a45b" />

<img width="1513" height="941" alt="Zrzut-ekranu-2025-07-23-o-14 31 44" src="https://github.com/user-attachments/assets/f3321df4-4308-4a51-8c06-26bcba0ad5b2" />



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
| Responsive design / mobile support        | ✅ Implemented    |

---
<img width="1638" height="856" alt="Zrzut-ekranu-2025-07-23-o-14 30 48" src="https://github.com/user-attachments/assets/b64ca9cb-8905-4bf8-8603-e4a33678857e" />


## 🧩 Modules Summary

You need **7 major modules** for full credit. Current estimated count: **4.5/9.5 majors**

| Category             | Module                                 | Status        | Points |
|----------------------|----------------------------------------|---------------|--------|
| ✅ Web               | Backend with Fastify                   | Done          | 1.0    |
| ✅ Web               | SQLite for backend                     | Done          | 1.0    |
| ✅ Devops            | ELK                                    | Done          | 1.0    |
| ✅ Devops            | Prometheus + Grafana                   | Done          | 0.5    |
| ✅ Accessibility     | Responsive design Mobile               | Done          | 0.5    |
| ✅ Accessibility     | Expanding Browser Compatibility.       | Done          | 0.5    |
| ✅ Web               | User and Game Stats Dashboards.        | Partial       | 0.5    |
| ✅ AI-Algo           | AI Opponent                            | Partial       | 1.0    |
| ✅ Add another game  | Gameplay                               | Partial       | 1.0    |

<img width="1048" height="834" alt="Zrzut-ekranu-2025-07-23-o-14 42 09" src="https://github.com/user-attachments/assets/d011c220-838f-4309-8dee-91a841b6c8e0" />

---

## 🛠️ Stack

- **Frontend**: React + TypeScript (SPA)
- **Backend**: Node.js + Fastify
- **Database**: SQLite
- **Auth**: JWT (bcrypt, cookies)
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
- HTTPS enabled yet

---

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

