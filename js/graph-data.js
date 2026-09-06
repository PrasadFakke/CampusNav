// ========== CAMPUS GRAPH DATA (Phase 2) ==========
// Locations based on SPIT / Bhavan's campus map

window.CAMPUS_LOCATIONS = [
  { id: 'entrance', name: 'Main Entrance (You Are Here)', type: 'Entrance', x: 400, y: 620 },
  { id: 'spit', name: 'SPIT', type: 'Institute', x: 95, y: 355 },
  { id: 'spce', name: 'SPCE', type: 'College', x: 205, y: 335 },
  { id: 'workshop', name: 'SPCE Workshop', type: 'Workshop', x: 90, y: 220 },
  { id: 'library', name: 'Library', type: 'Facility', x: 480, y: 390 },
  { id: 'lib-ext', name: 'Library Extension', type: 'Facility', x: 170, y: 575 },
  { id: 'bhavans-college', name: "Bhavan's College", type: 'College', x: 345, y: 415 },
  { id: 'cultural', name: "Bhavan's Cultural Centre", type: 'Cultural', x: 660, y: 105 },
  { id: 'spjimr', name: 'SPJIMR', type: 'Institute', x: 175, y: 480 },
  { id: 'spjimr-hostel', name: 'SPJIMR Hostel', type: 'Hostel', x: 285, y: 70 },
  { id: 'hostel', name: 'Hostel', type: 'Hostel', x: 130, y: 85 },
  { id: 'wadia', name: 'A. H. Wadia Highschool', type: 'School', x: 490, y: 75 },
  { id: 'sports-complex', name: 'Sports Complex', type: 'Sports', x: 670, y: 440 },
  { id: 'playground', name: 'Playground', type: 'Sports', x: 670, y: 340 },
  { id: 'lake', name: 'Lake', type: 'Landmark', x: 380, y: 280 }
];

// Weighted adjacency list (walking distance units)
// Bidirectional edges
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

// Dijkstra's Algorithm
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
      if (!pq.has(v) && v !== end && dist[v] !== Infinity) continue;
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
