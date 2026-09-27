window.CampusApp.requireAuth();

let blocked = [];
let selectedType = 'Canteen';
const fromSelect = document.getElementById('fromSelect');
window.CAMPUS_LOCATIONS.forEach((loc) => {
  if (loc.id === 'lake') return;
  fromSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
});
fromSelect.value = 'entrance';

const grid = document.getElementById('typeGrid');
Object.keys(window.FACILITY_TYPES).forEach((type) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'facility-card' + (type === selectedType ? ' active' : '');
  btn.textContent = type;
  btn.onclick = () => {
    selectedType = type;
    document.querySelectorAll('.facility-card').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
  };
  grid.appendChild(btn);
});

document.getElementById('findBtn').onclick = () => {
  const start = fromSelect.value;
  const targets = window.FACILITY_TYPES[selectedType] || [];
  const graph = window.graphWithoutBlocked(blocked);
  const found = window.bfsNearest(graph, start, targets);
  const box = document.getElementById('resultBox');
  if (!found) {
    box.innerHTML = '<div class="empty">No reachable ' + selectedType + ' from here (maybe a blocked road).</div>';
    return;
  }
  const dijk = window.dijkstra(graph, start, found.id);
  let html = `<p><strong>BFS</strong> nearest ${selectedType}: ${window.getLocationName(found.id)} · ${found.hops} hop(s)</p>`;
  if (dijk) html += `<p class="subtitle" style="margin:8px 0 12px;">Walking distance (Dijkstra): ${dijk.distance} units</p>`;
  html += '<ul style="list-style:none;">';
  found.path.forEach((id, i) => {
    html += `<li class="loc-item"><div class="loc-dot"></div><div class="loc-name">${i + 1}. ${window.getLocationName(id)}</div></li>`;
  });
  html += '</ul>';
  html += `<p style="margin-top:12px;"><a class="link" href="/navigate.html?from=${start}&to=${found.id}">Open this route →</a></p>`;
  box.innerHTML = html;
};

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {}
})();
