window.CampusApp.requireAuth();

const locations = window.CAMPUS_LOCATIONS;
let blocked = [];
let fromId = null;
let toId = null;
let currentPath = null;
let favourites = [];

function liveGraph() {
  return window.graphWithoutBlocked(blocked);
}

function isPathEdge(u, v, pathIds) {
  if (!pathIds || pathIds.length < 2) return false;
  for (let i = 0; i < pathIds.length - 1; i++) {
    if ((pathIds[i] === u && pathIds[i + 1] === v) || (pathIds[i] === v && pathIds[i + 1] === u))
      return true;
  }
  return false;
}

function drawEdges(pathIds) {
  const layer = document.getElementById('edgesLayer');
  const drawn = new Set();
  let html = '';
  Object.keys(window.CAMPUS_GRAPH).forEach((u) => {
    const locU = locations.find((l) => l.id === u);
    if (!locU) return;
    Object.keys(window.CAMPUS_GRAPH[u] || {}).forEach((v) => {
      const key = window.edgeKey(u, v);
      if (drawn.has(key)) return;
      drawn.add(key);
      const locV = locations.find((l) => l.id === v);
      if (!locV) return;
      const weight = window.CAMPUS_GRAPH[u][v];
      const isBlocked = blocked.includes(key);
      const isPath = !isBlocked && isPathEdge(u, v, pathIds);
      const mx = (locU.x + locV.x) / 2;
      const my = (locU.y + locV.y) / 2;
      html += `<line x1="${locU.x}" y1="${locU.y}" x2="${locV.x}" y2="${locV.y}"
        stroke="${isBlocked ? '#ef4444' : isPath ? '#6366f1' : '#3a3a4a'}"
        stroke-width="${isPath ? 5 : 2}" stroke-linecap="round"
        stroke-dasharray="${isBlocked ? '7 5' : '0'}"
        opacity="${isBlocked ? 0.9 : isPath ? 1 : 0.5}"/>`;
      html += `<circle cx="${mx}" cy="${my}" r="10" fill="${isPath ? '#312e81' : '#1a1a24'}" stroke="${isBlocked ? '#ef4444' : isPath ? '#818cf8' : '#3a3a4a'}" stroke-width="1"/>`;
      html += `<text x="${mx}" y="${my + 3.5}" text-anchor="middle" fill="${isBlocked ? '#fca5a5' : isPath ? '#c4b5fd' : '#9898a8'}" font-size="10" font-weight="600">${isBlocked ? 'X' : weight}</text>`;
    });
  });
  layer.innerHTML = html;
}

function drawNodes() {
  const layer = document.getElementById('nodesLayer');
  let html = '';
  const lake = locations.find((l) => l.id === 'lake');
  if (lake) {
    html += `<ellipse cx="${lake.x}" cy="${lake.y}" rx="70" ry="55" fill="#3b82f6" opacity="0.45"/>`;
    html += `<text x="${lake.x}" y="${lake.y + 5}" text-anchor="middle" fill="white" font-size="13" font-weight="600">LAKE</text>`;
  }
  locations.forEach((loc) => {
    if (loc.id === 'lake') return;
    const isFrom = fromId === loc.id;
    const isTo = toId === loc.id;
    const onPath = currentPath && currentPath.includes(loc.id);
    let fill = '#4b5563';
    let stroke = 'transparent';
    let strokeW = 0;
    let r = 16;
    if (isFrom) {
      fill = '#22c55e';
      stroke = '#86efac';
      strokeW = 3;
      r = 18;
    } else if (isTo) {
      fill = '#ef4444';
      stroke = '#fca5a5';
      strokeW = 3;
      r = 18;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#c4b5fd';
      strokeW = 2;
      r = 17;
    }
    html += `<g class="building-node" data-id="${loc.id}" style="cursor:pointer">
      <circle cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <text x="${loc.x}" y="${loc.y + r + 14}" text-anchor="middle" fill="#e5e5ef" font-size="11" font-weight="500">${window.getShortLabel(loc.id)}</text>
    </g>`;
  });
  layer.innerHTML = html;
  document.querySelectorAll('.building-node').forEach((el) => {
    el.addEventListener('click', () => selectLocation(el.getAttribute('data-id')));
  });
}

