# AEGIS — Tactical Operations Command Center

Real-time military tactical command center built with React 19, Express, MongoDB, and Socket.IO.  
This document captures the **full project state** so development can be continued from a new chat session.

---

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router 7, TanStack React Query, Zustand |
| Backend  | Express 5, MongoDB, Mongoose, Socket.IO 4                     |
| Auth     | JWT + bcryptjs                                                |
| Map      | **MapLibre GL JS** (3D terrain, 3D buildings, custom markers) |
| Charts   | Recharts                                                      |
| UI       | CSS Modules, Framer Motion, react-icons                       |

---

## Project Structure

```
final_project/
├── package.json              # Root: concurrently dev script
├── client/                   # React 19 + Vite frontend
│   ├── index.html
│   ├── vite.config.js        # Port 3000, proxy /api → :5000
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Router, QueryClient, ProtectedRoute
│       ├── pages/
│       │   ├── LoginPage.jsx / .module.css
│       │   ├── DashboardPage.jsx / .module.css
│       │   ├── MissionsPage.jsx / .module.css
│       │   ├── AssetsPage.jsx / .module.css
│       │   ├── MapPage.jsx / .module.css
│       │   ├── ChatPage.jsx / .module.css
│       │   └── EventsPage.jsx / .module.css
│       ├── components/
│       │   ├── layout/       # AppLayout (sidebar + outlet)
│       │   ├── chat/         # Chat UI components
│       │   └── ui/           # Shared UI (Loader/Spinner, etc.)
│       ├── hooks/
│       │   ├── useMissions.js  # React Query + Socket.IO hooks
│       │   ├── useAssets.js
│       │   ├── useMessages.js
│       │   └── useEvents.js
│       ├── services/
│       │   ├── api.js          # Axios instance (baseURL :5000/api, JWT interceptor)
│       │   └── socket.js       # Socket.IO client setup
│       └── stores/
│           ├── authStore.js    # Zustand: token, user, verifyToken()
│           ├── socketStore.js  # Zustand: socket instance, initSocket()
│           └── uiStore.js      # Zustand: UI state (sidebar, modals, etc.)
└── server/                   # Express 5 + CommonJS backend
    ├── server.js             # Entry point
    ├── package.json          # type: "commonjs"
    ├── config/
    │   └── db.js             # mongoose.connect()
    ├── models/
    │   ├── User.js           # bcrypt pre-save hook, comparePassword()
    │   ├── Mission.js        # 2dsphere index on location
    │   ├── Asset.js
    │   ├── Message.js
    │   └── Event.js
    ├── controllers/
    │   ├── authController.js
    │   ├── missionController.js
    │   ├── assetController.js
    │   ├── messageController.js
    │   └── eventController.js
    ├── routes/
    │   ├── auth.js
    │   ├── missions.js
    │   ├── assets.js
    │   ├── messages.js
    │   └── events.js
    ├── middleware/
    │   ├── auth.js           # JWT verify → req.user; authorize(...roles)
    │   └── errorHandler.js
    ├── socket/
    │   └── socketHandler.js  # JWT auth middleware, online/offline presence
    └── scripts/
        ├── seed.js           # Populates DB with demo data
        └── simulate.js       # Moves Active assets every 3 s (GPS simulation)
```

---

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally on the default port (`mongodb://localhost:27017`)
  or provide a remote URI via `MONGODB_URI` in `server/.env`

---

## Environment Setup

Create `server/.env` (this file is gitignored):

```env
MONGODB_URI=mongodb://localhost:27017/aegis
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
PORT=5000
```

---

## Quick Start

```bash
# 1. Install all dependencies (server + client)
npm run install-all

# 2. Install root-level concurrently
npm install

# 3. Configure environment
cp server/.env.example server/.env    # edit MONGODB_URI & JWT_SECRET
cp client/.env.example client/.env   # optional — defaults work out-of-the-box

# 4. Make sure MongoDB is running locally

# 5. Seed the database
npm run seed

# 6. Start both servers
npm run dev
```

Client runs on **http://localhost:5173** · Server runs on **http://localhost:5000**

## Demo Accounts (after seeding)

| Email | Password | Role |
| --- | --- | --- |
| hawk@aegis.mil | password123 | Commander |
| viper@aegis.mil | password123 | Operator |
| falcon@aegis.mil | password123 | Operator |
| eagle@aegis.mil | password123 | Analyst |
| wolf@aegis.mil | password123 | Operator |

## Features

- **Dashboard** — Live stats, charts (missions by status, assets by type), activity feed
- **Missions** — CRUD with status workflow, timeline updates, priority levels
- **Assets** — Track vehicles, personnel, equipment, UAVs with live GPS simulation
- **3D Tactical Map** — MapLibre GL JS with:
  - 45 ° pitch for a 3-D perspective out of the box
  - 3-D building extrusion (visible at zoom ≥ 14)
  - Animated pulse markers for active assets
  - Mission zone polygons with fill-extrusion slab effect
  - One-click toggle between Dark and Satellite basemaps
  - 2D / 3D camera toggle with smooth animation
  - Navigation controls with pitch indicator
  - Fullscreen control
  - Styled dark popups on marker click
