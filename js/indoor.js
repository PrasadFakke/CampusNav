window.CampusApp.requireAuth();

const params = new URLSearchParams(window.location.search);
const buildingId = params.get('building') || 'spit';
const plan = window.INDOOR_PLANS && window.INDOOR_PLANS[buildingId];

if (!plan) {
  document.querySelector('.main').innerHTML =
    '<h1>No indoor map</h1><p class="subtitle" style="margin:10px 0 20px;">This building does not have an indoor map yet.</p><a class="btn primary" href="/map.html">← Back to Campus Map</a>';
  throw new Error('No indoor plan for ' + buildingId);
}

document.title = 'CampusNav • ' + plan.shortName + ' Indoor';
document.getElementById('bName').textContent = plan.name;
document.getElementById('bFloor').textContent = plan.floor;
document.getElementById('indoorSvg').setAttribute('viewBox', plan.viewBox);

const WALK_SPEED = 1.3; // metres / second (approx.)
const places = plan.nodes.filter((n) => !n.hidden);
let fromId = null;
let toId = null;
let currentPath = null;

function isPathEdge(u, v, pathIds) {
  if (!pathIds || pathIds.length < 2) return false;
  for (let i = 0; i < pathIds.length - 1; i++) {
    if ((pathIds[i] === u && pathIds[i + 1] === v) || (pathIds[i] === v && pathIds[i + 1] === u)) return true;
  }
  return false;
}

function fmt(m) {
  return (Math.round(m * 10) / 10).toString();
}

function draw() {
  const svg = document.getElementById('indoorSvg');
  const o = plan.outline;
  let h = '';
  // background + outer walls
  h += `<rect x="0" y="0" width="990" height="420" rx="16" fill="#1a1a24"/>`;
  h += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#14141c" stroke="#6b7280" stroke-width="3"/>`;
  // rooms
  plan.rooms.forEach((r) => {
    const sel = r.id === fromId ? '#22c55e' : r.id === toId ? '#ef4444' : currentPath && currentPath.includes(r.id) ? '#6366f1' : '#6b7280';
    const sw = sel === '#6b7280' ? 2 : 3;
    h += `<rect class="room-hit" data-id="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" stroke="${sel}" stroke-width="${sw}"/>`;
    if (r.stairs) {
      for (let y = r.y + 8; y < r.y + r.h - 4; y += 9) {
        h += `<line x1="${r.x + 4}" y1="${y}" x2="${r.x + r.w - 4}" y2="${y}" stroke="#4b5563" stroke-width="1.5" pointer-events="none"/>`;
      }
    }
  });
  // edges + distance pills
  const drawn = new Set();
  Object.keys(plan.graph).forEach((u) => {
    Object.keys(plan.graph[u]).forEach((v) => {
      const key = [u, v].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);
      const A = plan.byId[u];
      const B = plan.byId[v];
      const onPath = isPathEdge(u, v, currentPath);
      h += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${onPath ? '#6366f1' : '#4b5563'}" stroke-width="${onPath ? 5 : 2}" stroke-linecap="round" opacity="${onPath ? 1 : 0.55}" pointer-events="none"/>`;
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      const label = fmt(plan.graph[u][v]) + 'm';
      const w = label.length * 7.5 + 12;
      h += `<rect x="${mx - w / 2}" y="${my - 10}" width="${w}" height="20" rx="10" fill="${onPath ? '#312e81' : '#1a1a24'}" stroke="${onPath ? '#818cf8' : '#3a3a4a'}" pointer-events="none"/>`;
      h += `<text x="${mx}" y="${my + 4.5}" text-anchor="middle" fill="${onPath ? '#c4b5fd' : '#9898a8'}" font-size="12" font-weight="600" pointer-events="none">${label}</text>`;
    });
  });
  // corridor waypoints (small dots)
  plan.nodes.filter((n) => n.hidden).forEach((n) => {
    const on = currentPath && currentPath.includes(n.id);
    h += `<circle cx="${n.x}" cy="${n.y}" r="${on ? 6 : 4}" fill="${on ? '#818cf8' : '#4b5563'}" pointer-events="none"/>`;
  });
  // place nodes
  places.forEach((n) => {
    const isFrom = n.id === fromId;
    const isTo = n.id === toId;
    const onPath = currentPath && currentPath.includes(n.id);
    let fill = '#4b5563', stroke = 'transparent', sw = 0, r = 14;
    if (isFrom) { fill = '#22c55e'; stroke = '#86efac'; sw = 3; r = 16; }
    else if (isTo) { fill = '#ef4444'; stroke = '#fca5a5'; sw = 3; r = 16; }
    else if (onPath) { fill = '#6366f1'; stroke = '#c4b5fd'; sw = 2; r = 15; }
    h += `<g class="indoor-node" data-id="${n.id}">
      <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      <text x="${n.x}" y="${n.y - r - 7}" text-anchor="middle" fill="#e5e5ef" font-size="17" font-weight="700">${n.label || n.name}</text>
    </g>`;
  });
  // scale bar
  h += `<g pointer-events="none"><line x1="${o.x}" y1="410" x2="${o.x + 5 * SCALE_PX()}" y2="410" stroke="#9898a8" stroke-width="2"/>
    <text x="${o.x}" y="404" fill="#9898a8" font-size="10">0</text>
    <text x="${o.x + 5 * SCALE_PX()}" y="404" text-anchor="end" fill="#9898a8" font-size="10">5 m</text></g>`;
  svg.innerHTML = h;
  svg.querySelectorAll('.indoor-node, .room-hit').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      if (plan.byId[id] && !plan.byId[id].hidden) selectPlace(id);
    });
  });
}

