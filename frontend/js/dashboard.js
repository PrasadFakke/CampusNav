const user = window.CampusApp.requireAuth();
if (!user) throw new Error('auth');

document.getElementById('greetingName').textContent = user.username;

// Dynamic greeting based on current local time
const hour = new Date().getHours();
let greeting = 'Welcome back';
if (hour < 12) greeting = 'Good morning';
else if (hour < 17) greeting = 'Good afternoon';
else greeting = 'Good evening';

const timeGreetingEl = document.getElementById('timeGreeting');
if (timeGreetingEl) timeGreetingEl.textContent = greeting;

const list = document.getElementById('locationsList');
let searchFilter = '';

function renderLocations() {
  list.innerHTML = '';
  const filtered = window.CAMPUS_LOCATIONS.filter(
    (loc) => !searchFilter || loc.name.toLowerCase().includes(searchFilter) || loc.type.toLowerCase().includes(searchFilter)
  );

  if (!filtered.length) {
    list.innerHTML = '<div class="empty">No matching places found</div>';
    return;
  }

  filtered.forEach((loc) => {
    const div = document.createElement('div');
    div.className = 'loc-item';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="loc-dot"></div>
      <div class="loc-name">${loc.name}</div>
      <div class="loc-type">${loc.type}</div>`;
    div.onclick = () => {
      window.location.href = `/map.html`;
    };
    list.appendChild(div);
  });
}

renderLocations();
document.getElementById('locCount').textContent = String(window.CAMPUS_LOCATIONS.length);

const searchInput = document.getElementById('dashSearch');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchFilter = e.target.value.trim().toLowerCase();
    renderLocations();
  });
}

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
