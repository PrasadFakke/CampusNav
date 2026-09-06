// ========== CAMPUS GRAPH DATA (Phase 2) ==========
// Positions tuned so labels don't overlap

window.CAMPUS_LOCATIONS = [
  { id: 'entrance', name: 'Main Entrance', type: 'Entrance', x: 400, y: 640 },
  { id: 'spit', name: 'SPIT', type: 'Institute', x: 80, y: 360 },
  { id: 'spce', name: 'SPCE', type: 'College', x: 200, y: 320 },
  { id: 'workshop', name: 'SPCE Workshop', type: 'Workshop', x: 70, y: 200 },
  { id: 'library', name: 'Library', type: 'Facility', x: 480, y: 400 },
  { id: 'lib-ext', name: 'Library Extension', type: 'Facility', x: 160, y: 560 },
  { id: 'bhavans-college', name: "Bhavan's College", type: 'College', x: 340, y: 420 },
  { id: 'cultural', name: "Bhavan's Cultural Centre", type: 'Cultural', x: 680, y: 90 },
  { id: 'spjimr', name: 'SPJIMR', type: 'Institute', x: 170, y: 470 },
  { id: 'spjimr-hostel', name: 'SPJIMR Hostel', type: 'Hostel', x: 280, y: 60 },
  { id: 'hostel', name: 'Hostel', type: 'Hostel', x: 120, y: 70 },
  { id: 'wadia', name: 'A.H. Wadia Highschool', type: 'School', x: 500, y: 55 },
  { id: 'sports-complex', name: 'Sports Complex', type: 'Sports', x: 670, y: 520 },
  { id: 'playground', name: 'Playground', type: 'Sports', x: 670, y: 320 },
  { id: 'lake', name: 'Lake', type: 'Landmark', x: 380, y: 260 }
];

// Weighted adjacency list (walking distance units)
window.CAMPUS_GRAPH = {
  'entrance': { 'lib-ext': 4, 'spjimr': 5, 'library': 6, 'bhavans-college': 5 },
  'lib-ext': { 'entrance': 4, 'spjimr': 3, 'spit': 5 },
  'spjimr': { 'lib-ext': 3, 'entrance': 5, 'spce': 4, 'spit': 3 },
  'spit': { 'spjimr': 3, 'spce': 2, 'workshop': 4, 'lib-ext': 5 },
  'spce': { 'spit': 2, 'spjimr': 4, 'bhavans-college': 3, 'workshop': 3, 'lake': 4 },
  'workshop': { 'spit': 4, 'spce': 3, 'hostel': 5 },
  'hostel': { 'workshop': 5, 'spjimr-hostel': 3 },
  'spjimr-hostel': { 'hostel': 3, 'wadia': 4, 'cultural': 6, 'lake': 5 },
  'wadia': { 'spjimr-hostel': 4, 'cultural': 3 },
  'cultural': { 'wadia': 3, 'spjimr-hostel': 6, 'library': 5, 'playground': 4, 'lake': 6 },
  'library': { 'entrance': 6, 'bhavans-college': 2, 'cultural': 5, 'playground': 3, 'lake': 4 },
  'bhavans-college': { 'entrance': 5, 'spce': 3, 'library': 2, 'lake': 3 },
  'playground': { 'library': 3, 'cultural': 4, 'sports-complex': 2 },
  'sports-complex': { 'playground': 2 },
  'lake': { 'spce': 4, 'spjimr-hostel': 5, 'cultural': 6, 'library': 4, 'bhavans-college': 3 }
};

window.dijkstra = function(graph, start, end) {
  const dist = {};
  const prev = {};
  const pq = new Set(Object.keys(graph));

  Object.keys(graph).forEach(n => { dist[n] = Infinity; prev[n] = null; });
  if (!(start in graph) || !(end in graph)) return null;
  dist[start] = 0;

  while (pq.size > 0) {
    let u = null;
    let min = Infinity;
    pq.forEach(n => {
      if (dist[n] < min) { min = dist[n]; u = n; }
    });
    if (u === null || u === end) break;
    pq.delete(u);

    const neighbors = graph[u] || {};
    for (const [v, w] of Object.entries(neighbors)) {
      const alt = dist[u] + w;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  const path = [];
  let cur = end;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  if (path[0] !== start) return null;
  return { path, distance: dist[end] };
};

window.getLocationName = function(id) {
  const loc = window.CAMPUS_LOCATIONS.find(l => l.id === id);
  return loc ? loc.name : id;
};

// Short label for map (avoid "A" only)
window.getShortLabel = function(id) {
  const map = {
    'entrance': 'Main Entrance',
    'spit': 'SPIT',
    'spce': 'SPCE',
    'workshop': 'Workshop',
    'library': 'Library',
    'lib-ext': 'Library Extension',
    'bhavans-college': "Bhavan's College",
    'cultural': 'Cultural Centre',
    'spjimr': 'SPJIMR',
    'spjimr-hostel': 'SPJIMR Hostel',
    'hostel': 'Hostel',
    'wadia': 'A. H. Wadia HS',
    'sports-complex': 'Sports Complex',
    'playground': 'Playground',
    'lake': 'Lake'
  };
  return map[id] || id;
};