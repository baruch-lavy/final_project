# AEGIS — Tactical Operations Command Center

Real-time military tactical command center built with React 19, Express, MongoDB, and Socket.IO.

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router 7, TanStack React Query, Zustand |
| Backend  | Express, MongoDB, Mongoose, Socket.IO                         |
| Auth     | JWT + bcryptjs                                                |
| Map      | **MapLibre GL JS** (3D terrain, 3D buildings, custom markers) |
| Charts   | Recharts                                                      |
| UI       | CSS Modules, Framer Motion, react-icons                       |

## Quick Start

```bash
# 1. Install dependencies
npm run install-all

# 2. Install root concurrently
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
- **Live Simulation** — Run `npm run simulate` to move assets in real-time on the map
