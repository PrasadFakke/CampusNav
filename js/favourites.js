window.CampusApp.requireAuth();

const addSelect = document.getElementById('addSelect');
window.CAMPUS_LOCATIONS.forEach((loc) => {
  addSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
});

async function load() {
  const data = await window.CampusApp.api('/api/favourites');
  const ids = data.favourites || [];
  const box = document.getElementById('favList');
  if (!ids.length) {
    box.innerHTML = '<div class="empty">No favourites yet. Save a place from here or from the map.</div>';
    return;
  }
  box.innerHTML = ids
    .map((id) => {
      const name = window.getLocationName(id);
      return `<div class="loc-item">
        <div class="loc-dot"></div>
        <div class="loc-name">${name}</div>
        <a class="link" href="/navigate.html?from=entrance&to=${id}">Route</a>
        <button class="fav-btn" data-id="${id}">Remove</button>
      </div>`;
    })
    .join('');
  box.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.onclick = async () => {
      await window.CampusApp.api('/api/favourites/' + btn.dataset.id, { method: 'DELETE' });
      load();
    };
  });
}

document.getElementById('addBtn').onclick = async () => {
  const locationId = addSelect.value;
  try {
    await window.CampusApp.api('/api/favourites', {
      method: 'POST',
      body: JSON.stringify({ locationId })
    });
    document.getElementById('msg').textContent = 'Saved ' + window.getLocationName(locationId);
    load();
  } catch (err) {
    document.getElementById('msg').textContent = err.message;
  }
};

load().catch((err) => {
  document.getElementById('favList').innerHTML = '<div class="empty">' + err.message + '</div>';
});
