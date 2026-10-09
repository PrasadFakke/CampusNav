// ========== CAMPUS GRAPH DATA ==========
window.CAMPUS_LOCATIONS = [
  { id: 'entrance', name: 'Main Entrance', type: 'Entrance', x: 400, y: 640 },
  { id: 'spit', name: "Bhavan's Sardar Patel Institute of Technology (SPIT)", type: 'Institute', x: 80, y: 360 },
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
  { id: 'lake', name: 'Lake', type: 'Landmark', x: 380, y: 260 },
  { id: 'canteen', name: 'Canteen', type: 'Canteen', x: 250, y: 520 },
  { id: 'medical', name: 'Medical Centre', type: 'Medical', x: 455, y: 560 },
  { id: 'security', name: 'Security Office', type: 'Emergency', x: 330, y: 640 }
];

window.CAMPUS_GRAPH = {
  'entrance': { 'lib-ext': 4, 'spjimr': 5, 'library': 6, 'bhavans-college': 5, 'medical': 3, 'security': 2 },
  'lib-ext': { 'entrance': 4, 'spjimr': 3, 'spit': 5, 'canteen': 2 },
  'spjimr': { 'lib-ext': 3, 'entrance': 5, 'spce': 4, 'spit': 3, 'canteen': 2 },
  'spit': { 'spjimr': 3, 'spce': 2, 'workshop': 4, 'lib-ext': 5 },
  'spce': { 'spit': 2, 'spjimr': 4, 'bhavans-college': 3, 'workshop': 3, 'lake': 4 },
  'workshop': { 'spit': 4, 'spce': 3, 'hostel': 5 },
  'hostel': { 'workshop': 5, 'spjimr-hostel': 3 },
  'spjimr-hostel': { 'hostel': 3, 'wadia': 4, 'cultural': 6, 'lake': 5 },
  'wadia': { 'spjimr-hostel': 4, 'cultural': 3 },
  'cultural': { 'wadia': 3, 'spjimr-hostel': 6, 'library': 5, 'playground': 4, 'lake': 6 },
  'library': { 'entrance': 6, 'bhavans-college': 2, 'cultural': 5, 'playground': 3, 'lake': 4, 'medical': 3 },
  'bhavans-college': { 'entrance': 5, 'spce': 3, 'library': 2, 'lake': 3, 'canteen': 3 },
  'playground': { 'library': 3, 'cultural': 4, 'sports-complex': 2 },
  'sports-complex': { 'playground': 2 },
  'lake': { 'spce': 4, 'spjimr-hostel': 5, 'cultural': 6, 'library': 4, 'bhavans-college': 3 },
  'canteen': { 'lib-ext': 2, 'spjimr': 2, 'bhavans-college': 3 },
  'medical': { 'entrance': 3, 'library': 3, 'security': 3 },
  'security': { 'entrance': 2, 'medical': 3 }
};

window.FACILITY_TYPES = {
  Library: ['library', 'lib-ext'],
  Canteen: ['canteen'],
  Medical: ['medical'],
  Washroom: ['library', 'spit', 'spce'],
  Parking: ['entrance', 'sports-complex'],
  Sports: ['playground', 'sports-complex'],
  Hostel: ['hostel', 'spjimr-hostel'],
  Emergency: ['medical', 'security', 'entrance']
};

window.EMERGENCY_TARGETS = ['medical', 'security'];

window.edgeKey = function (u, v) {
  return [u, v].sort().join('|');
};

window.graphWithoutBlocked = function (blockedKeys) {
  const blocked = new Set(blockedKeys || []);
  const g = {};
  Object.keys(window.CAMPUS_GRAPH).forEach((u) => {
    g[u] = {};
    Object.keys(window.CAMPUS_GRAPH[u] || {}).forEach((v) => {
      if (!blocked.has(window.edgeKey(u, v))) g[u][v] = window.CAMPUS_GRAPH[u][v];
    });
  });
  return g;
};

window.allEdges = function () {
  const drawn = new Set();
  const edges = [];
  Object.keys(window.CAMPUS_GRAPH).forEach((u) => {
    Object.keys(window.CAMPUS_GRAPH[u] || {}).forEach((v) => {
      const key = window.edgeKey(u, v);
      if (drawn.has(key)) return;
      drawn.add(key);
      edges.push({ u, v, key, w: window.CAMPUS_GRAPH[u][v] });
    });
  });
  return edges;
};

window.dijkstra = function (graph, start, end) {
  const dist = {};
  const prev = {};
  const pq = new Set(Object.keys(graph));
  Object.keys(graph).forEach((n) => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  if (!(start in graph) || !(end in graph)) return null;
  dist[start] = 0;
  while (pq.size > 0) {
    let u = null;
    let min = Infinity;
    pq.forEach((n) => {
      if (dist[n] < min) {
        min = dist[n];
        u = n;
      }
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

/** BFS: nearest node whose id is in targetIds (unweighted hops). Skips missing/blocked neighbours. */
window.bfsNearest = function (graph, start, targetIds) {
  const targets = new Set(targetIds);
  if (!(start in graph)) return null;
  if (targets.has(start)) return { path: [start], hops: 0, id: start };
  const q = [start];
  const prev = { [start]: null };
  const seen = new Set([start]);
  while (q.length) {
    const u = q.shift();
    const neighbors = Object.keys(graph[u] || {});
    for (let i = 0; i < neighbors.length; i++) {
      const v = neighbors[i];
      if (seen.has(v) || !(v in graph)) continue;
      seen.add(v);
      prev[v] = u;
      if (targets.has(v)) {
        const path = [];
        let cur = v;
        while (cur) {
          path.unshift(cur);
          cur = prev[cur];
        }
        return { path, hops: path.length - 1, id: v };
      }
      q.push(v);
    }
  }
  return null;
};

/** Shortest walking facility of a type after blocked roads (Dijkstra, same as Find Route). */
window.nearestByDistance = function (graph, start, targetIds) {
  let best = null;
  (targetIds || []).forEach((t) => {
    const r = window.dijkstra(graph, start, t);
    if (!r) return;
    if (!best || r.distance < best.distance) {
      best = { id: t, path: r.path, distance: r.distance };
    }
  });
  return best;
};

window.getLocationName = function (id) {
  const loc = window.CAMPUS_LOCATIONS.find((l) => l.id === id);
  return loc ? loc.name : id;
};

window.getShortLabel = function (id) {
  const map = {
    entrance: 'Main',
    spit: 'SPIT',
    spce: 'SPCE',
    workshop: 'Workshop',
    library: 'Library',
    'lib-ext': 'Lib Ext',
    'bhavans-college': "Bhavan's",
    cultural: 'Cultural',
    spjimr: 'SPJIMR',
    'spjimr-hostel': 'SPJIMR Hostel',
    hostel: 'Hostel',
    wadia: 'Wadia HS',
    'sports-complex': 'Sports',
    playground: 'Playground',
    lake: 'Lake',
    canteen: 'Canteen',
    medical: 'Medical',
    security: 'Security'
  };
  return map[id] || id;
};