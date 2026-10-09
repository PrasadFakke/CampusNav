window.CampusApp.requireAuth();

const locations = window.CAMPUS_LOCATIONS;
let blocked = [];
let fromId = null;
let toId = null;
let currentPath = null;
let favourites = [];
let focusId = null;
let searchQuery = '';

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
  if (!layer) return;
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

      const strokeColor = isBlocked ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
      const strokeWidth = isPath ? 5.5 : 2.5;
      const animClass = isPath ? 'class="path-edge-animated"' : '';
      const dashArray = isBlocked ? '7 5' : '0';
      const opacity = isBlocked ? 0.95 : isPath ? 1 : 0.7;

      html += `<line x1="${locU.x}" y1="${locU.y}" x2="${locV.x}" y2="${locV.y}"
        stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"
        stroke-dasharray="${dashArray}" opacity="${opacity}" ${animClass}/>`;

      const circleFill = isPath ? '#4f46e5' : isBlocked ? '#fef2f2' : '#ffffff';
      const circleStroke = isBlocked ? '#ef4444' : isPath ? '#4338ca' : '#cbd5e1';
      const textColor = isPath ? '#ffffff' : isBlocked ? '#dc2626' : '#475569';

      html += `<circle cx="${mx}" cy="${my}" r="11" fill="${circleFill}" stroke="${circleStroke}" stroke-width="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"/>`;
      html += `<text x="${mx}" y="${my + 4}" text-anchor="middle" fill="${textColor}" font-size="10.5" font-weight="700">${isBlocked ? '✕' : weight}</text>`;
    });
  });

  layer.innerHTML = html;
}

