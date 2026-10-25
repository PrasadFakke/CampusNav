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
6. **Indoor maps** — click a building with an orange "i" badge (e.g. SPIT) on the Campus Map, then press **Enter**. This opens a floor plan (`/indoor.html?building=spit`) where you can route between rooms across **Ground, 1st and 2nd floors** using Dijkstra, with approximate distances in metres. Each room shows a standard type icon (classroom, lab, office, library, stairs, lift…), and for multi-floor trips you can choose **Shortest / Stairs / Lift** (stairs vs lift distances are compared in the result).

6. **Voice assistant (everywhere)** — a floating 🎤 button on every signed-in page (Dashboard, Campus Map, Find Route, Nearest Facility, Emergency, Favourites, Admin, Indoor). Built on the browser's Web Speech API (`SpeechRecognition` to listen, `speechSynthesis` to talk back) — no API key, no extra npm packages. Find Route and Indoor also have an inline mic card.
   - **Routes (outdoor + indoor, from any page):** *"Take me to the library"*, *"From main entrance to canteen"*, *"Take me to Room 105"*, *"From room 008 to room 203 using the lift"*, *"Navigate to staircase 2 on second floor"*. It decides outdoor vs indoor automatically, opens the right page, draws the route and reads the directions aloud.
   - **Nearest facility:** *"Nearest canteen"*, *"Where can I eat"*, *"I'm hungry"*, *"Closest washroom"*.
   - **Emergency:** *"I need a doctor"* (medical route), *"Call security"*, or just *"Emergency"*.
   - **Favourites:** *"Add library to favourites"*, *"Remove canteen from favourites"*.
   - **Navigation:** *"Open dashboard"*, *"Open indoor map"*, *"Open favourites"*, *"Log out"*. Also *"What can I say"* and *"Stop"*.
   - A text box and one-tap example chips in the assistant panel work as a typed fallback (handy in Firefox or if the mic is unavailable).
   - Needs Chrome / Edge / Safari and `http://localhost` or `https://` (mic permission required). Chrome sends audio to Google's speech service, so internet is needed. After a page change, some browsers block auto-speech until you tap — use **🔊 Repeat**.
   - Code: `js/voice.js` (speech engine + place vocabulary), `js/voice-global.js` (intents + floating assistant), page hooks in `indoor.js`, `navigate.js`, `nearest.js`, `emergency.js`, `favourites.js`; styles in `css/voice.css`.

### Adding another indoor map
Edit `js/indoor-data.js`: add an entry to `INDOOR_PLANS` using the same id as the campus location (e.g. `spce`). Define `rooms` (drawn rectangles), `nodes` (places + hidden hall waypoints) and `edges` (distances are auto-calculated from coordinates, or give a 3rd value to override in metres).

## Structure

```
css/          dashboard.css  map.css  style.css  voice.css
js/           auth, app, sidebar, voice, voice-global, graph-data, indoor-data, indoor, map, navigate, nearest, emergency, favourites, admin, dashboard
models/       User.js  CampusState.js
public/       index, dashboard, map, indoor, navigate, nearest, emergency, favourites, admin
routes/       auth.js  favourites.js  campus.js
middleware/   auth.js
server.js
```
