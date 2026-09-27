const user = window.CampusApp.requireAuth();
if (!user) throw new Error('auth');

document.getElementById('greetingName').textContent = user.username;

const list = document.getElementById('locationsList');
window.CAMPUS_LOCATIONS.forEach((loc) => {
  const div = document.createElement('div');
  div.className = 'loc-item';
  div.innerHTML = `
    <div class="loc-dot"></div>
    <div class="loc-name">${loc.name}</div>
    <div class="loc-type">${loc.type}</div>`;
  list.appendChild(div);
});
document.getElementById('locCount').textContent = String(window.CAMPUS_LOCATIONS.length);

(async () => {
  try {
    const fav = await window.CampusApp.api('/api/favourites');
    document.getElementById('favCount').textContent = String((fav.favourites || []).length);
  } catch (_) {}
  try {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    document.getElementById('blockedCount').textContent = String((campus.blockedEdges || []).length);
  } catch (_) {}
})();
