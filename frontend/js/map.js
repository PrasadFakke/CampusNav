window.CampusApp.requireAuth();

const mapParams = new URLSearchParams(window.location.search);
const embeddedMap = mapParams.get('embedded') === '1';
if (embeddedMap) document.body.classList.add('embedded-campus-map');

if (!window.animateRouteWalker) {
  const iconScript = document.createElement('script');
  iconScript.src = '/js/node-icons.js';
  document.head.appendChild(iconScript);
}

window.CAMPUS_NODE_ICONS = window.CAMPUS_NODE_ICONS || {
  'entrance': '🚪', 'spit': '🏫', 'spce': '🏛️', 'workshop': '🔧', 'library': '📚',
  'lib-ext': '📖', 'bhavans-college': '🎓', 'cultural': '🎭', 'spjimr': '🏢',
  'spjimr-hostel': '🛏️', 'hostel': '🏠', 'wadia': '🏫', 'sports-complex': '🏟️',
  'playground': '⚽', 'lake': '💧', 'canteen': '🍽️', 'medical': '🏥', 'security': '🛡️'
};
window.getNodeIcon = window.getNodeIcon || function (id) {
  return window.CAMPUS_NODE_ICONS[id] || '📍';
};

const locations = window.CAMPUS_LOCATIONS;
let blocked = [];
let fromId = null;
let toId = null;
let currentPath = null;
let favourites = [];
let focusId = null;
let searchQuery = '';
let embeddedMapReady = false;
let queuedEmbeddedRoute = null;

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
  const lake = locations.find((loc) => loc.id === 'lake');
  if (lake) {
    html += `<ellipse cx="${lake.x}" cy="${lake.y}" rx="86" ry="68" fill="none"
      stroke="#cbd5e1" stroke-width="2.5" opacity="0.7" pointer-events="none"/>`;
  }

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
      const edgePoints = window.getEdgeDisplayPoints(locU, locV, 86, 68);
      const mx = (edgePoints.x1 + edgePoints.x2) / 2;
      const my = (edgePoints.y1 + edgePoints.y2) / 2;

      const strokeColor = isBlocked ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
      const strokeWidth = isPath ? 5.5 : 2.5;
      const animClass = isPath ? 'class="path-edge-animated"' : '';
      const dashArray = isBlocked ? '7 5' : '0';
      const opacity = isBlocked ? 0.95 : isPath ? 1 : 0.7;

      html += `<line x1="${edgePoints.x1}" y1="${edgePoints.y1}" x2="${edgePoints.x2}" y2="${edgePoints.y2}"
        stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"
        stroke-dasharray="${dashArray}" opacity="${opacity}" ${animClass}/>`;

      const circleFill = isPath ? '#4f46e5' : isBlocked ? '#fef2f2' : '#ffffff';
      const circleStroke = isBlocked ? '#ef4444' : isPath ? '#4338ca' : '#cbd5e1';
      const textColor = isPath ? '#ffffff' : isBlocked ? '#dc2626' : '#475569';

      html += `<circle cx="${mx}" cy="${my}" r="11" fill="${circleFill}" stroke="${circleStroke}" stroke-width="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"/>`;
      html += `<text x="${mx}" y="${my + 4}" text-anchor="middle" fill="${textColor}" font-size="10.5" font-weight="700">${isBlocked ? '✕' : weight}</text>`;
    });
  });

  if (pathIds && pathIds.length > 2) {
    for (let i = 1; i < pathIds.length - 1; i++) {
      if (pathIds[i] !== 'lake') continue;
      const from = locations.find((loc) => loc.id === pathIds[i - 1]);
      const to = locations.find((loc) => loc.id === pathIds[i + 1]);
      if (!from || !to) continue;
      const lakeArc = window.getLakeArc(from, to, 86, 68);
      if (lakeArc) {
        html += `<path d="${lakeArc.fullD}" fill="none" stroke="#4f46e5" stroke-width="5.5"
          stroke-linecap="round" stroke-linejoin="round" class="path-edge-animated" pointer-events="none"/>`;
      }
    }
  }

  layer.innerHTML = html;
}

