window.CampusApp.requireAuth();

const params = new URLSearchParams(window.location.search);
const buildingId = params.get('building') || 'spit';
const plan = window.INDOOR_PLANS && window.INDOOR_PLANS[buildingId];

if (!plan) {
  document.querySelector('.main').innerHTML =
    '<h1>No indoor map</h1><p class="subtitle" style="margin:10px 0 20px;">This building does not have an indoor floor map yet.</p><a class="btn primary" href="/map.html">← Back to Campus Map</a>';
  throw new Error('No indoor plan for ' + buildingId);
}

document.title = 'CampusNav • ' + plan.shortName + ' Indoor';
document.getElementById('bName').textContent = plan.name;
document.getElementById('bFloor').textContent = plan.floor;
document.getElementById('indoorSvg').setAttribute('viewBox', plan.viewBox);

const WALK_SPEED = 1.3; // metres / second
const places = plan.nodes.filter((n) => !n.hidden);
let fromId = null;
let toId = null;
let currentPath = null;
let roomFilter = '';

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
  if (!svg) return;
  const o = plan.outline;
  let h = '';

  // Background canvas + outer walls
  h += `<rect x="0" y="0" width="990" height="420" rx="16" fill="#f8fafc"/>`;
  h += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" rx="8"/>`;

  // Rooms
  plan.rooms.forEach((r) => {
    const isFrom = r.id === fromId;
    const isTo = r.id === toId;
    const isPath = currentPath && currentPath.includes(r.id);
    const sel = isFrom ? '#10b981' : isTo ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
    const sw = (isFrom || isTo || isPath) ? 3 : 1.5;

    h += `<rect class="room-hit" data-id="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" stroke="${sel}" stroke-width="${sw}" rx="4"/>`;

    if (r.stairs) {
      for (let y = r.y + 8; y < r.y + r.h - 4; y += 9) {
        h += `<line x1="${r.x + 4}" y1="${y}" x2="${r.x + r.w - 4}" y2="${y}" stroke="#d97706" stroke-width="1.5" pointer-events="none"/>`;
      }
    }
  });

  // Edges + distance pills
  const drawn = new Set();
  Object.keys(plan.graph).forEach((u) => {
    Object.keys(plan.graph[u]).forEach((v) => {
      const key = [u, v].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);
      const A = plan.byId[u];
      const B = plan.byId[v];
      const onPath = isPathEdge(u, v, currentPath);

      const stroke = onPath ? '#4f46e5' : '#cbd5e1';
      const animClass = onPath ? 'class="path-edge-animated"' : '';
      h += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${stroke}" stroke-width="${onPath ? 5 : 2}" stroke-linecap="round" opacity="${onPath ? 1 : 0.6}" pointer-events="none" ${animClass}/>`;

      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      const label = fmt(plan.graph[u][v]) + 'm';
      const w = label.length * 7.5 + 14;

      const badgeFill = onPath ? '#4f46e5' : '#ffffff';
      const badgeStroke = onPath ? '#4338ca' : '#cbd5e1';
      const badgeText = onPath ? '#ffffff' : '#475569';

      h += `<rect x="${mx - w / 2}" y="${my - 10}" width="${w}" height="20" rx="10" fill="${badgeFill}" stroke="${badgeStroke}" pointer-events="none"/>`;
      h += `<text x="${mx}" y="${my + 4.5}" text-anchor="middle" fill="${badgeText}" font-size="11" font-weight="700" pointer-events="none">${label}</text>`;
    });
  });

  // Corridor waypoints (small dots)
  plan.nodes.filter((n) => n.hidden).forEach((n) => {
    const on = currentPath && currentPath.includes(n.id);
    h += `<circle cx="${n.x}" cy="${n.y}" r="${on ? 5.5 : 3.5}" fill="${on ? '#4f46e5' : '#94a3b8'}" pointer-events="none"/>`;
  });

  // Place nodes
  places.forEach((n) => {
    const isFrom = n.id === fromId;
    const isTo = n.id === toId;
    const onPath = currentPath && currentPath.includes(n.id);
    let fill = '#ffffff', stroke = '#4f46e5', sw = 2.5, r = 14;

    if (isFrom) { fill = '#10b981'; stroke = '#047857'; sw = 3.5; r = 16; }
    else if (isTo) { fill = '#ef4444'; stroke = '#b91c1c'; sw = 3.5; r = 16; }
    else if (onPath) { fill = '#6366f1'; stroke = '#4338ca'; sw = 3; r = 15; }

    const dotInner = (!isFrom && !isTo && !onPath)
      ? `<circle cx="${n.x}" cy="${n.y}" r="5" fill="#6366f1"/>`
      : `<circle cx="${n.x}" cy="${n.y}" r="5" fill="#ffffff"/>`;

    h += `<g class="indoor-node" data-id="${n.id}">
      <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/>
      ${dotInner}
      <text x="${n.x}" y="${n.y - r - 6}" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="800">${n.label || n.name}</text>
    </g>`;
  });

  // Scale bar
  h += `<g pointer-events="none"><line x1="${o.x}" y1="410" x2="${o.x + 5 * SCALE_PX()}" y2="410" stroke="#64748b" stroke-width="2"/>
    <text x="${o.x}" y="404" fill="#64748b" font-size="10" font-weight="600">0</text>
    <text x="${o.x + 5 * SCALE_PX()}" y="404" text-anchor="end" fill="#64748b" font-size="10" font-weight="600">5 m</text></g>`;

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

  const fromBox = document.getElementById('fromBox');
  const toBox = document.getElementById('toBox');
  if (fromBox) fromBox.classList.toggle('active', !!fromId);
  if (toBox) toBox.classList.toggle('active', !!toId);

  document.getElementById('fromName').textContent = fromId ? plan.byId[fromId].name : 'Click a room';
  document.getElementById('toName').textContent = toId ? plan.byId[toId].name : 'Click another room';
  document.getElementById('calcBtn').disabled = !(fromId && toId);
  document.getElementById('pathResult').style.display = 'none';
  draw();
  updateButtonActiveStates();
}

