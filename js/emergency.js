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
    box.innerHTML = '<div class="empty">No emergency path available with current road closures.</div>';
    return;
  }
  let html = `<p><strong>Emergency Dijkstra</strong> to ${window.getLocationName(targetId)} · ${result.distance} units</p><ul style="list-style:none;margin-top:12px;">`;
  result.path.forEach((id, i) => {
    html += `<li class="loc-item"><div class="loc-dot"></div><div class="loc-name">${i + 1}. ${window.getLocationName(id)}</div></li>`;
  });
  html += `</ul><p style="margin-top:12px;"><a class="link" href="/navigate.html?from=${start}&to=${targetId}">See on map →</a></p>`;
  box.innerHTML = html;
}

document.getElementById('medBtn').onclick = () => run('medical');
document.getElementById('secBtn').onclick = () => run('security');

(async () => {
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    blocked = campus.blockedEdges || [];
  } catch (_) {}
})();
