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

## Structure

```
css/          dashboard.css  map.css  style.css
js/           auth, app, sidebar, graph-data, map, navigate, nearest, emergency, favourites, admin, dashboard
models/       User.js  CampusState.js
public/       index, dashboard, map, navigate, nearest, emergency, favourites, admin
routes/       auth.js  favourites.js  campus.js
middleware/   auth.js
server.js
```
