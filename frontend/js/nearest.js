window.CampusApp.requireAuth();

let blocked = [];
let selectedType = 'Canteen';
const fromSelect = document.getElementById('fromSelect');

const facilityIcons = {
  Library: '📚',
  Canteen: '🍔',
  Medical: '🏥',
  Washroom: '🚻',
  Parking: '🚗',
  Sports: '⚽',
  Hostel: '🛏️',
  Emergency: '🚨'
};

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
  const icon = facilityIcons[type] || '📍';
  btn.innerHTML = `<div style="font-size:1.4rem;margin-bottom:4px;">${icon}</div><div>${type}</div>`;
  btn.onclick = () => {
    selectedType = type;
    document.querySelectorAll('.facility-card').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    runNearest();
  };
  grid.appendChild(btn);
});

const findBtn = document.getElementById('findBtn');
findBtn.disabled = true;
findBtn.textContent = 'Loading campus pathways…';

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
      '<div class="empty" style="color:#ef4444;font-weight:600;">No reachable ' +
      selectedType +
      '. Road closures block all pathways.</div>';
    return;
  }

  const cost = bfsPathWeight(graph, found.path);
  let html = `<div class="algo-badge">Closest ${selectedType}: ${window.getLocationName(found.id)} • ${found.hops} stop(s) away</div>`;
  if (cost != null) {
    html += `<p class="subtitle" style="margin:10px 0 14px;font-weight:600;color:var(--text-secondary);">Total walking distance: <strong>${cost} units</strong>${blocked.length ? ' • road closures avoided' : ''}</p>`;
  }
  html += '<ul style="list-style:none;display:flex;flex-direction:column;gap:8px;">';
  found.path.forEach((id, i) => {
    const isStart = i === 0;
    const isEnd = i === found.path.length - 1;
    const tag = isStart
      ? '<span class="loc-type" style="margin-left:auto;background:#ecfdf5;color:#059669;">Start</span>'
      : isEnd
      ? '<span class="loc-type" style="margin-left:auto;background:#eff6ff;color:#4f46e5;">Target</span>'
      : '';
    html += `<li class="loc-item" style="background:#ffffff;box-shadow:var(--shadow-sm);"><div class="loc-dot"></div><div class="loc-name">${i + 1}. ${window.getLocationName(id)}</div>${tag}</li>`;
  });
  html += '</ul>';
  html += `<p style="margin-top:16px;"><a class="btn primary" style="font-size:0.88rem;padding:9px 16px;" href="/navigate.html?from=${start}&to=${found.id}">Open Full Route Map →</a></p>`;
  box.innerHTML = html;
  window.CampusApp.toast(`Found nearest ${selectedType}: ${window.getLocationName(found.id)} (${found.hops} stops)`, 'success');
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
  findBtn.textContent = 'Find Nearest Facility';
})();

// ========== Use My Location (nearest page) ==========
(function wireLocateNearest() {
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