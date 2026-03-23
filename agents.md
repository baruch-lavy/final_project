# AEGIS — Tactical Operations Command Center

## Project Context (for continuing development)

This file exists so a new AI chat session can understand the full project state and continue building.

---

## What AEGIS Is

A real-time collaborative military command center web app. Multiple users manage operations on an interactive map, track assets live, coordinate via built-in chat, and view live analytics. Dark military-themed UI with glassmorphism effects.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 (Vite), React Router 7 (NOT react-router-dom), TanStack React Query v5, Zustand |
| Backend | Express (ES Modules — `"type": "module"` in package.json), Mongoose, Socket.IO |
| Database | MongoDB |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Map | Leaflet with dark CartoDB tiles (was planned to migrate to Google Maps 3D — NOT YET DONE) |
| UI | Tailwind CSS-style custom CSS, Framer Motion animations, Recharts charts |
| Real-time | Socket.IO for WebSocket communication |
| React 19 features used | `useActionState`, `useOptimistic`, `use()`, `<Suspense>` |

---

## Project Structure

```
/final_project
├── package.json              # Root — scripts: dev, seed, simulate (uses concurrently)
├── /client                   # React 19 + Vite (port 3000)
│   ├── vite.config.js        # Proxy /api and /socket.io → port 5000
│   └── /src
│       ├── main.jsx          # Entry, imports global.css
│       ├── App.jsx           # React Router 7 routes, QueryClientProvider, lazy loading, auth guards
│       ├── /components
│       │   ├── /ui           # Button, Input, Card, Modal, Badge, Loader, StatCard
│       │   ├── /layout       # Sidebar, TopBar, PageWrapper
│       │   ├── /map          # MapView, AssetMarker, MissionZone (Leaflet-based)
│       │   ├── /dashboard    # StatCard, Charts, ActivityFeed
│       │   ├── /missions     # MissionList, MissionDetail, MissionForm
│       │   ├── /assets       # AssetList, AssetDetail, AssetForm
│       │   └── /chat         # ChatPanel (slide-out panel with Framer Motion)
│       ├── /context          # AuthContext (JWT auth state)
│       ├── /hooks            # useMissions, useAssets, useEvents, useChat (React Query + Socket.IO)
│       ├── /pages            # LoginPage, DashboardPage, MapPage, MissionsPage, AssetsPage, EventsPage, ChatPage
│       ├── /services         # api.js (axios instance with JWT interceptor), socket.js (Socket.IO client)
│       ├── /stores           # authStore.js, socketStore.js, uiStore.js (all Zustand)
│       └── /styles           # global.css
├── /server                   # Express (port 5000) — ALL FILES USE ES MODULES (import/export)
│   ├── server.js             # Entry — Express + Socket.IO setup
│   ├── /models               # User, Mission, Asset, Message, Event (Mongoose)
│   ├── /routes               # auth, missions, assets, messages, events
│   ├── /controllers          # authController, missionController, assetController, messageController, eventController
│   ├── /middleware            # auth.js (JWT verify), errorHandler.js
│   ├── /socket               # socketHandler.js (auth middleware, rooms, events)
│   └── /scripts              # seed.js (demo data), simulate.js (moves assets in real-time)
```

---

## Key Architecture Decisions

1. **Backend is ES Modules** — `"type": "module"` in server/package.json. All imports use `import/export`, all local paths include `.js` extension.
2. **React Router 7** — imported from `react-router` (NOT `react-router-dom`).
3. **React Query** — manages all server state (missions, assets, events, messages). Socket.IO events update the React Query cache directly via `queryClient.setQueryData()`.
4. **Zustand** — manages client-only state: `authStore` (user/token), `socketStore` (socket instance), `uiStore` (sidebar open, theme).
5. **Socket.IO flow**: Controllers emit events after DB changes → client hooks listen and update React Query cache → UI re-renders instantly.
6. **Auth**: JWT stored in Zustand + localStorage. Axios interceptor attaches `Authorization: Bearer <token>` to every request. Socket.IO sends token in `handshake.auth`.

---

## Demo Accounts (created by seed script)

| Username | Password | Role |
|----------|----------|------|
| hawk | password123 | Commander (full access) |
| viper | password123 | Operator |
| falcon | password123 | Operator |
| eagle | password123 | Analyst (read-only) |

---

## How to Run

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
npm run seed        # Seeds MongoDB with demo data
npm run dev         # Runs server (5000) + client (3000) concurrently
npm run simulate    # (separate terminal) Moves assets on the map in real-time
```

---

## Current State & Known Issues

### ✅ Working
- JWT auth (register/login/protect routes)
- All REST APIs (missions, assets, messages, events, dashboard stats)
- Socket.IO real-time updates (missions CRUD, asset updates, chat, user online/offline)
- React Query hooks with real-time cache updates from Socket.IO
- Zustand stores (auth, socket, UI)
- Leaflet map with dark tiles, asset markers, mission zone polygons
- Dashboard with stat cards and Recharts charts
- Mission management (CRUD + status workflow + timeline updates)
- Asset management (CRUD + type filters)
- Events/activity log page
- Chat page with channels
- Chat slide-out panel (ChatPanel component)
- Framer Motion animations
- Dark military theme
- Asset movement simulation script
- Seed script with demo data
- ES Modules throughout backend
- Toast notifications for real-time alerts (Framer Motion, 5 variants, auto-dismiss, wired to socket events)
- Personnel page (card grid, online/offline status via socket, role icons/colors)

### 🔲 Not Yet Done / Planned
- **Google Maps 3D integration** — currently using Leaflet. Was requested to migrate to Google Maps with 3D view. This requires:
  - A Google Maps API key with Maps JavaScript API + Map ID for 3D
  - Replace Leaflet with `@googlemaps/react-wrapper` or `@vis.gl/react-google-maps`
  - Implement 3D tilted view, 3D building rendering, custom 3D markers
  - Rewrite MapPage.jsx, remove leaflet dependencies
- Role-based UI restrictions (backend has role checks, frontend doesn't fully enforce)
- Map drawing tools for creating mission area polygons
- Marker clustering when zoomed out
- Loading skeletons (Framer Motion)
- Connection status indicator (socket connected/disconnected)
- Animated polylines showing asset movement paths

---

## Important Patterns

### Adding a new Socket.IO event
1. **Server controller**: `req.app.get("io").emit("eventName", data);`
2. **Client hook**: Inside `useEffect`, add `socket.on("eventName", handler)` that calls `queryClient.setQueryData()`

### Adding a new page
1. Create page in `/client/src/pages/`
2. Add lazy import + route in `App.jsx`
3. Create React Query hook in `/client/src/hooks/`
4. Add API route + controller in server

### React 19 features in use
- `useActionState` — form submission in MissionsPage, AssetsPage
- `useOptimistic` — optimistic status updates in MissionsPage
- `use()` — resolving promises in components
- `<Suspense>` — lazy loading pages in App.jsx