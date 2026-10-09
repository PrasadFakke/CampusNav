# CampusNav

Smart Campus Navigation — login, campus graph, Dijkstra, BFS nearest facility, blocked-road alternatives, emergency routes, favourites, admin.

## Run

```
copy .env.example .env
# put your MongoDB URI in .env
npm install
npm start
```

Open http://localhost:3000

## Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin (auto-created) | `admin` | `Admin@123` |
| Student | register on the login page | min 6 chars |

## Features

1. **Nearest facility** — BFS from your location to Library / Canteen / Medical / etc.
2. **Blocked roads** — Admin closes an edge; Dijkstra finds an alternative path.
3. **Emergency** — fastest path to Medical or Security.
4. **Admin** — save road closures in MongoDB.
5. **Favourites** — saved on the user document in MongoDB.
6. **Indoor maps** — click a building with an orange "i" badge (e.g. SPIT) on the Campus Map, then press **Enter**. This opens a floor plan (`/indoor.html?building=spit`) where you can route between rooms (Entrance, 008, 003, 001, Office, Stairs, Xerox) using Dijkstra, with approximate distances in metres.

### Adding another indoor map
Edit `js/indoor-data.js`: add an entry to `INDOOR_PLANS` using the same id as the campus location (e.g. `spce`). Define `rooms` (drawn rectangles), `nodes` (places + hidden hall waypoints) and `edges` (distances are auto-calculated from coordinates, or give a 3rd value to override in metres).

## Structure

```
css/          dashboard.css  map.css  style.css
js/           auth, app, sidebar, graph-data, indoor-data, indoor, map, navigate, nearest, emergency, favourites, admin, dashboard
models/       User.js  CampusState.js
public/       index, dashboard, map, indoor, navigate, nearest, emergency, favourites, admin
routes/       auth.js  favourites.js  campus.js
middleware/   auth.js
server.js
```
