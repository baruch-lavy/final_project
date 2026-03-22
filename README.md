# AEGIS — Tactical Operations Command Center

Real-time military tactical command center built with React 19, Express, MongoDB, and Socket.IO.

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router 7, TanStack React Query, Zustand |
| Backend  | Express, MongoDB, Mongoose, Socket.IO                         |
| Auth     | JWT + bcryptjs                                                |
| Map      | Leaflet + react-leaflet                                       |
| Charts   | Recharts                                                      |
| UI       | CSS Modules, Framer Motion, react-icons                       |

## Quick Start

```bash
# 1. Install dependencies
npm run install-all

# 2. Install root concurrently
npm install

# 3. Make sure MongoDB is running locally

# 4. Seed the database
npm run seed

# 5. Start both servers
npm run dev
```

Client runs on **http://localhost:3000** · Server runs on **http://localhost:5000**

## Demo Accounts (after seeding)

| Username | Password    | Role      |
| -------- | ----------- | --------- |
| hawk     | password123 | Commander |
| viper    | password123 | Operator  |
| falcon   | password123 | Analyst   |

## Features

- **Dashboard** — Live stats, charts (missions by status, assets by type), activity feed
- **Missions** — CRUD with status workflow, timeline updates, priority levels
- **Assets** — Track vehicles, personnel, equipment, UAVs with live GPS simulation
- **Map** — Interactive Leaflet map with asset markers, mission zones, dark/satellite tiles
- **Chat** — Real-time messaging with channels via Socket.IO
- **Events** — Full audit log of system activity
- **Live Simulation** — Run `npm run simulate` to move assets in real-time on the map
