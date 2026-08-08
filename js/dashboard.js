// Auth check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '/';
} else {
  const name = user.username || 'Student';
  document.getElementById('userName').textContent = name;
  document.getElementById('greetingName').textContent = name;
  document.getElementById('avatar').textContent = name.charAt(0).toUpperCase();
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// Campus locations from the map photo
const locations = [
  { name: 'Main Entrance (You Are Here)', type: 'Entrance' },
  { name: 'SPIT', type: 'Institute' },
  { name: 'SPCE', type: 'College' },
  { name: 'SPCE Workshop', type: 'Workshop' },
  { name: 'Library', type: 'Facility' },
  { name: 'Library Extension', type: 'Facility' },
  { name: "Bhavan's College", type: 'College' },
  { name: "Bhavan's Cultural Centre", type: 'Cultural' },
  { name: 'SPJIMR', type: 'Institute' },
  { name: 'SPJIMR Hostel', type: 'Hostel' },
  { name: 'Hostel', type: 'Hostel' },
  { name: 'A. H. Wadia Highschool', type: 'School' },
  { name: 'Playground', type: 'Sports' },
  { name: 'Sports Complex', type: 'Sports' },
  { name: 'Lake', type: 'Landmark' },
];

const list = document.getElementById('locationsList');
locations.forEach(loc => {
  const div = document.createElement('div');
  div.className = 'loc-item';
  div.innerHTML = `
    <div class="loc-dot"></div>
    <div class="loc-name">${loc.name}</div>
    <div class="loc-type">${loc.type}</div>
  `;
  list.appendChild(div);
});