function SCALE_PX() { return 30.7; }

function selectPlace(id) {
  if (!fromId || (fromId && toId)) {
    fromId = id;
    toId = null;
    currentPath = null;
  } else if (id === fromId) {
    return;
  } else {
    toId = id;
  }
  document.getElementById('fromName').textContent = fromId ? plan.byId[fromId].name : 'Click a room';
  document.getElementById('toName').textContent = toId ? plan.byId[toId].name : 'Click another room';
  document.getElementById('calcBtn').disabled = !(fromId && toId);
  document.getElementById('pathResult').style.display = 'none';
  draw();
}

function calculate() {
  if (!fromId || !toId) return;
  const result = window.dijkstra(plan.graph, fromId, toId);
  const box = document.getElementById('pathResult');
  const badge = document.getElementById('pathBadge');
  const list = document.getElementById('pathList');
  box.style.display = 'block';
  if (!result) {
    badge.textContent = 'No path found';
    list.innerHTML = '';
    return;
  }
  currentPath = result.path;
  const secs = Math.round(result.distance / WALK_SPEED);
  badge.textContent = `Dijkstra • ≈ ${fmt(result.distance)} m • ~${secs < 60 ? secs + ' sec' : Math.round(secs / 60) + ' min'} walk`;
  badge.style.cssText =
    'display:inline-block;background:rgba(99,102,241,0.15);color:#a5b4fc;padding:5px 12px;border-radius:8px;font-size:0.8rem;font-weight:500;';
  // list only real places, with distance from the previous place
  const rows = [];
  let acc = 0;
  for (let i = 0; i < result.path.length; i++) {
    if (i > 0) acc += plan.graph[result.path[i - 1]][result.path[i]];
    const n = plan.byId[result.path[i]];
    if (!n.hidden) {
      rows.push({ name: n.name, d: rows.length ? acc : 0 });
      acc = 0;
    }
  }
  list.innerHTML = rows
    .map(
      (r, i) => `<div class="step-row"><span class="n">${i + 1}</span>${r.name}<span class="d">${i ? '≈ ' + fmt(r.d) + ' m' : 'start'}</span></div>`
    )
    .join('');
  draw();
}

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('clearBtn').addEventListener('click', () => {
  fromId = toId = currentPath = null;
  document.getElementById('fromName').textContent = 'Click a room';
  document.getElementById('toName').textContent = 'Click another room';
  document.getElementById('calcBtn').disabled = true;
  document.getElementById('pathResult').style.display = 'none';
  draw();
});

const locButtons = document.getElementById('locButtons');
places.forEach((n) => {
  const btn = document.createElement('button');
  btn.className = 'loc-btn';
  btn.textContent = n.name;
  btn.addEventListener('click', () => selectPlace(n.id));
  locButtons.appendChild(btn);
});

draw();

// optional deep link: /indoor.html?building=spit&from=entrance&to=r003
const qf = params.get('from');
const qt = params.get('to');
if (qf && plan.byId[qf] && !plan.byId[qf].hidden) {
  selectPlace(qf);
  if (qt && plan.byId[qt] && !plan.byId[qt].hidden) {
    selectPlace(qt);
    calculate();
  }
}
