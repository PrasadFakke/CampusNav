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

let blocked = [];
const fromSelect = document.getElementById('fromSelect');
window.CAMPUS_LOCATIONS.forEach((loc) => {
  if (loc.id === 'lake') return;
  fromSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
});
fromSelect.value = 'spit';

function run(targetId) {
  const start = fromSelect.value;
  const graph = window.graphWithoutBlocked(blocked);
  const result = window.dijkstra(graph, start, targetId);
  const box = document.getElementById('resultBox');

  if (!result) {
    box.innerHTML = '<div class="empty" style="color:#ef4444;font-weight:700;">No emergency route found. All access pathways appear blocked. Contact staff directly!</div>';
    window.CampusApp.toast('Emergency route obstructed!', 'error');
    return;
  }

  const targetName = window.getLocationName(targetId);
  let html = `<div class="algo-badge" style="background:#fee2e2;color:#dc2626;border-color:#fecaca;">Emergency Path to ${targetName} • Distance: ${result.distance} units</div>
    <ul style="list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:8px;">`;

  result.path.forEach((id, i) => {
    const isEnd = i === result.path.length - 1;
    const tag = isEnd
      ? `<span class="loc-type" style="margin-left:auto;background:#fee2e2;color:#dc2626;font-weight:700;">Destination</span>`
      : i === 0
      ? `<span class="loc-type" style="margin-left:auto;background:#ecfdf5;color:#059669;font-weight:700;">Start</span>`
      : '';
    html += `<li class="loc-item" style="background:#ffffff;box-shadow:var(--shadow-sm);"><div class="loc-dot" style="${isEnd ? 'background:#ef4444;' : ''}"></div><div class="loc-name">${i + 1}. ${window.getLocationName(id)}</div>${tag}</li>`;
  });

  html += `</ul>
    <div id="mapPreview" style="margin-top:18px;">
      <svg class="mini-svg" id="emergencyMiniMap" viewBox="0 0 800 700" style="width:100%;max-height:360px;background:#ffffff;border:1.5px solid var(--border);border-radius:14px;box-shadow:var(--shadow-sm);"></svg>
    </div>
    <div style="margin-top:16px;"><a class="btn primary" style="font-size:0.88rem;padding:9px 18px;" href="/navigate.html?from=${start}&to=${targetId}">Interactive Map Navigation →</a></div>`;
  box.innerHTML = html;

  const miniMap = document.getElementById('emergencyMiniMap');
  if (window.renderCampusMiniMap && miniMap) {
    window.renderCampusMiniMap(miniMap, result.path, blocked);
  }
  window.CampusApp.toast(`Emergency path to ${targetName} computed (${result.distance} units)`, 'success');
}

document.getElementById('medBtn').onclick = () => run('medical');
document.getElementById('secBtn').onclick = () => run('security');

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {}
})();

// ========== Use My Location (emergency page) ==========
(function wireLocateEmergency() {
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
