# CampusNav

**Smart campus navigation for the Bhavan's SPIT / SPJIMR campus (Mumbai).**
Log in, pick a start and a destination, and get the shortest walking route across the campus, or inside a building across multiple floors, using graph algorithms (Dijkstra, BFS) and GPS snapping (k-NN).

> Full-stack JavaScript app: Express + MongoDB backend, vanilla HTML/CSS/JS frontend with SVG maps. No frontend framework, no map-API key required.

---

## Table of contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Algorithms](#algorithms)
5. [Campus graph](#campus-graph)
6. [Indoor maps (SPIT)](#indoor-maps-spit)
7. [Pages](#pages)
8. [REST API](#rest-api)
9. [Data models](#data-models)
10. [Getting started](#getting-started)
11. [Environment variables](#environment-variables)
12. [Accounts](#accounts)
13. [Project structure](#project-structure)
14. [Extending the project](#extending-the-project)
15. [Security notes](#security-notes)
16. [Known limitations](#known-limitations)
17. [Future scope](#future-scope)

---

## Features

| # | Feature | What it does |
|---|---------|--------------|
| 1 | **Authentication** | Register / login with JWT (7-day tokens). Passwords hashed with bcrypt. Roles: `student`, `admin`. |
| 2 | **Campus map** | Interactive SVG map of 17 campus locations, with the lake drawn as a walkable promenade. |
| 3 | **Shortest route** | Dijkstra between any two locations, with total distance and walking-time estimate. |
| 4 | **Nearest facility** | BFS from your location to the closest Library, Canteen, Medical, Washroom, Parking, Sports, Hostel or Emergency point. |
| 5 | **Blocked roads** | Admin closes a road; every route is recomputed on the graph without it and an alternative path is shown. |
| 6 | **Emergency routing** | One tap: fastest path to the Medical Centre or Security Office. |
| 7 | **Use my location** | Browser GPS is snapped to the nearest campus node with k-NN (k = 3, Haversine distance, 400 m cutoff). |
| 8 | **Favourites** | Save locations to your account (stored in MongoDB). |
| 9 | **Indoor maps** | Floor plans for SPIT: **Ground, 1st and 2nd floor**, room-to-room routing, floor switching. |
| 10 | **Stairs vs lift** | For multi-floor trips choose **Shortest / Stairs / Lift**; the result also compares both distances. |
| 11 | **Room icons** | Every room shows a standard type icon (classroom, lab, office, library, xerox, sitting area, shop, stairs, lift) with a legend. |
| 12 | **Admin panel** | Admin-only page to block / unblock roads, saved in MongoDB. |
| 13 | **Animated route** | A walking marker travels along the highlighted route. |

---

## Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | Server |
| Web framework | Express 4 | REST API + static file hosting |
| Database | MongoDB + Mongoose 8 | Users, favourites, blocked roads |
| Auth | `jsonwebtoken`, `bcryptjs` | Stateless login, password hashing |
| Config | `dotenv` | Secrets in `.env` |
| Cross-origin | `cors` | CORS middleware |
| Frontend | HTML, CSS, vanilla JavaScript | No build step, no framework |
| Maps | Hand-drawn SVG generated from graph data | Works offline, no API key |
| Location | Browser Geolocation API | GPS start point |

---

## Architecture

```
┌────────────────────────── Browser ───────────────────────────┐
│  HTML pages  +  vanilla JS modules                           │
│  graph-data.js / indoor-data.js  → graphs & floor plans      │
│  Dijkstra, BFS, k-NN run client-side                         │
│  fetch() + "Authorization: Bearer <JWT>"                     │
└───────────────────────────────┬──────────────────────────────┘
                                │  REST (JSON)
┌───────────────────────────────▼──────────────────────────────┐
│  Express server  (backend/server.js)                         │
│  /api/auth   /api/favourites   /api/campus                   │
│  middleware: requireAuth, requireAdmin                       │
└───────────────────────────────┬──────────────────────────────┘
                                │  Mongoose
                     ┌──────────▼──────────┐
                     │      MongoDB        │
                     │  User, CampusState  │
                     └─────────────────────┘
```

Routing is computed **in the browser**; the server only handles authentication and persistence (users, favourites, blocked roads).

---

## Algorithms

| Feature | Algorithm | Where | Notes |
|---------|-----------|-------|-------|
| Shortest path (campus + indoor) | **Dijkstra** | `graph-data.js` (`window.dijkstra`) | Weighted by metres. Current implementation scans for the minimum node each step: O(V²). Fine for tens of nodes; a min-heap would give O((V+E) log V). |
| Nearest facility | **BFS** | `graph-data.js` (`bfsNearest`) | Fewest hops to a node of the requested facility type. |
| Blocked-road rerouting | Dijkstra on a copy of the graph with blocked edges removed | `navigate.js` | Edge key format: `a\|b` (ids sorted alphabetically). |
| Emergency route | Dijkstra to each target, keep the best | `emergency.js` | Targets: `medical`, `security`. |
| GPS to start node | **k-NN** (k = 3) with **Haversine** distance | `locate.js` | A nearest-neighbour lookup over the campus nodes: no training step. If the nearest node is more than 400 m away, the user is treated as outside campus. |
| Indoor routing | Dijkstra over a multi-floor graph | `indoor.js` | Cross-floor links (stairs / lift) are ordinary weighted edges. |
| Stairs / lift mode | Dijkstra on a filtered copy of the graph | `indoor.js` (`graphFor`) | Removes every cross-floor link of the other kind before routing. |

---

## Campus graph

17 routable locations plus the lake, defined in `frontend/js/graph-data.js`:

`entrance`, `spit`, `spce`, `workshop`, `library`, `lib-ext`, `bhavans-college`, `cultural`, `spjimr`, `spjimr-hostel`, `hostel`, `wadia`, `sports-complex`, `playground`, `lake`, `canteen`, `medical`, `security`

- `CAMPUS_LOCATIONS`: id, name, type, SVG position (`x`, `y`) and real `lat`/`lon` (used by k-NN).
- `CAMPUS_GRAPH`: adjacency list with edge weights.
- `FACILITY_TYPES`: maps a facility category to the node ids that provide it.
- `EMERGENCY_TARGETS`: `['medical', 'security']`.
- Edges touching the lake follow its ellipse, so routes visibly walk around the water.

---

## Indoor maps (SPIT)

Opened from the campus map (click the SPIT node with the orange **i** badge, then **Enter**) or directly at
`/indoor.html?building=spit`.
Optional query params: `floor=ground|first|second`, `from=<nodeId>`, `to=<nodeId>`.

### Floors

| Floor | Id | Rooms / places |
|-------|----|----------------|
| Ground | `ground` | Entrance, Room 008, Staircase, Lift, Alams Xerox, Office, Room 003, Room 001 |
| 1st | `first` | Exam Cell, Room 107, Lift, Staircase 1, TPO Cabin, Sitting Area, Room 105, Staircase 2, Room 103, Professors Cabin |
| 2nd | `second` | Control Systems Lab, Room 207, Lift, Staircase 1, Library, Staircase 2, Room 203, Room 202, Techsop |

Corridor junctions are hidden waypoints (not selectable). Distances come from the metre labels on the original floor plans.

### Cross-floor links

| From | To | Kind | Metres |
|------|----|------|--------|
| `ground:stairs` | `first:n4` | Stairs | 10 |
| `first:n4` | `second:n4` | Stairs | 10 |
| `first:n8` | `second:n6` | Stairs | 10 |
| `ground:lift` | `first:n3` | Lift | 6 |
| `first:n3` | `second:n3` | Lift | 6 |

Global node ids are written `"<floorId>:<nodeId>"`, for example `first:n4`.

### Using it
1. Click a **From** room, then a **To** room (on the map or from the room list; the list is grouped by floor and searchable).
2. Under **Changing floors? Go by**, pick **Shortest**, **Stairs** or **Lift**.
3. Press **Calculate Shortest Path**. You get the distance, walking time, a step list (with "Lift up to 2nd Floor" rows you can click to jump to that floor) and a **Stairs vs Lift** comparison.
4. Use the floor tabs, the ▲ / ▼ buttons, or the amber `▲ 2nd Floor` tags under stairs and lifts to switch floors.

### Room icons

| Icon | Room type |
|------|-----------|
| 🎓 | Classroom |
| 🔬 | Lab |
| 🏢 | Office |
| 📚 | Library |
| 🖨️ | Xerox |
| 🪑 | Common / sitting area |
| 🛍️ | Shop |
| 🛗 | Lift |
| (drawn stair glyph) | Staircase |

A legend under the map lists the icons present in the building.

---

## Pages

| Page | File | Purpose |
|------|------|---------|
| Login / Register | `index.html` | Authentication |
| Dashboard | `dashboard.html` | Entry point and quick actions |
| Campus Map | `map.html` | Interactive campus map, GPS start, building entry |
| Find Route | `navigate.html` | Shortest route + blocked-road alternative |
| Nearest Facility | `nearest.html` | BFS to the closest facility |
| Emergency | `emergency.html` | Fastest route to Medical / Security |
| Favourites | `favourites.html` | Saved locations |
| Indoor | `indoor.html` | Multi-floor building navigation |
| Admin | `admin.html` | Block / unblock roads (admin only) |

---

## REST API

Base path: `/api`. Protected routes need the header `Authorization: Bearer <token>`.

### Auth: `/api/auth`

| Method | Path | Auth | Body | Result |
|--------|------|------|------|--------|
| POST | `/register` | none | `username` (min 3), `email`, `password` (min 6) | `201` user created; `409` if the username is taken |
| POST | `/login` | none | `username`, `password` | token (valid 7 days) + user; `401` on bad credentials |
| GET | `/me` | user | none | current user |

### Favourites: `/api/favourites` (login required)

| Method | Path | Body | Result |
|--------|------|------|--------|
| GET | `/` | none | `{ favourites: [locationId, ...] }` |
| POST | `/` | `{ locationId }` | updated list |
| DELETE | `/:locationId` | none | updated list |

### Campus state: `/api/campus`

| Method | Path | Auth | Body | Result |
|--------|------|------|------|--------|
| GET | `/blocked` | user | none | `{ blockedEdges: ["a\|b", ...] }` |
| POST | `/blocked` | admin | `{ key }` or `{ u, v }` | list with the edge added |
| DELETE | `/blocked` | admin | `{ key }` or `{ u, v }` | list with the edge removed |
| PUT | `/blocked` | admin | `{ blockedEdges: [...] }` | replaces the whole list |

Errors are returned as `{ "message": "..." }` with status 400 / 401 / 403 / 409 / 500.

---

## Data models

**User** (`backend/models/User.js`)

| Field | Type | Notes |
|-------|------|-------|
| `username` | String | required, unique, 3 to 30 chars |
| `email` | String | optional, lower-cased |
| `password` | String | bcrypt hash, min 6 chars before hashing |
| `role` | `student` \| `admin` | default `student` |
| `favourites` | [String] | location ids |
| `createdAt`, `updatedAt` | Date | automatic |

**CampusState** (`backend/models/CampusState.js`)

| Field | Type | Notes |
|-------|------|-------|
| `key` | String | unique, default `"default"` (single shared document) |
| `blockedEdges` | [String] | edge keys such as `library\|medical` |

---

## Getting started

**Prerequisites:** Node.js 18+ and a MongoDB instance (local, or a free MongoDB Atlas cluster).

```bash
git clone https://github.com/PrasadFakke/CampusNav.git
cd CampusNav

# Windows:  copy .env.example .env      macOS/Linux:  cp .env.example .env
npm install
npm start
```

Then open **http://localhost:3000**.

If `MONGO_URI` is empty the server falls back to `mongodb://127.0.0.1:27017/campusnav`.

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | no | Server port (default `3000`) |
| `MONGO_URI` | yes (for Atlas) | MongoDB connection string |
| `JWT_SECRET` | **yes** | Secret used to sign tokens. Use a long random string. |

`.env` is git-ignored; never commit it.

---

## Accounts

| Role | Username | Password | How |
|------|----------|----------|-----|
| Admin | `admin` | `Admin@123` | Created automatically on first start |
| Student | your choice | min 6 chars | Register on the login page |

**Change the admin password** (or the seed in `backend/server.js`) before deploying anywhere public.

---

## Project structure

```
CampusNav/
├── backend/
│   ├── server.js              Express app, Mongo connection, admin seeding
│   ├── middleware/auth.js     requireAuth (JWT) + requireAdmin
│   ├── models/
│   │   ├── User.js
│   │   └── CampusState.js
│   └── routes/
│       ├── auth.js            register / login / me
│       ├── favourites.js
│       └── campus.js          blocked roads
├── frontend/
│   ├── css/                   style, dashboard, map, login
│   ├── js/
│   │   ├── graph-data.js      campus nodes, edges, Dijkstra, BFS
│   │   ├── indoor-data.js     SPIT floor plans, cross-floor links, room icon map
│   │   ├── indoor.js          indoor UI: drawing, floors, stairs/lift mode
│   │   ├── locate.js          GPS + k-NN snapping (Haversine)
│   │   ├── node-icons.js      campus node icons + animated walker
│   │   ├── map.js, navigate.js, nearest.js, emergency.js
│   │   ├── favourites.js, admin.js, dashboard.js
│   │   └── auth.js, app.js, sidebar.js
│   └── public/                HTML pages
├── .env.example
├── package.json
└── README.md
```

---

## Extending the project

### Add a campus location
1. Add an entry to `CAMPUS_LOCATIONS` in `graph-data.js` (id, name, type, `x`, `y`, `lat`, `lon`).
2. Add its neighbours (both directions) to `CAMPUS_GRAPH`.
3. Add it to `FACILITY_TYPES` if it provides a facility, and to `getShortLabel` / `CAMPUS_NODE_ICONS` for its label and icon.

### Add another indoor map
In `frontend/js/indoor-data.js`, add an entry to `INDOOR_PLANS` using the **same id** as the campus location (for example `spce`). Per floor, define:

| Key | Meaning |
|-----|---------|
| `id`, `label`, `tab` | Floor id and display names |
| `viewBox`, `scale` | SVG size, and pixels per metre |
| `shapes` / `outline` / `blocked` | Walls and non-walkable areas |
| `rooms` | Drawn rectangles (`stairs: true` / `lift: true` for those types, optional `iconAt: [x, y]` to move the icon) |
| `nodes` | Places (`id`, `name`, `label`, `type`, `x`, `y`) plus `hidden: true` corridor waypoints |
| `edges` | `[a, b, metresOverride?, viaPoints?]`; length is computed from coordinates unless overridden |

Connect floors with `links: [[ 'floorA:node', 'floorB:node', metres, 'Stairs' | 'Lift' ]]`.
Room `type` values that get an icon: `Classroom`, `Lab`, `Office`, `Library`, `Xerox`, `Common`, `Shop`, `Lift`, `Stairs` (see `INDOOR_TYPE_ICONS`).

---

## Security notes

- Passwords are salted and hashed with bcrypt (10 rounds); plain passwords are never stored.
- Sessions are stateless JWTs, verified on every protected request.
- Admin-only routes are enforced on the server (`requireAdmin`), not just hidden in the UI.
- Secrets live in `.env`, which is git-ignored.
- Before a public deployment: change the seeded admin password, set a strong `JWT_SECRET`, restrict CORS to your domain, and serve over HTTPS.

---

## Known limitations

- Campus and floor-plan graphs are hand-defined; new places require editing the data files.
- Dijkstra uses an O(V²) scan (fine at this size).
- GPS is unreliable indoors; indoor start points are chosen manually.
- Distances are approximate (taken from plan labels), and walking time assumes 1.3 m/s.
- Blocked roads are loaded on page load, not pushed live to other users.
- The default admin credentials are hard-coded for convenience.

---

## Future scope

- Live road-closure updates (Socket.io)
- Weather-aware routing (Open-Meteo)
- Voice directions (Web Speech API)
- Accessibility routing (ramps, lift-only paths) as a first-class option
- Wi-Fi / BLE fingerprint positioning for indoor localisation
- Floor plans for SPCE, the library and other buildings
- Email / SMS alerts to Security on emergency requests

---

*Built as a mini project at Bhavan's Sardar Patel Institute of Technology (SPIT), Mumbai.*
