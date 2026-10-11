window.CampusApp.requireAuth();

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

  html += `</ul><div style="margin-top:16px;"><a class="btn primary" style="font-size:0.88rem;padding:9px 18px;" href="/navigate.html?from=${start}&to=${targetId}">Interactive Map Navigation →</a></div>`;
  box.innerHTML = html;
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