function drawNodes() {
  const layer = document.getElementById('nodesLayer');
  if (!layer) return;
  let html = '';

  const lake = locations.find((l) => l.id === 'lake');
  if (lake) {
    html += `<ellipse cx="${lake.x}" cy="${lake.y}" rx="72" ry="56" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2.5" opacity="0.9"/>`;
    html += `<text x="${lake.x}" y="${lake.y + 5}" text-anchor="middle" fill="#0284c7" font-size="13" font-weight="800" letter-spacing="1">LAKE</text>`;
  }

  locations.forEach((loc) => {
    if (loc.id === 'lake') return;
    const isFrom = fromId === loc.id;
    const isTo = toId === loc.id;
    const onPath = currentPath && currentPath.includes(loc.id);
    const matchesSearch = searchQuery && loc.name.toLowerCase().includes(searchQuery);

    let fill = '#ffffff';
    let stroke = '#4f46e5';
    let strokeW = 2.5;
    let r = 16;
    let labelColor = '#1e293b';

    if (isFrom) {
      fill = '#10b981';
      stroke = '#047857';
      strokeW = 3.5;
      r = 18;
    } else if (isTo) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      strokeW = 3.5;
      r = 18;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#4338ca';
      strokeW = 3;
      r = 17;
    } else if (matchesSearch) {
      fill = '#fef08a';
      stroke = '#ca8a04';
      strokeW = 3;
      r = 17;
    }

    const dotInner = (!isFrom && !isTo && !onPath)
      ? `<circle cx="${loc.x}" cy="${loc.y}" r="6" fill="#6366f1"/>`
      : `<circle cx="${loc.x}" cy="${loc.y}" r="6" fill="#ffffff"/>`;

    html += `<g class="building-node" data-id="${loc.id}">
      <circle cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/>
      ${dotInner}
      <text x="${loc.x}" y="${loc.y + r + 15}" text-anchor="middle" fill="${labelColor}" font-size="11.5" font-weight="700">${window.getShortLabel(loc.id)}</text>
      ${window.hasIndoorMap(loc.id) ? `<circle cx="${loc.x + 13}" cy="${loc.y - 13}" r="8" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/><text x="${loc.x + 13}" y="${loc.y - 9.5}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="800" pointer-events="none">i</text>` : ''}
    </g>`;
  });

  if (focusId && window.hasIndoorMap(focusId)) {
    const f = locations.find((l) => l.id === focusId);
    const plan = window.INDOOR_PLANS[focusId];
    if (f && plan) {
      const label = 'Enter ' + plan.shortName + ' Plan ▸';
      const w = label.length * 7.5 + 24;
      const px = Math.min(Math.max(f.x, w / 2 + 10), 800 - w / 2 - 10);
      const py = f.y - 54;
      html += `<g class="enter-pop" data-building="${focusId}" style="cursor:pointer">
        <rect x="${px - w / 2}" y="${py - 15}" width="${w}" height="32" rx="16" fill="#f59e0b" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(245,158,11,0.35))"/>
        <text x="${px}" y="${py + 6}" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="800">${label}</text>
        <path d="M${f.x - 7} ${py + 17} L${f.x} ${py + 26} L${f.x + 7} ${py + 17} Z" fill="#f59e0b"/>
      </g>`;
    }
  }

  layer.innerHTML = html;

  document.querySelectorAll('.enter-pop').forEach((el) => {
    el.addEventListener('click', () => enterBuilding(el.getAttribute('data-building')));
  });

  document.querySelectorAll('.building-node').forEach((el) => {
    el.addEventListener('click', () => selectLocation(el.getAttribute('data-id')));
    el.addEventListener('dblclick', () => {
      const id = el.getAttribute('data-id');
      if (window.hasIndoorMap(id)) enterBuilding(id);
    });
  });
}

function enterBuilding(id) {
  window.location.href = '/indoor.html?building=' + encodeURIComponent(id);
}

function updateBuildingAction() {
  const box = document.getElementById('buildingAction');
  if (!box) return;
  if (focusId && window.hasIndoorMap(focusId)) {
    const plan = window.INDOOR_PLANS[focusId];
    document.getElementById('buildingActionName').textContent = plan.name;
    document.getElementById('enterBuildingBtn').onclick = () => enterBuilding(focusId);
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

function selectLocation(id) {
  focusId = id;
  updateBuildingAction();

  if (!fromId || (fromId && toId)) {
    fromId = id;
    toId = null;
    currentPath = null;
  } else if (id === fromId) {
    drawNodes();
    return;
  } else {
    toId = id;
  }

  const fromBox = document.getElementById('fromBox');
  const toBox = document.getElementById('toBox');

  if (fromBox) fromBox.classList.toggle('active', !!fromId);
  if (toBox) toBox.classList.toggle('active', !!toId);

  document.getElementById('fromName').textContent = fromId ? window.getLocationName(fromId) : 'Click a building';
  document.getElementById('toName').textContent = toId ? window.getLocationName(toId) : 'Click another building';
  document.getElementById('calcBtn').disabled = !(fromId && toId);
  document.getElementById('favBtn').disabled = !fromId;
  document.getElementById('favBtn').textContent = favourites.includes(fromId)
    ? '★ Saved in Favourites'
    : '☆ Save From as Favourite';

  if (fromId) {
    document.getElementById('goRouteBtn').href = `/navigate.html?from=${fromId}${toId ? '&to=' + toId : ''}`;
  }

  document.getElementById('pathResult').style.display = 'none';
  drawEdges(null);
  drawNodes();
  updateButtonActiveStates();
}

function calculatePath() {
  if (!fromId || !toId) return;
  const result = window.dijkstra(liveGraph(), fromId, toId);
  const resultDiv = document.getElementById('pathResult');
  const list = document.getElementById('pathList');
  const badge = document.getElementById('pathBadge');

  if (!result) {
    badge.textContent = blocked.length
      ? 'No route available — road closures block all paths. Check Admin panel.'
      : 'No route found between these locations.';
    badge.style.background = '#fef2f2';
    badge.style.color = '#dc2626';
    badge.style.borderColor = '#fecaca';
    list.innerHTML = '';
    resultDiv.style.display = 'block';
    return;
  }

  currentPath = result.path;
  badge.textContent = `Dijkstra Optimal Route • Distance: ${result.distance} units` + (blocked.length ? ' (avoiding road blocks)' : '');
  badge.style.background = 'var(--primary-light)';
  badge.style.color = 'var(--primary)';
  badge.style.borderColor = 'var(--primary-border)';

  list.innerHTML = result.path
    .map(
      (id, i) => `<li>
      <span class="step-num">${i + 1}</span>
      <span>${window.getLocationName(id)}</span>
      ${i === 0 ? '<span class="loc-type" style="margin-left:auto;">Start</span>' : i === result.path.length - 1 ? '<span class="loc-type" style="margin-left:auto;background:#ecfdf5;color:#059669;">Destination</span>' : ''}
      </li>`
    )
    .join('');

  resultDiv.style.display = 'block';
  drawEdges(result.path);
  drawNodes();
  window.CampusApp.toast(`Route computed: ${result.distance} units across ${result.path.length} stops`, 'success');
}

function updateButtonActiveStates() {
  document.querySelectorAll('.loc-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    btn.classList.toggle('active', id === fromId || id === toId);
  });
}

document.getElementById('calcBtn').addEventListener('click', calculatePath);

document.getElementById('clearBtn').addEventListener('click', () => {
  focusId = null;
  updateBuildingAction();
  fromId = null;
  toId = null;
  currentPath = null;
  document.getElementById('fromName').textContent = 'Click a building';
  document.getElementById('toName').textContent = 'Click another building';
  const fromBox = document.getElementById('fromBox');
  const toBox = document.getElementById('toBox');
  if (fromBox) fromBox.classList.remove('active');
  if (toBox) toBox.classList.remove('active');
  document.getElementById('calcBtn').disabled = true;
  document.getElementById('favBtn').disabled = true;
  document.getElementById('pathResult').style.display = 'none';
  document.getElementById('goRouteBtn').href = '/navigate.html';
  drawEdges(null);
  drawNodes();
  updateButtonActiveStates();
  window.CampusApp.toast('Selection cleared');
});

document.getElementById('favBtn').addEventListener('click', async () => {
  if (!fromId) return;
  try {
    if (favourites.includes(fromId)) {
      const data = await window.CampusApp.api('/api/favourites/' + fromId, { method: 'DELETE' });
      favourites = data.favourites || [];
      window.CampusApp.toast(`Removed ${window.getLocationName(fromId)} from favourites`);
    } else {
      const data = await window.CampusApp.api('/api/favourites', {
        method: 'POST',
        body: JSON.stringify({ locationId: fromId })
      });
      favourites = data.favourites || [];
      window.CampusApp.toast(`Saved ${window.getLocationName(fromId)} to favourites!`, 'success');
    }
    document.getElementById('favBtn').textContent = favourites.includes(fromId)
      ? '★ Saved in Favourites'
      : '☆ Save From as Favourite';
  } catch (err) {
    window.CampusApp.toast(err.message, 'error');
  }
});

function renderLocButtons() {
  const locButtons = document.getElementById('locButtons');
  if (!locButtons) return;
  locButtons.innerHTML = '';
  const filtered = locations
    .filter((l) => l.id !== 'lake')
    .filter((l) => !searchQuery || l.name.toLowerCase().includes(searchQuery));

  filtered.forEach((loc) => {
    const btn = document.createElement('button');
    btn.className = 'loc-btn' + (loc.id === fromId || loc.id === toId ? ' active' : '');
    btn.setAttribute('data-id', loc.id);
    btn.innerHTML = `<span>${loc.name}</span>`;
    btn.addEventListener('click', () => selectLocation(loc.id));
    locButtons.appendChild(btn);
  });

  const countEl = document.getElementById('locMatchCount');
  if (countEl) countEl.textContent = `${filtered.length} places`;
}

const searchInput = document.getElementById('mapSearch');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderLocButtons();
    drawNodes();
  });
}

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {}
  try {
    const fav = await window.CampusApp.api('/api/favourites');
    favourites = fav.favourites || [];
  } catch (_) {}
  renderLocButtons();
  drawEdges(null);
  drawNodes();
})();
