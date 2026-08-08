// Auth check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '/';
} else {
  const name = user.username || 'Student';
  document.getElementById('userName').textContent = name;
  document.getElementById('avatar').textContent = name.charAt(0).toUpperCase();
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// Locations data (matching the map)
const locations = [
  { id: 'spit', name: 'SPIT', type: 'Institute' },
  { id: 'spce', name: 'SPCE', type: 'College' },
  { id: 'workshop', name: 'SPCE Workshop', type: 'Workshop' },
  { id: 'library', name: 'Library', type: 'Facility' },
  { id: 'lib-ext', name: 'Library Extension', type: 'Facility' },
  { id: 'bhavans-college', name: "Bhavan's College", type: 'College' },
  { id: 'cultural', name: "Bhavan's Cultural Centre", type: 'Cultural' },
  { id: 'spjimr', name: 'SPJIMR', type: 'Institute' },
  { id: 'spjimr-hostel', name: 'SPJIMR Hostel', type: 'Hostel' },
  { id: 'hostel', name: 'Hostel', type: 'Hostel' },
  { id: 'wadia', name: 'A. H. Wadia Highschool', type: 'School' },
  { id: 'sports-complex', name: 'Sports Complex', type: 'Sports' },
];

let selectedId = null;

// Render location buttons
const locButtons = document.getElementById('locButtons');
locations.forEach(loc => {
  const btn = document.createElement('button');
  btn.className = 'loc-btn';
  btn.textContent = loc.name;
  btn.dataset.id = loc.id;
  btn.addEventListener('click', () => selectLocation(loc.id));
  locButtons.appendChild(btn);
});

// Select location
function selectLocation(id) {
  selectedId = id;
  const loc = locations.find(l => l.id === id);
  if (!loc) return;

  // Update panel
  const box = document.getElementById('selectedBox');
  box.innerHTML = `
    <div class="name">${loc.name}</div>
    <div class="type">${loc.type}</div>
  `;

  // Highlight on SVG
  document.querySelectorAll('.building').forEach(b => b.classList.remove('selected'));
  const el = document.querySelector(`.building[data-id="${id}"]`);
  if (el) el.classList.add('selected');

  // Highlight button
  document.querySelectorAll('.loc-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.loc-btn[data-id="${id}"]`);
  if (btn) btn.classList.add('active');

  // Update route button
  const routeBtn = document.getElementById('routeBtn');
  routeBtn.href = `/navigate.html?from=${id}`;
  routeBtn.textContent = `Find Route from ${loc.name} →`;
}

// Click on SVG buildings
document.querySelectorAll('.building').forEach(el => {
  el.addEventListener('click', () => {
    const id = el.dataset.id;
    if (id) selectLocation(id);
  });
});