function calculate() {
  if (!fromId || !toId) return;
  const result = window.dijkstra(plan.graph, fromId, toId);
  const box = document.getElementById('pathResult');
  const badge = document.getElementById('pathBadge');
  const list = document.getElementById('pathList');
  box.style.display = 'block';

  if (!result) {
    badge.textContent = 'No indoor path found between these rooms';
    badge.style.background = '#fef2f2';
    badge.style.color = '#dc2626';
    badge.style.borderColor = '#fecaca';
    list.innerHTML = '';
    return;
  }

  currentPath = result.path;
  const secs = Math.round(result.distance / WALK_SPEED);
  badge.textContent = `Dijkstra • Distance: ≈ ${fmt(result.distance)} m • ~${secs < 60 ? secs + ' sec' : Math.round(secs / 60) + ' min'} walk`;
  badge.style.background = 'var(--primary-light)';
  badge.style.color = 'var(--primary)';
  badge.style.borderColor = 'var(--primary-border)';

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
      (r, i) => `<div class="step-row"><span class="n">${i + 1}</span><span>${r.name}</span><span class="d">${i ? '≈ ' + fmt(r.d) + ' m' : 'Start'}</span></div>`
    )
    .join('');

  draw();
  window.CampusApp.toast(`Indoor route: ~${fmt(result.distance)}m (${secs}s)`, 'success');
}

function updateButtonActiveStates() {
  document.querySelectorAll('.loc-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    btn.classList.toggle('active', id === fromId || id === toId);
  });
}

document.getElementById('calcBtn').addEventListener('click', calculate);

document.getElementById('clearBtn').addEventListener('click', () => {
  fromId = toId = currentPath = null;
  document.getElementById('fromName').textContent = 'Click a room';
  document.getElementById('toName').textContent = 'Click another room';
  const fromBox = document.getElementById('fromBox');
  const toBox = document.getElementById('toBox');
  if (fromBox) fromBox.classList.remove('active');
  if (toBox) toBox.classList.remove('active');
  document.getElementById('calcBtn').disabled = true;
  document.getElementById('pathResult').style.display = 'none';
  draw();
  updateButtonActiveStates();
  window.CampusApp.toast('Indoor selection cleared');
});

function renderRoomButtons() {
  const locButtons = document.getElementById('locButtons');
  if (!locButtons) return;
  locButtons.innerHTML = '';
  const filtered = places.filter((n) => !roomFilter || n.name.toLowerCase().includes(roomFilter));

  filtered.forEach((n) => {
    const btn = document.createElement('button');
    btn.className = 'loc-btn' + (n.id === fromId || n.id === toId ? ' active' : '');
    btn.setAttribute('data-id', n.id);
    btn.textContent = n.name;
    btn.addEventListener('click', () => selectPlace(n.id));
    locButtons.appendChild(btn);
  });
}

const roomSearch = document.getElementById('roomSearch');
if (roomSearch) {
  roomSearch.addEventListener('input', (e) => {
    roomFilter = e.target.value.trim().toLowerCase();
    renderRoomButtons();
  });
}

renderRoomButtons();
draw();

const qf = params.get('from');
const qt = params.get('to');
if (qf && plan.byId[qf] && !plan.byId[qf].hidden) {
  selectPlace(qf);
  if (qt && plan.byId[qt] && !plan.byId[qt].hidden) {
    selectPlace(qt);
    calculate();
  }
}
