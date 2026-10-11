window.CampusApp.requireAuth();

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
  let edgesHtml = '';
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

      edgesHtml += `<line x1="${locU.x}" y1="${locU.y}" x2="${locV.x}" y2="${locV.y}"
        stroke="${strokeColor}" stroke-width="${isPath ? 5.5 : 2.5}" stroke-dasharray="${isBlocked ? '6 4' : '0'}"
        stroke-linecap="round" opacity="${isPath ? 1 : 0.6}" ${animClass}/>`;
    });
  });

  let nodesHtml = '';
  locations.forEach((loc) => {
    if (loc.id === 'lake') {
      nodesHtml += `<ellipse cx="${loc.x}" cy="${loc.y}" rx="55" ry="42" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2"/>
        <text x="${loc.x}" y="${loc.y + 4}" text-anchor="middle" fill="#0284c7" font-size="11" font-weight="700">LAKE</text>`;
      return;
    }
    const onPath = pathSet.has(loc.id);
    const isStart = pathIds && pathIds[0] === loc.id;
    const isEnd = pathIds && pathIds[pathIds.length - 1] === loc.id;

    let fill = '#ffffff';
    let stroke = '#4f46e5';
    let strokeW = 2.5;
    let r = onPath ? 15 : 11;

    if (isStart) {
      fill = '#10b981';
      stroke = '#047857';
      strokeW = 3;
    } else if (isEnd) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      strokeW = 3;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#4338ca';
      strokeW = 3;
    }

    nodesHtml += `<circle cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>`;
    nodesHtml += `<text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="700">${window.getShortLabel(loc.id)}</text>`;
  });

  svg.innerHTML = `<rect width="800" height="700" fill="#f8fafc" rx="14"/>${edgesHtml}${nodesHtml}`;
  document.getElementById('mapPreview').style.display = 'block';
}

function findRoute() {
  const from = fromSelect.value;
  const to = toSelect.value;
  const box = document.getElementById('resultBox');

  if (from === to) {
    box.innerHTML = '<div class="empty">Source and destination are identical. Pick different locations.</div>';
    document.getElementById('mapPreview').style.display = 'none';
    return;
  }

  const open = window.dijkstra(window.CAMPUS_GRAPH, from, to);
  const alt = window.dijkstra(window.graphWithoutBlocked(blocked), from, to);

  if (!alt) {
    box.innerHTML =
      '<div class="empty" style="color:#ef4444;font-weight:600;">No path available with active road closures. Ask an administrator to reopen a pathway.</div>';
    document.getElementById('mapPreview').style.display = 'none';
    return;
  }

  let html = `<div class="algo-badge">Dijkstra Shortest Path • Total Distance: ${alt.distance} units${blocked.length ? ' • road closures bypassed' : ''}</div>`;
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
