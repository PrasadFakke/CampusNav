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

const findBtn = document.getElementById('findBtn');
findBtn.disabled = true;
findBtn.textContent = 'Loading campus roads…';

function bfsPathWeight(graph, path) {
  let w = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const step = graph[path[i]] && graph[path[i]][path[i + 1]];
    if (step == null) return null;
    w += step;
  }
  return w;
}

function runNearest() {
  const start = fromSelect.value;
  const targets = window.FACILITY_TYPES[selectedType] || [];
  const graph = window.graphWithoutBlocked(blocked);
  const found = window.bfsNearest(graph, start, targets);
  const box = document.getElementById('resultBox');

  if (!found) {
    box.innerHTML =
      '<div class="empty">BFS found no reachable ' +
      selectedType +
      '. Every path is closed by a blocked road.</div>';
    return;
  }

  const cost = bfsPathWeight(graph, found.path);
  let html = `<p><strong>BFS</strong> nearest ${selectedType}: ${window.getLocationName(found.id)} · ${found.hops} hop(s)</p>`;
  if (cost != null) {
    html += `<p class="subtitle" style="margin:8px 0;">Weight along this BFS path: ${cost} units`;
    html += blocked.length ? ` · blocked roads skipped</p>` : '</p>';
  }
  html += '<ul style="list-style:none;margin-top:10px;">';
  found.path.forEach((id, i) => {
    html += `<li class="loc-item"><div class="loc-dot"></div><div class="loc-name">${i + 1}. ${window.getLocationName(id)}</div></li>`;
  });
  html += '</ul>';
  html += `<p class="subtitle" style="margin-top:12px;">Find Route uses Dijkstra (distance). BFS uses hops, so the path can differ — that is correct.</p>`;
  html += `<p style="margin-top:8px;"><a class="link" href="/navigate.html?from=${start}&to=${found.id}">Compare Dijkstra on Find Route →</a></p>`;
  box.innerHTML = html;
}

findBtn.onclick = runNearest;

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {
    blocked = [];
  }
  findBtn.disabled = false;
  findBtn.textContent = 'Find with BFS';
})();