- **Chat** — Real-time messaging with channels via Socket.IO
- **Events** — Full audit log of system activity
# 3. Ensure MongoDB is running locally

# 4. Seed the database with demo data
npm run seed

# 5. Start both servers concurrently
npm run dev
```

- **Client** → http://localhost:3000
- **Server** → http://localhost:5000
- **Health check** → http://localhost:5000/api/health

### Individual scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start client + server concurrently            |
| `npm run client`     | Start Vite dev server only (port 3000)        |
| `npm run server`     | Start Express server with nodemon (port 5000) |
| `npm run seed`       | Wipe DB and populate with demo data           |
| `npm run simulate`   | Move Active assets every 3 s (GPS sim)        |

---

## Demo Accounts (after seeding)

| Email                  | Password    | Role      | Username          |
| ---------------------- | ----------- | --------- | ----------------- |
| hawk@aegis.mil         | password123 | Commander | Commander_Hawk    |
| viper@aegis.mil        | password123 | Operator  | Op_Viper          |
| falcon@aegis.mil       | password123 | Operator  | Op_Falcon         |
| eagle@aegis.mil        | password123 | Analyst   | Analyst_Eagle     |
| wolf@aegis.mil         | password123 | Operator  | Op_Wolf           |

> Login uses **email + password** (not username).

---

## Features

| Page          | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| **Dashboard** | Live stats cards, Recharts (missions by status, assets by type), activity feed |
| **Missions**  | Full CRUD, status workflow (Planning → Active → Completed/Aborted), priority levels, timeline updates |
| **Assets**    | Track Vehicles, Personnel, Equipment, UAVs with live GPS simulation         |
| **Map**       | Interactive Leaflet map — asset markers, mission zone polygons, dark/satellite tiles |
| **Chat**      | Real-time Socket.IO messaging, `general` channel + per-mission channels     |
| **Events**    | Full audit log of all system activity                                       |

---

## API Reference

All routes require `Authorization: Bearer <jwt>` except `/api/auth/login` and `/api/auth/register`.

### Auth (`/api/auth`)

| Method | Path         | Auth | Body / Notes                        |
| ------ | ------------ | ---- | ----------------------------------- |
| POST   | `/login`     | ❌   | `{ email, password }`               |
| POST   | `/register`  | ❌   | `{ username, email, password }`     |
| GET    | `/me`        | ✅   | Returns current user                |
| GET    | `/users`     | ✅   | Returns all users (for dropdowns)   |

### Missions (`/api/missions`)

| Method | Path              | Roles allowed           |
| ------ | ----------------- | ----------------------- |
| GET    | `/stats`          | all                     |
| GET    | `/`               | all                     |
| GET    | `/:id`            | all                     |
| POST   | `/`               | Commander, Operator     |
| PUT    | `/:id`            | Commander, Operator     |
| PUT    | `/:id/status`     | Commander, Operator     |
| POST   | `/:id/updates`    | all                     |
| DELETE | `/:id`            | Commander only          |

### Assets (`/api/assets`)

| Method | Path              | Roles allowed           |
| ------ | ----------------- | ----------------------- |
| GET    | `/stats`          | all                     |
| GET    | `/`               | all                     |
| GET    | `/:id`            | all                     |
| POST   | `/`               | Commander, Operator     |
| PUT    | `/:id`            | Commander, Operator     |
| PUT    | `/:id/location`   | Commander, Operator     |
| DELETE | `/:id`            | Commander only          |

### Messages (`/api/messages`)

| Method | Path         | Notes                               |
| ------ | ------------ | ----------------------------------- |
| GET    | `/`          | Optional `?channel=<name>`          |
| POST   | `/`          | `{ channel, content, type? }`       |

### Events (`/api/events`)

| Method | Path | Notes              |
| ------ | ---- | ------------------ |
| GET    | `/`  | Returns audit log  |

---

## Socket.IO Events

The server authenticates Socket.IO connections with the same JWT used for HTTP requests.

### Client → Server

| Event           | Payload        | Description                        |
| --------------- | -------------- | ---------------------------------- |
| `channel:join`  | `channelName`  | Join a chat channel room           |
| `channel:leave` | `channelName`  | Leave a chat channel room          |

### Server → Client (emitted by controllers)

| Event                    | Payload         | Trigger                            |
| ------------------------ | --------------- | ---------------------------------- |
| `user:online`            | `{userId, username}` | User connects                 |
| `user:offline`           | `{userId, username}` | User disconnects              |
| `mission:created`        | mission object  | New mission created                |
| `mission:updated`        | mission object  | Mission fields updated             |
| `mission:statusChanged`  | mission object  | Mission status changed             |
| `mission:deleted`        | `{ _id }`       | Mission deleted                    |
| `asset:created`          | asset object    | New asset created                  |
| `asset:updated`          | asset object    | Asset updated                      |
| `asset:locationUpdated`  | asset object    | Asset GPS coordinates changed      |
| `asset:deleted`          | `{ _id }`       | Asset deleted                      |
| `message:new`            | message object  | New chat message sent              |
| `event:new`              | event object    | New audit event logged             |

---

## State Management

### Zustand Stores

| Store          | State                             | Key actions                      |
| -------------- | --------------------------------- | -------------------------------- |
| `authStore`    | `token`, `user`, `loading`        | `login()`, `logout()`, `verifyToken()` |
| `socketStore`  | `socket`                          | `initSocket(token)`, `disconnect()` |
| `uiStore`      | sidebar open/close, modal state   | Various UI toggles               |

### React Query Keys

| Key                    | Description                      |
| ---------------------- | -------------------------------- |
| `["missions"]`         | All missions list                |
| `["mission", id]`      | Single mission detail            |
| `["assets"]`           | All assets list                  |
| `["asset", id]`        | Single asset detail              |
| `["messages", channel]`| Messages for a channel           |
| `["events"]`           | Events audit log                 |

---

## Data Models

### Mission

```
title, description, status (Planning|Active|Completed|Aborted),
priority (Critical|High|Medium|Low), assignedTo [User refs],
location { type: "Point", coordinates: [lng, lat] },
area { type: "Polygon", coordinates: [[[lng,lat],...]] },
startTime, endTime, updates [{ message, author, timestamp }],
createdBy (User ref), createdAt, updatedAt
```

### Asset

```
name, type (Vehicle|Personnel|Equipment|UAV),
status (Active|Idle|Maintenance|Offline),
location { type: "Point", coordinates: [lng, lat] },
assignedMission (Mission ref), icon, createdAt, updatedAt
```

### User

```
username (unique, 3-30 chars), email (unique), password (bcrypt),
role (Commander|Operator|Analyst), avatar, status (online|offline),
createdAt, updatedAt
```

### Message

```
sender (User ref), channel (string: "general" or mission _id),
content, type (text|alert|system), createdAt
```

### Event

```
type (mission_created|mission_updated|mission_status_changed|
      asset_created|asset_moved|asset_status_changed|alert|other),