function drawNodes() {
  const layer = document.getElementById('nodesLayer');
  if (!layer) return;
  let html = '';

  const lake = locations.find((l) => l.id === 'lake');
  if (lake) {
    html += `
      <g class="lake-promenade-group" pointer-events="none">
        <ellipse cx="${lake.x}" cy="${lake.y}" rx="72" ry="56" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="2" />
        <ellipse cx="${lake.x}" cy="${lake.y}" rx="68" ry="52" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2.5" opacity="0.95" />
        <path d="M ${lake.x - 24} ${lake.y - 18} Q ${lake.x - 16} ${lake.y - 22} ${lake.x - 8} ${lake.y - 18} T ${lake.x + 8} ${lake.y - 18}" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
        <path d="M ${lake.x + 6} ${lake.y + 12} Q ${lake.x + 14} ${lake.y + 8} ${lake.x + 22} ${lake.y + 12} T ${lake.x + 38} ${lake.y + 12}" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
        <text x="${lake.x}" y="${lake.y - 4}" text-anchor="middle" dominant-baseline="central" font-size="22" style="user-select:none;">💧</text>
        <text x="${lake.x}" y="${lake.y + 16}" text-anchor="middle" fill="#0284c7" font-size="12" font-weight="800" letter-spacing="1">LAKE</text>
        <text x="${lake.x}" y="${lake.y + 28}" text-anchor="middle" fill="#64748b" font-size="8.5" font-weight="600" letter-spacing="0.5">PERIMETER WALKWAY</text>
      </g>
    `;
  }

  locations.forEach((loc) => {
    if (loc.id === 'lake') return;
    const isFrom = fromId === loc.id;
    const isTo = toId === loc.id;
    const onPath = currentPath && currentPath.includes(loc.id);
    const matchesSearch = searchQuery && loc.name.toLowerCase().includes(searchQuery);

    const nodeColors = {
      Entrance: ['#e0f2fe', '#0284c7'],
      Institute: ['#ede9fe', '#7c3aed'],
      College: ['#dbeafe', '#2563eb'],
      Workshop: ['#fef3c7', '#d97706'],
      Facility: ['#ccfbf1', '#0f766e'],
      Cultural: ['#fce7f3', '#db2777'],
      Hostel: ['#ffedd5', '#ea580c'],
      School: ['#e0e7ff', '#4f46e5'],
      Sports: ['#d1fae5', '#059669'],
      Canteen: ['#fef9c3', '#ca8a04'],
      Medical: ['#ffe4e6', '#e11d48'],
      Emergency: ['#fee2e2', '#dc2626']
    };
    const [defaultFill, defaultStroke] = nodeColors[loc.type] || ['#eef2ff', '#4f46e5'];
    let fill = defaultFill;
    let stroke = defaultStroke;
    let strokeW = 2.5;
    let r = 22;
    let labelColor = '#1e293b';

    if (isFrom) {
      fill = '#10b981';
      stroke = '#047857';
      strokeW = 3.5;
      r = 25;
    } else if (isTo) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      strokeW = 3.5;
      r = 25;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#4338ca';
      strokeW = 3;
      r = 24;
    } else if (matchesSearch) {
      fill = '#fef08a';
      stroke = '#ca8a04';
      strokeW = 3;
      r = 24;
    }

    const icon = (window.CAMPUS_NODE_ICONS && window.CAMPUS_NODE_ICONS[loc.id]) || (window.getNodeIcon && window.getNodeIcon(loc.id)) || '📍';
    const nodeClasses = [
      'building-node',
      isFrom ? 'is-start' : '',
      isTo ? 'is-destination' : '',
      onPath && !isFrom && !isTo ? 'is-on-path' : '',
      matchesSearch ? 'is-search-match' : ''
    ].filter(Boolean).join(' ');

    html += `<g class="${nodeClasses}" data-id="${loc.id}">
      <g class="node-marker">
        <circle class="node-pulse" cx="${loc.x}" cy="${loc.y}" r="${r + 5}" stroke="${stroke}" />
        <circle class="node-face" cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"/>
        <text class="node-icon" x="${loc.x}" y="${loc.y}" text-anchor="middle" dominant-baseline="central" font-size="27">${icon}</text>
      </g>
      <text class="node-label" x="${loc.x}" y="${loc.y + r + 17}" text-anchor="middle" fill="${labelColor}" font-size="11.5" font-weight="700">${window.getShortLabel(loc.id)}</text>
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
  if (window.animateRouteWalker) {
    window.animateRouteWalker(document.getElementById('campusSvg'), null);
  }
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
    if (window.animateRouteWalker) {
      window.animateRouteWalker(document.getElementById('campusSvg'), null);
    }

    return;
  }

  currentPath = result.path;
  badge.textContent = `Optimal Campus Route • Distance: ${result.distance} units` + (blocked.length ? ' (avoiding road blocks)' : '');
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
  if (window.animateRouteWalker) {
    window.animateRouteWalker(document.getElementById('campusSvg'), result.path, locations, 86, 68);
  }
  window.CampusApp.toast(`Route computed: ${result.distance} units across ${result.path.length} stops`, 'success');
}

function applyEmbeddedRoute(startId, endId) {
  if (!locations.some((location) => location.id === startId) ||
      !locations.some((location) => location.id === endId) ||
      startId === endId) return;
  fromId = null;
  toId = null;
  focusId = null;
  currentPath = null;
  selectLocation(startId);
  selectLocation(endId);
  calculatePath();
}

if (embeddedMap) {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.type !== 'campusnav-route') return;
    if (embeddedMapReady) {
      applyEmbeddedRoute(message.from, message.to);
    } else {
      queuedEmbeddedRoute = message;
    }
  });
}

function updateButtonActiveStates() {
  document.querySelectorAll('.loc-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    btn.classList.toggle('active', id === fromId || id === toId);
  });
}

function handleMapVoice(alts) {
  const V = window.CampusVoice;
  if (!V) return null;
  const candidates = V.outdoorCandidates(true);

  for (const alternative of alts) {
    const command = V.parseCommand(alternative);
    if (!command.to) continue;

    const destination = V.findBest(command.to, candidates)[0];
    if (!destination) continue;

    if (command.from) {
      const start = V.findBest(command.from, candidates)[0];
      if (!start) {
        return { ok: false, show: `I couldn't find “${command.from}” on the map.`, say: `I couldn't find ${command.from} on the map.` };
      }
      if (start.id === destination.id) {
        return { ok: false, show: 'Choose two different places for a route.', say: 'Choose two different places for a route.' };
      }
      fromId = null;
      toId = null;
      focusId = null;
      currentPath = null;
      selectLocation(start.id);
      selectLocation(destination.id);
      calculatePath();
    } else {
      selectLocation(destination.id);
    }

    const message = command.from
      ? `Calculated a route from ${window.getLocationName(fromId)} to ${window.getLocationName(toId)} on the map.`
      : `Selected ${window.getLocationName(destination.id)} on the map.`;
    return { ok: true, show: '✓ ' + message, say: message };
  }

  return null;
}

window.CampusPageActions = Object.assign(window.CampusPageActions || {}, {
  mapVoice: handleMapVoice,
  outdoorStart: () => fromId || 'entrance'
});

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
  if (window.animateRouteWalker) {
    window.animateRouteWalker(document.getElementById('campusSvg'), null);
  }
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
  if (embeddedMap) {
    embeddedMapReady = true;
    const initialRoute = queuedEmbeddedRoute || {
      from: mapParams.get('from'),
      to: mapParams.get('to')
    };
    if (initialRoute.from && initialRoute.to) {
      applyEmbeddedRoute(initialRoute.from, initialRoute.to);
    }
  }
})();

// ========== Use My Location (map page) ==========
(function wireLocateMap() {
  const btn = document.getElementById('locateBtn');
  const statusEl = document.getElementById('locateStatus');
  if (!btn || !statusEl) return;

  function setStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className = 'locate-status' + (cls ? ' ' + cls : '');
  }

  function startDetecting() {
    btn.disabled = true;
    btn.classList.add('detecting');
    setStatus('Detecting your position…');
  }

  function stopDetecting() {
    btn.disabled = false;
    btn.classList.remove('detecting');
  }

  btn.addEventListener('click', function () {
    startDetecting();

    window.useMyLocation({
      onSuccess: function (neighbours) {
        const nearest = Array.isArray(neighbours) ? neighbours[0] : neighbours;
        // Mirror what selectLocation() does for a fresh From selection
        fromId = nearest.id;
        toId = null;
        currentPath = null;
        focusId = nearest.id;
        updateBuildingAction();

        const fromBox = document.getElementById('fromBox');
        const toBox   = document.getElementById('toBox');
        if (fromBox) fromBox.classList.add('active');
        if (toBox)   toBox.classList.remove('active');

        document.getElementById('fromName').textContent = window.getLocationName(nearest.id);
        document.getElementById('toName').textContent   = 'Click another building';
        document.getElementById('calcBtn').disabled  = true;
        document.getElementById('favBtn').disabled   = false;
        document.getElementById('favBtn').textContent = favourites.includes(nearest.id)
          ? '★ Saved in Favourites'
          : '☆ Save From as Favourite';
        document.getElementById('goRouteBtn').href = '/navigate.html?from=' + nearest.id;
        document.getElementById('pathResult').style.display = 'none';

        drawEdges(null);
        drawNodes();
        updateButtonActiveStates();

        stopDetecting();
        const msg = window.formatKnnStatus ? window.formatKnnStatus(neighbours) : ('k-NN start: ' + nearest.name + ' (' + nearest.metres + ' m).');
        setStatus(msg, 'success');
      },
      onOutsideCampus: function (msg) {
        stopDetecting();
        setStatus(msg, 'warn');
      },
      onError: function (msg) {
        stopDetecting();
        setStatus(msg, 'error');
      }
    });
  });
})();
