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

const WALK_SPEED = 1.3; // metres / second
const places = Object.values(plan.byId).filter((n) => !n.hidden);
let activeFloorId = params.get('floor') && plan.floorById[params.get('floor')] ? params.get('floor') : plan.defaultFloor || plan.floors[0].id;
let fromId = null;
let toId = null;
let currentPath = null;
let roomFilter = '';

// accept ids with or without floor prefix (old links used e.g. "r008")
function resolveId(id) {
  if (!id) return null;
  if (plan.byId[id]) return id;
  for (const f of plan.floors) if (plan.byId[f.id + ':' + id]) return f.id + ':' + id;
  return null;
}

function activeFloor() { return plan.floorById[activeFloorId]; }

function isPathEdge(u, v, pathIds) {
  if (!pathIds || pathIds.length < 2) return false;
  for (let i = 0; i < pathIds.length - 1; i++) {
    if ((pathIds[i] === u && pathIds[i + 1] === v) || (pathIds[i] === v && pathIds[i + 1] === u)) return true;
  }
  return false;
}

function fmt(m) { return (Math.round(m * 10) / 10).toString(); }

// point at half the length of a polyline (for distance badge)
function polyMid(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let half = total / 2;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (half <= seg) {
      const t = seg ? half / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
    half -= seg;
  }
  return pts[pts.length - 1];
}

function floorsOnPath() {
  if (!currentPath) return [];
  const out = [];
  currentPath.forEach((id) => { const f = plan.byId[id].floorId; if (out[out.length - 1] !== f) out.push(f); });
  return out;
}

function renderFloorTabs() {
  const wrap = document.getElementById('floorTabs');
  if (!wrap) return;
  const onPath = floorsOnPath();
  wrap.innerHTML = '';
  plan.floors.forEach((f) => {
    const b = document.createElement('button');
    b.className = 'floor-tab' + (f.id === activeFloorId ? ' active' : '');
    b.innerHTML = f.tab + (onPath.includes(f.id) && onPath.length > 1 ? '<span class="dot"></span>' : '');
    b.addEventListener('click', () => setFloor(f.id));
    wrap.appendChild(b);
  });
  const idx = plan.floors.findIndex((f) => f.id === activeFloorId);
  const up = document.getElementById('floorUp');
  const down = document.getElementById('floorDown');
  if (up) up.disabled = idx >= plan.floors.length - 1;
  if (down) down.disabled = idx <= 0;
}

function setFloor(id) {
  if (!plan.floorById[id]) return;
  activeFloorId = id;
  const f = activeFloor();
  document.getElementById('bFloor').textContent = f.label;
  document.getElementById('indoorSvg').setAttribute('viewBox', f.viewBox);
  renderFloorTabs();
  renderRoomButtons();
  draw();
}

function stepFloor(dir) {
  const idx = plan.floors.findIndex((f) => f.id === activeFloorId) + dir;
  if (idx >= 0 && idx < plan.floors.length) setFloor(plan.floors[idx].id);
}