function selectLocation(id) {
  if (!fromId || (fromId && toId)) {
    fromId = id;
    toId = null;
    currentPath = null;
  } else if (id === fromId) {
    return;
  } else {
    toId = id;
  }
  document.getElementById('fromName').textContent = fromId ? window.getLocationName(fromId) : 'Click a building';
  document.getElementById('toName').textContent = toId ? window.getLocationName(toId) : 'Click another building';
  document.getElementById('calcBtn').disabled = !(fromId && toId);
  document.getElementById('favBtn').disabled = !fromId;
  document.getElementById('favBtn').textContent = favourites.includes(fromId)
    ? 'Saved in Favourites'
    : 'Save From as Favourite';
  if (fromId) {
    document.getElementById('goRouteBtn').href = `/navigate.html?from=${fromId}${toId ? '&to=' + toId : ''}`;
  }
  document.getElementById('pathResult').style.display = 'none';
  drawEdges(null);
  drawNodes();
}

function calculatePath() {
  if (!fromId || !toId) return;
  const result = window.dijkstra(liveGraph(), fromId, toId);
  const resultDiv = document.getElementById('pathResult');
  const list = document.getElementById('pathList');
  const badge = document.getElementById('pathBadge');
  if (!result) {
    badge.textContent = blocked.length
      ? 'No path — a blocked road closed this route. Try Admin to unblock, or another destination.'
      : 'No path found';
    list.innerHTML = '';
    resultDiv.style.display = 'block';
    return;
  }
  currentPath = result.path;
  badge.textContent = `Dijkstra • Distance: ${result.distance} units` + (blocked.length ? ' (avoiding blocked roads)' : '');
  badge.style.cssText =
    'display:inline-block;background:rgba(99,102,241,0.15);color:#a5b4fc;padding:5px 12px;border-radius:8px;font-size:0.8rem;font-weight:500;';
  list.innerHTML = result.path
    .map(
      (id, i) => `<li style="padding:8px 0;border-bottom:1px solid #2a2a3a;display:flex;align-items:center;gap:10px;">
      <span style="width:24px;height:24px;background:rgba(99,102,241,0.2);color:#a5b4fc;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;">${i + 1}</span>
      ${window.getLocationName(id)}</li>`
    )
    .join('');
  resultDiv.style.display = 'block';
  drawEdges(result.path);
  drawNodes();
}

document.getElementById('calcBtn').addEventListener('click', calculatePath);
document.getElementById('clearBtn').addEventListener('click', () => {
  fromId = null;
  toId = null;
  currentPath = null;
  document.getElementById('fromName').textContent = 'Click a building';
  document.getElementById('toName').textContent = 'Click another building';
  document.getElementById('calcBtn').disabled = true;
  document.getElementById('favBtn').disabled = true;
  document.getElementById('pathResult').style.display = 'none';
  document.getElementById('goRouteBtn').href = '/navigate.html';
  drawEdges(null);
  drawNodes();
});

document.getElementById('favBtn').addEventListener('click', async () => {
  if (!fromId) return;
  try {
    if (favourites.includes(fromId)) {
      const data = await window.CampusApp.api('/api/favourites/' + fromId, { method: 'DELETE' });
      favourites = data.favourites || [];
    } else {
      const data = await window.CampusApp.api('/api/favourites', {
        method: 'POST',
        body: JSON.stringify({ locationId: fromId })
      });
      favourites = data.favourites || [];
    }
    document.getElementById('favBtn').textContent = favourites.includes(fromId)
      ? 'Saved in Favourites'
      : 'Save From as Favourite';
  } catch (err) {
    alert(err.message);
  }
});

const locButtons = document.getElementById('locButtons');
locations
  .filter((l) => l.id !== 'lake')
  .forEach((loc) => {
    const btn = document.createElement('button');
    btn.className = 'loc-btn';
    btn.textContent = loc.name;
    btn.addEventListener('click', () => selectLocation(loc.id));
    locButtons.appendChild(btn);
  });

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {}
  try {
    const fav = await window.CampusApp.api('/api/favourites');
    favourites = fav.favourites || [];
  } catch (_) {}
  drawEdges(null);
  drawNodes();
})();
