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
      edgesHtml += `<line x1="${locU.x}" y1="${locU.y}" x2="${locV.x}" y2="${locV.y}"
        stroke="${isBlocked ? '#ef4444' : isPath ? '#6366f1' : '#2a2a3a'}"
        stroke-width="${isPath ? 5 : 2}" stroke-dasharray="${isBlocked ? '6 4' : '0'}"
        stroke-linecap="round" opacity="${isPath ? 1 : 0.45}"/>`;
    });
  });
  let nodesHtml = '';
  locations.forEach((loc) => {
    if (loc.id === 'lake') {
      nodesHtml += `<ellipse cx="${loc.x}" cy="${loc.y}" rx="50" ry="40" fill="#3b82f6" opacity="0.5"/>`;
      return;
    }
    const onPath = pathSet.has(loc.id);
    const isStart = pathIds && pathIds[0] === loc.id;
    const isEnd = pathIds && pathIds[pathIds.length - 1] === loc.id;
    let fill = '#4b5563';
    if (isStart) fill = '#22c55e';
    else if (isEnd) fill = '#ef4444';
    else if (onPath) fill = '#6366f1';
    nodesHtml += `<circle cx="${loc.x}" cy="${loc.y}" r="${onPath ? 14 : 10}" fill="${fill}"/>`;
    nodesHtml += `<text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#9898a8" font-size="10">${window.getShortLabel(loc.id)}</text>`;
  });
  svg.innerHTML = `<rect width="800" height="700" fill="#12121a" rx="8"/>${edgesHtml}${nodesHtml}`;
  document.getElementById('mapPreview').style.display = 'block';
}

function findRoute() {
  const from = fromSelect.value;
  const to = toSelect.value;
  const box = document.getElementById('resultBox');
  if (from === to) {
    box.innerHTML = '<div class="empty">Source and destination are the same</div>';
    return;
  }
  const open = window.dijkstra(window.CAMPUS_GRAPH, from, to);
  const alt = window.dijkstra(window.graphWithoutBlocked(blocked), from, to);
  if (!alt) {
    box.innerHTML =
      '<div class="empty">No path with current blocked roads. Ask admin to reopen a pathway.</div>';
    document.getElementById('mapPreview').style.display = 'none';
    return;
  }
  let html = `<div class="algo-badge">Dijkstra • ${alt.distance} units${blocked.length ? ' • avoiding blocked roads' : ''}</div>`;
  if (open && blocked.length && open.distance !== alt.distance) {
    html += `<p class="subtitle" style="margin-bottom:10px;">Original path was ${open.distance} units. Alternative after closures: ${alt.distance} units.</p>`;
  }
  html += '<ul class="path-list">';
  alt.path.forEach((id, i) => {
    html += `<li><span class="step-num">${i + 1}</span><span>${window.getLocationName(id)}</span></li>`;
  });
  html += '</ul>';
  box.innerHTML = html;
  drawMiniMap(alt.path);
}

document.getElementById('findBtn').onclick = findRoute;

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
    document.getElementById('blockedNote').textContent = blocked.length
      ? blocked.length + ' road(s) currently blocked — route will use an alternative.'
      : 'No roads blocked.';
  } catch (_) {}
  if (params.get('from') && params.get('to')) findRoute();
})();
