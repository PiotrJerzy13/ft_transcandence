# 🏓 ft_transcendence – Multiplayer Pong Platform (WIP)

A Dockerized single-page web platform for playing real-time Pong, built with **React**, **Fastify**, and **SQLite**, developed as part of the 42 curriculum. Includes authentication, game logic, and tournament planning (in progress).

---

## ✅ Current Progress Overview

| Feature                                    | Status            |
|-------------------------------------------|-------------------|
| SPA Architecture                          | ✅ Implemented    |
| Dockerized setup                          | ✅ Implemented    |
| Fastify backend (Framework module)        | ✅ Implemented    |
| SQLite database (Database module)         | ✅ Implemented    |
| Pong local 2-player game                  | ✅ Implemented    |
| Secure password hashing                   | ✅ Implemented    |
| JWT Authentication                        | ✅ Implemented    |
| Server-side form validation               | ✅ Implemented    |
| Tournament system                         | ❌ Not implemented|
| Matchmaking                               | ❌ Not implemented|
| Tournament aliases                        | ❌ Not implemented|
| HTTPS / WSS                               | ❌ Not implemented|
| Remote multiplayer                        | ❌ Not implemented|
| Live Chat                                 | ❌ Not implemented|
| AI opponent                               | ⚠️ Basic, needs improvement |
| Game #2 (Arkanoid + history)              | ⚠️ Partial         |
| Google Auth                               | ❌ Not implemented|
| 2FA                                       | ❌ Not implemented|
| WAF / Vault / Log infra / Monitoring      | ❌ Not implemented|
| Responsive design / mobile support        | ❌ Not implemented|
| Frontend framework (Tailwind)             | ⚠️ Partial         |

---

## 🧩 Modules Summary

You need **7 major modules** for full credit. Current estimated count: **2.5 majors**

| Category             | Module                                 | Status        | Points |
|----------------------|----------------------------------------|---------------|--------|
| ✅ Web               | Backend with Fastify                   | Done          | 1.0    |
| ✅ Web               | SQLite for backend                     | Done          | 1.0    |
| ⚠️ Web               | Tailwind for frontend                  | Partial       | 0.5    |
| ⚠️ Gameplay          | Add 2nd game + user history            | Partial       | ~0.5   |
| ⚠️ AI-Algo           | AI Opponent                            | Basic         | ~0.5   |
| ⚠️ User Management   | Standard user management               | Partial       | ~0.5   |
| ❌ Tournament        | Tournament + matchmaking system        | Missing       | 0      |
| ❌ Remote Players    | Play from two devices                  | Missing       | 0      |
| ❌ Security          | WAF / Vault                            | Missing       | 0      |
| ❌ Cybersecurity     | 2FA                                    | Missing       | 0      |
| ❌ Graphics          | 3D with Babylon.js                     | Missing       | 0      |

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
- **Realtime**: WebSocket (local only for now)
- **DevOps**: Docker Compose (multi-service)
- **Testing DB**: SQLite Web (via `coleifer/sqlite-web`)

---

## 🔐 Security

- Passwords hashed using bcrypt
- JWT stored in cookies
- Basic whitelist input sanitation
- SQLi/XSS partially mitigated (tournaments/chat still need work)
- HTTPS not enabled yet (WSS missing)

---

## 📋 Missing Features

- ❌ Tournament bracket management
- ❌ Real matchmaking queue
- ❌ Google login
- ❌ HTTPS / WSS
- ❌ 2FA setup
- ❌ Live chat with invites/block
- ❌ Responsive/mobile support
- ❌ Server-side rendering or multi-language

---

## 🚀 Development

Run backend and frontend via Docker:

```bash
docker compose up --build
```

Access DB visually at [http://localhost:8086](http://localhost:8086)