function draw() {
  const svg = document.getElementById('indoorSvg');
  if (!svg) return;
  const fl = activeFloor();
  const [, , VW, VH] = fl.viewBox.split(' ').map(Number);
  let h = '';

  h += `<rect x="0" y="0" width="${VW}" height="${VH}" rx="16" fill="#f8fafc"/>`;

  // outer walls
  if (fl.outline) {
    const o = fl.outline;
    h += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" rx="8"/>`;
  }
  (fl.shapes || []).forEach((s) => {
    h += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" rx="6" pointer-events="none"/>`;
  });
  (fl.blocked || []).forEach((b) => {
    h += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 5" rx="4" pointer-events="none"/>`;
    if (b.label) h += `<text x="${b.x + b.w / 2}" y="${b.y + b.h / 2}" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="700" pointer-events="none">${b.label}</text>`;
  });

  // rooms
  fl.rooms.forEach((r) => {
    const gid = fl.id + ':' + r.id;
    const isFrom = gid === fromId;
    const isTo = gid === toId;
    const isPath = currentPath && currentPath.includes(gid);
    const sel = isFrom ? '#10b981' : isTo ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
    const sw = (isFrom || isTo || isPath) ? 3 : 1.5;

    h += `<rect class="room-hit" data-id="${gid}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" stroke="${sel}" stroke-width="${sw}" rx="4"/>`;

    if (r.stairs) {
      if (r.w >= r.h) {
        for (let x = r.x + 8; x < r.x + r.w - 4; x += 9)
          h += `<line x1="${x}" y1="${r.y + 4}" x2="${x}" y2="${r.y + r.h - 4}" stroke="#d97706" stroke-width="1.5" pointer-events="none"/>`;
      } else {
        for (let y = r.y + 8; y < r.y + r.h - 4; y += 9)
          h += `<line x1="${r.x + 4}" y1="${y}" x2="${r.x + r.w - 4}" y2="${y}" stroke="#d97706" stroke-width="1.5" pointer-events="none"/>`;
      }
    }
    if (r.lift) {
      h += `<line x1="${r.x + 4}" y1="${r.y + 4}" x2="${r.x + r.w - 4}" y2="${r.y + r.h - 4}" stroke="#10b981" stroke-width="1.2" pointer-events="none"/>
            <line x1="${r.x + r.w - 4}" y1="${r.y + 4}" x2="${r.x + 4}" y2="${r.y + r.h - 4}" stroke="#10b981" stroke-width="1.2" pointer-events="none"/>`;
    }
  });

  // edges (polylines) + distance pills
  fl.edgeList.forEach((e) => {
    const onPath = isPathEdge(e.a, e.b, currentPath);
    const stroke = onPath ? '#4f46e5' : '#cbd5e1';
    const animClass = onPath ? 'class="path-edge-animated"' : '';
    const pts = e.pts.map((p) => p.join(',')).join(' ');
    h += `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${onPath ? 5 : 2}" stroke-linecap="round" stroke-linejoin="round" opacity="${onPath ? 1 : 0.6}" pointer-events="none" ${animClass}/>`;

    const [mx, my] = polyMid(e.pts);
    const label = fmt(e.m) + 'm';
    const w = label.length * 7.5 + 14;
    const badgeFill = onPath ? '#4f46e5' : '#ffffff';
    const badgeStroke = onPath ? '#4338ca' : '#cbd5e1';
    const badgeText = onPath ? '#ffffff' : '#475569';
    h += `<rect x="${mx - w / 2}" y="${my - 10}" width="${w}" height="20" rx="10" fill="${badgeFill}" stroke="${badgeStroke}" pointer-events="none"/>`;
    h += `<text x="${mx}" y="${my + 4.5}" text-anchor="middle" fill="${badgeText}" font-size="11" font-weight="700" pointer-events="none">${label}</text>`;
  });

  // corridor junctions
  Object.values(fl.byId).filter((n) => n.hidden).forEach((n) => {
    const on = currentPath && currentPath.includes(n.gid);
    h += `<circle cx="${n.x}" cy="${n.y}" r="${on ? 5.5 : 3.5}" fill="${on ? '#4f46e5' : '#94a3b8'}" pointer-events="none"/>`;
  });

  // place nodes
  places.filter((n) => n.floorId === fl.id).forEach((n) => {
    const isFrom = n.gid === fromId;
    const isTo = n.gid === toId;
    const onPath = currentPath && currentPath.includes(n.gid);
    let fill = '#ffffff', stroke = '#4f46e5', sw = 2.5, r = 14;

    if (isFrom) { fill = '#10b981'; stroke = '#047857'; sw = 3.5; r = 16; }
    else if (isTo) { fill = '#ef4444'; stroke = '#b91c1c'; sw = 3.5; r = 16; }
    else if (onPath) { fill = '#6366f1'; stroke = '#4338ca'; sw = 3; r = 15; }

    const dotInner = (!isFrom && !isTo && !onPath)
      ? `<circle cx="${n.x}" cy="${n.y}" r="5" fill="#6366f1"/>`
      : `<circle cx="${n.x}" cy="${n.y}" r="5" fill="#ffffff"/>`;

    let linkTag = '';
    if (n.link) {
      const tf = plan.byId[n.link.to].floorId;
      const up = plan.floors.findIndex((f) => f.id === tf) > plan.floors.findIndex((f) => f.id === fl.id);
      const t = (up ? '▲ ' : '▼ ') + plan.floorById[tf].tab;
      const tw = t.length * 6 + 12;
      linkTag = `<rect x="${n.x - tw / 2}" y="${n.y + r + 4}" width="${tw}" height="16" rx="8" fill="#fef3c7" stroke="#f59e0b" pointer-events="none"/>
        <text x="${n.x}" y="${n.y + r + 15.5}" text-anchor="middle" fill="#92400e" font-size="10" font-weight="700" pointer-events="none">${t}</text>`;
    }

    h += `<g class="indoor-node" data-id="${n.gid}">
      <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/>
      ${dotInner}
      <text x="${n.x}" y="${n.y - r - 6}" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="800">${n.label || n.name}</text>
      ${linkTag}
    </g>`;
  });

  // scale bar
  const sx = 30;
  const sy = VH - 10;
  h += `<g pointer-events="none"><line x1="${sx}" y1="${sy}" x2="${sx + 5 * fl.scale}" y2="${sy}" stroke="#64748b" stroke-width="2"/>
    <text x="${sx}" y="${sy - 6}" fill="#64748b" font-size="10" font-weight="600">0</text>
    <text x="${sx + 5 * fl.scale}" y="${sy - 6}" text-anchor="end" fill="#64748b" font-size="10" font-weight="600">5 m</text></g>`;

  svg.innerHTML = h;

  svg.querySelectorAll('.indoor-node, .room-hit').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      if (plan.byId[id] && !plan.byId[id].hidden) selectPlace(id);
    });
  });
}

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

  document.getElementById('fromName').innerHTML = fromId ? placeTitle(fromId) : 'Click a room';
  document.getElementById('toName').innerHTML = toId ? placeTitle(toId) : 'Click another room';
  document.getElementById('calcBtn').disabled = !(fromId && toId);
  document.getElementById('pathResult').style.display = 'none';
  renderFloorTabs();
  draw();
  updateButtonActiveStates();
}

