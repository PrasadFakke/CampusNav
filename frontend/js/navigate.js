window.CampusApp.requireAuth();

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
const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');

locations.forEach((loc) => {
  if (loc.id === 'lake') return;
  fromSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
  toSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
});
fromSelect.value = 'entrance';
toSelect.value = 'library';

const params = new URLSearchParams(window.location.search);
if (params.get('from')) fromSelect.value = params.get('from');
if (params.get('to')) toSelect.value = params.get('to');

document.getElementById('swapBtn').onclick = () => {
  const t = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = t;
  findRoute();
};

function isPathEdge(u, v, pathIds) {
  if (!pathIds || pathIds.length < 2) return false;
  for (let i = 0; i < pathIds.length - 1; i++) {
    if ((pathIds[i] === u && pathIds[i + 1] === v) || (pathIds[i] === v && pathIds[i + 1] === u))
      return true;
  }
  return false;
}

function drawMiniMap(pathIds) {
  const svg = document.getElementById('miniMap');
  const pathSet = new Set(pathIds || []);
  const lake = locations.find((loc) => loc.id === 'lake');
  let edgesHtml = lake
    ? `<ellipse cx="${lake.x}" cy="${lake.y}" rx="86" ry="68" fill="none"
        stroke="#cbd5e1" stroke-width="2.5" opacity="0.6" pointer-events="none"/>`
    : '';
  const drawn = new Set();

  Object.keys(window.CAMPUS_GRAPH).forEach((u) => {
    const locU = locations.find((l) => l.id === u);
    if (!locU) return;
    Object.keys(window.CAMPUS_GRAPH[u] || {}).forEach((v) => {
      const key = window.edgeKey(u, v);
      if (drawn.has(key)) return;
      drawn.add(key);
      const locV = locations.find((l) => l.id === v);
      if (!locV) return;
      const isBlocked = blocked.includes(key);
      const isPath = !isBlocked && isPathEdge(u, v, pathIds);
      const strokeColor = isBlocked ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
      const animClass = isPath ? 'class="path-edge-animated"' : '';
      const edgePoints = window.getEdgeDisplayPoints(locU, locV, 86, 68);

      edgesHtml += `<line x1="${edgePoints.x1}" y1="${edgePoints.y1}" x2="${edgePoints.x2}" y2="${edgePoints.y2}"
        stroke="${strokeColor}" stroke-width="${isPath ? 5.5 : 2.5}" stroke-dasharray="${isBlocked ? '6 4' : '0'}"
        stroke-linecap="round" opacity="${isPath ? 1 : 0.6}" ${animClass}/>`;
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
        edgesHtml += `<path d="${lakeArc.fullD}" fill="none" stroke="#4f46e5" stroke-width="5.5"
          stroke-linecap="round" stroke-linejoin="round" class="path-edge-animated" pointer-events="none"/>`;
      }
    }
  }

  let nodesHtml = '';
  locations.forEach((loc) => {
    if (loc.id === 'lake') {
      nodesHtml += `
        <g class="lake-promenade-group" pointer-events="none">
          <ellipse cx="${loc.x}" cy="${loc.y}" rx="72" ry="56" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.8" />
          <ellipse cx="${loc.x}" cy="${loc.y}" rx="68" ry="52" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2" opacity="0.95" />
          <path d="M ${loc.x - 22} ${loc.y - 16} Q ${loc.x - 14} ${loc.y - 20} ${loc.x - 6} ${loc.y - 16} T ${loc.x + 8} ${loc.y - 16}" fill="none" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <path d="M ${loc.x + 6} ${loc.y + 12} Q ${loc.x + 14} ${loc.y + 8} ${loc.x + 22} ${loc.y + 12} T ${loc.x + 36} ${loc.y + 12}" fill="none" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <text x="${loc.x}" y="${loc.y - 3}" text-anchor="middle" dominant-baseline="central" font-size="20" style="user-select:none;">💧</text>
          <text x="${loc.x}" y="${loc.y + 15}" text-anchor="middle" fill="#0284c7" font-size="11" font-weight="800" letter-spacing="1">LAKE</text>
          <text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">WALKWAY</text>
        </g>`;
      return;
    }
    const onPath = pathSet.has(loc.id);
    const isStart = pathIds && pathIds[0] === loc.id;
    const isEnd = pathIds && pathIds[pathIds.length - 1] === loc.id;

    let fill = '#ffffff';
    let stroke = '#4f46e5';
    let strokeW = 2.5;
    let r = onPath ? 16 : 13;

    if (isStart) {
      fill = '#10b981';
      stroke = '#047857';
      strokeW = 3;
    } else if (isEnd) {
      fill = '#ef4444';
        <text x="${loc.x}" y="${loc.y}" text-anchor="middle" dominant-baseline="central" font-size="30" style="user-select:none;pointer-events:none;">${icon}</text>;
      strokeW = 3;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#4338ca';
      strokeW = 3;
    }

    const icon = (window.CAMPUS_NODE_ICONS && window.CAMPUS_NODE_ICONS[loc.id]) || (window.getNodeIcon && window.getNodeIcon(loc.id)) || '📍';
    nodesHtml += `<g class="mini-node" data-id="${loc.id}">
      <circle cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <text x="${loc.x}" y="${loc.y}" text-anchor="middle" dominant-baseline="central" font-size="18" style="user-select:none;pointer-events:none;">${icon}</text>
      <text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="700">${window.getShortLabel(loc.id)}</text>
    </g>`;
  });

  svg.innerHTML = `<rect width="800" height="700" fill="#f8fafc" rx="14"/>${edgesHtml}${nodesHtml}`;
  document.getElementById('mapPreview').style.display = 'block';

  if (window.animateRouteWalker) {
    window.animateRouteWalker(svg, pathIds, locations, 86, 68);
  }
}

function findRoute() {
  const from = fromSelect.value;
  const to = toSelect.value;
  const box = document.getElementById('resultBox');

  if (from === to) {
    box.innerHTML = '<div class="empty">Source and destination are identical. Pick different locations.</div>';
    document.getElementById('mapPreview').style.display = 'none';
    if (window.animateRouteWalker) {
      window.animateRouteWalker(document.getElementById('miniMap'), null);
    }
    return;
  }

  const open = window.dijkstra(window.CAMPUS_GRAPH, from, to);
  const alt = window.dijkstra(window.graphWithoutBlocked(blocked), from, to);

  if (!alt) {
    box.innerHTML =
      '<div class="empty" style="color:#ef4444;font-weight:600;">No path available with active road closures. Ask an administrator to reopen a pathway.</div>';
    document.getElementById('mapPreview').style.display = 'none';
    if (window.animateRouteWalker) {
      window.animateRouteWalker(document.getElementById('miniMap'), null);
    }
    return;
  }

  let html = `<div class="algo-badge">Optimal Walking Route • Total Distance: ${alt.distance} units${blocked.length ? ' • road closures bypassed' : ''}</div>`;
  if (open && blocked.length && open.distance !== alt.distance) {
    html += `<p class="subtitle" style="margin-bottom:12px;color:#d97706;font-weight:600;">Original direct path was ${open.distance} units. Alternative detoured route: ${alt.distance} units.</p>`;
  }

  html += '<ul class="path-list">';
  alt.path.forEach((id, i) => {
    const isStart = i === 0;
    const isEnd = i === alt.path.length - 1;
    const tag = isStart
      ? '<span class="loc-type" style="margin-left:auto;background:#ecfdf5;color:#059669;">Start</span>'
      : isEnd
      ? '<span class="loc-type" style="margin-left:auto;background:#fef2f2;color:#dc2626;">Destination</span>'
      : '';

    html += `<li><span class="step-num">${i + 1}</span><span>${window.getLocationName(id)}</span>${tag}</li>`;
  });
  html += '</ul>';
  box.innerHTML = html;
  drawMiniMap(alt.path);
  window.CampusApp.toast(`Route computed: ${alt.distance} units across ${alt.path.length} steps`, 'success');
}

document.getElementById('findBtn').onclick = findRoute;

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
    document.getElementById('blockedNote').textContent = blocked.length
      ? `${blocked.length} pathway(s) currently closed — routes automatically reroute.`
      : 'All campus pathways are currently open.';
    if (blocked.length) {
      document.getElementById('blockedNote').style.color = '#dc2626';
    }
  } catch (_) {}
  if (params.get('from') && params.get('to')) findRoute();
})();

// ========== Use My Location (navigate page) ==========
(function wireLocateNavigate() {
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
      onSuccess: function (nearest) {
        fromSelect.value = nearest.id;
        stopDetecting();
        setStatus(
          'You are near ' + nearest.name + ' (' + nearest.metres + ' m) on this device. Location sets the start only.',
          'success'
        );
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