description, relatedMission (ref), relatedAsset (ref),
createdBy (User ref), createdAt
```

---

## Module System

- **Backend (`server/`)**: CommonJS (`"type": "commonjs"`) — uses `require()` / `module.exports`
- **Frontend (`client/`)**: ES Modules (`"type": "module"`) — uses `import` / `export`

> **Pending**: The user requested migrating the backend to ES Modules (`"type": "module"`).  
> This means all `require()` calls in `server/` need to be converted to `import`/`export`.

---

## Pending Tasks / TODO

The following items were in progress or planned when this session ended:

1. **ES Modules migration (Backend)**  
   Convert all `server/` files from CommonJS to ES Modules:
   - Change `server/package.json` → `"type": "module"`
   - Replace all `require()` → `import`
   - Replace all `module.exports` → `export default` / named exports
   - Fix `__dirname` / `__filename` (not available in ESM — use `import.meta.url`)

2. **Google Maps 3D integration**  
   The user wants to replace or supplement the current Leaflet map with Google Maps (3D/photorealistic tiles).  
   - Requires a Google Maps API key with Maps JavaScript API + Photorealistic 3D Tiles enabled
   - Options: `@react-google-maps/api` or the native Maps JS API with deck.gl

3. **Seed script validation**  
   Verify the seed script runs without errors against a fresh MongoDB instance.  
   Run: `npm run seed` and confirm all 5 collections are populated.

4. **Live simulation enhancement**  
   `server/scripts/simulate.js` currently updates DB directly without broadcasting via Socket.IO.  
   The asset location updates are not pushed in real-time to connected clients.  
   Fix: emit `asset:locationUpdated` events through the server's Socket.IO instance.

---

## Known Issues

- `simulate.js` imports `socket.io-client` but the code is commented out — live map updates during simulation require the server to emit events via `app.get("io")` or a dedicated socket client connection.
- The Vite proxy (`/api` → `:5000`) means `api.js` hardcodes `http://localhost:5000/api` which conflicts with the proxy in development. Consider using a relative `/api` base URL in `api.js`.

---

## Continuing Development

To pick up where this session left off, share this README with your new chat and reference specific file paths listed in the [Project Structure](#project-structure) section. The most relevant file for the last active work was:

- `client/src/hooks/useMissions.js` — custom React Query + Socket.IO hook for mission data
- **Dashboard** — Live stat cards (active missions, total missions, total assets, online personnel), three charts (Missions by Status, Assets by Type, Asset Status), and a live activity feed
- **Missions** — CRUD with status workflow (Planning → Active → Completed / Aborted), timeline updates, priority levels
- **Assets** — Track vehicles, personnel, equipment, and UAVs with live GPS simulation
- **Map** — Interactive Leaflet map with asset markers, mission markers, mission zone polygons, and dark/satellite tile toggle
- **Chat** — Real-time messaging across four channels (**general**, **operations**, **alerts**, **intel**) via Socket.IO
- **Events** — Full audit log of all system activity
- **Live Simulation** — Run `npm run simulate` to move assets in real-time on the map
