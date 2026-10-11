window.CampusApp.requireAuth();

const addSelect = document.getElementById('addSelect');
window.CAMPUS_LOCATIONS.forEach((loc) => {
  addSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
});

async function load() {
  const data = await window.CampusApp.api('/api/favourites');
  const ids = data.favourites || [];
  const box = document.getElementById('favList');
  const counter = document.getElementById('favCounter');
  if (counter) counter.textContent = `${ids.length} place${ids.length === 1 ? '' : 's'}`;

  if (!ids.length) {
    box.innerHTML = '<div class="empty">No favourites saved yet. Bookmark a place from here or directly from the Interactive Map.</div>';
    return;
  }

  box.innerHTML = ids
    .map((id) => {
      const name = window.getLocationName(id);
      return `<div class="loc-item" style="background:#ffffff;border:1px solid var(--border);box-shadow:var(--shadow-sm);">
        <div class="loc-dot" style="background:#f59e0b;box-shadow:0 0 0 3px #fef3c7;"></div>
        <div class="loc-name">${name}</div>
        <a class="link" style="margin-left:auto;margin-right:12px;font-size:0.85rem;" href="/navigate.html?from=entrance&to=${id}">Get Route →</a>
        <button class="fav-btn" data-id="${id}" style="margin-left:0;">Remove</button>
      </div>`;
    })
    .join('');

  box.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.onclick = async () => {
      const removedId = btn.dataset.id;
      await window.CampusApp.api('/api/favourites/' + removedId, { method: 'DELETE' });
      window.CampusApp.toast(`Removed ${window.getLocationName(removedId)} from favourites`);
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
    const name = window.getLocationName(locationId);
    document.getElementById('msg').textContent = 'Saved ' + name;
    document.getElementById('msg').style.color = '#10b981';
    window.CampusApp.toast(`Saved ${name} to favourites!`, 'success');
    load();
  } catch (err) {
    document.getElementById('msg').textContent = err.message;
    document.getElementById('msg').style.color = '#ef4444';
    window.CampusApp.toast(err.message, 'error');
  }
};

load().catch((err) => {
  document.getElementById('favList').innerHTML = '<div class="empty">' + err.message + '</div>';
});