function placeTitle(id) {
  const n = plan.byId[id];
  return `${n.name} <span class="floor-chip">${plan.floorById[n.floorId].tab}</span>`;
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
  const multi = floorsOnPath().length > 1;
  badge.textContent = `Dijkstra • Distance: ≈ ${fmt(result.distance)} m • ~${secs < 60 ? secs + ' sec' : Math.round(secs / 60) + ' min'} walk${multi ? ' • across floors' : ''}`;
  badge.style.background = 'var(--primary-light)';
  badge.style.color = 'var(--primary)';
  badge.style.borderColor = 'var(--primary-border)';

  // step rows (named places only) + floor change rows
  const rows = [];
  let acc = 0;
  for (let i = 0; i < result.path.length; i++) {
    const cur = plan.byId[result.path[i]];
    if (i > 0) {
      const prev = plan.byId[result.path[i - 1]];
      acc += plan.graph[prev.gid][cur.gid];
      if (prev.floorId !== cur.floorId) {
        const goingUp = plan.floors.findIndex((f) => f.id === cur.floorId) > plan.floors.findIndex((f) => f.id === prev.floorId);
        rows.push({ change: true, text: `${prev.link ? prev.link.kind : 'Stairs'} ${goingUp ? 'up' : 'down'} to ${plan.floorById[cur.floorId].tab}`, floor: cur.floorId });
      }
    }
    if (!cur.hidden) {
      rows.push({ name: cur.name, floor: cur.floorId, d: rows.some((r) => !r.change) ? acc : 0 });
      acc = 0;
    }
  }

  let n = 0;
  list.innerHTML = rows
    .map((r) => {
      if (r.change) {
        return `<div class="step-row change" data-floor="${r.floor}"><span class="n">⇅</span><span>${r.text}</span><span class="d">View ›</span></div>`;
      }
      n++;
      return `<div class="step-row" data-floor="${r.floor}"><span class="n">${n}</span><span>${r.name}${multi ? ` <span class="floor-chip">${plan.floorById[r.floor].tab}</span>` : ''}</span><span class="d">${n > 1 ? '≈ ' + fmt(r.d) + ' m' : 'Start'}</span></div>`;
    })
    .join('');
  list.querySelectorAll('.step-row[data-floor]').forEach((el) => {
    el.addEventListener('click', () => setFloor(el.getAttribute('data-floor')));
  });

  // jump to the starting floor so the route is visible
  activeFloorId = plan.byId[fromId].floorId;
  setFloor(activeFloorId);
  window.CampusApp.toast(`Indoor route: ~${fmt(result.distance)}m (${secs}s)`, 'success');
}

function updateButtonActiveStates() {
  document.querySelectorAll('.loc-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    btn.classList.toggle('active', id === fromId || id === toId);
  });
}

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('floorUp').addEventListener('click', () => stepFloor(1));
document.getElementById('floorDown').addEventListener('click', () => stepFloor(-1));

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
  renderFloorTabs();
  draw();
  updateButtonActiveStates();
  window.CampusApp.toast('Indoor selection cleared');
});

// Rooms & Labs list: grouped by floor, active floor first
function renderRoomButtons() {
  const locButtons = document.getElementById('locButtons');
  if (!locButtons) return;
  locButtons.innerHTML = '';
  const ordered = [activeFloor(), ...plan.floors.filter((f) => f.id !== activeFloorId)];
  ordered.forEach((f) => {
    const list = places.filter((n) => n.floorId === f.id && (!roomFilter || n.name.toLowerCase().includes(roomFilter)));
    if (!list.length) return;
    const head = document.createElement('div');
    head.className = 'floor-group';
    head.textContent = f.tab;
    locButtons.appendChild(head);
    list.forEach((n) => {
      const btn = document.createElement('button');
      btn.className = 'loc-btn' + (n.gid === fromId || n.gid === toId ? ' active' : '');
      btn.setAttribute('data-id', n.gid);
      btn.textContent = n.name;
      btn.addEventListener('click', () => selectPlace(n.gid));
      locButtons.appendChild(btn);
    });
  });
}

const roomSearch = document.getElementById('roomSearch');
if (roomSearch) {
  roomSearch.addEventListener('input', (e) => {
    roomFilter = e.target.value.trim().toLowerCase();
    renderRoomButtons();
  });
}

setFloor(activeFloorId);

const qf = resolveId(params.get('from'));
const qt = resolveId(params.get('to'));
if (qf && !plan.byId[qf].hidden) {
  selectPlace(qf);
  if (qt && !plan.byId[qt].hidden) {
    selectPlace(qt);
    calculate();
  }
}
