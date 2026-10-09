// ========== INDOOR FLOOR PLANS ==========
// Each building that has an indoor map is registered in INDOOR_PLANS under the
// SAME id used in CAMPUS_LOCATIONS (e.g. 'spit'). The campus map shows an
// "Enter" button on those nodes and opens /indoor.html?building=<id>.
//
// Coordinates are SVG units taken from the floor-plan image (viewBox below).
// Distances are APPROXIMATE metres: px / metresPerPx, rounded to 0.5 m.
// You can override any edge by giving it a 4th value, e.g. ['a','b', 'label', 3].

(function () {
  const SCALE = 30.7; // ~30.7 px per metre (14.5 m ≈ 445 px on the plan)

  function build(plan) {
    const byId = {};
    plan.nodes.forEach((n) => (byId[n.id] = n));
    const graph = {};
    plan.nodes.forEach((n) => (graph[n.id] = {}));
    plan.edges.forEach(([a, b, override]) => {
      const A = byId[a];
      const B = byId[b];
      const px = Math.hypot(A.x - B.x, A.y - B.y);
      const m = override != null ? override : Math.max(1, Math.round((px / SCALE) * 2) / 2);
      graph[a][b] = m;
      graph[b][a] = m;
    });
    plan.graph = graph;
    plan.byId = byId;
    return plan;
  }

  window.INDOOR_PLANS = {
    spit: build({
      id: 'spit',
      name: "Bhavan's Sardar Patel Institute of Technology (SPIT)",
      shortName: 'SPIT',
      floor: 'Ground floor',
      viewBox: '0 0 990 420',
      // Drawn shapes: outer walls + rooms (x, y, w, h)
      outline: { x: 30, y: 35, w: 930, h: 360 },
      rooms: [
        { id: 'r008', x: 30, y: 35, w: 167, h: 141, fill: '#2b2f4a' },
        { id: 'stairs', x: 260, y: 36, w: 40, h: 146, fill: '#2a2a3a', stairs: true },
        { id: 'office', x: 337, y: 99, w: 140, h: 85, fill: '#3a2f4f' },
        { id: 'xerox', x: 307, y: 185, w: 33, h: 47, fill: '#2f3a3a' },
        { id: 'r003', x: 755, y: 37, w: 125, h: 70, fill: '#2b2f4a' },
        { id: 'r001', x: 880, y: 60, w: 75, h: 188, fill: '#2b2f4a' }
      ],
      // Rooms/places a person can start or end at (hall-* are hidden corridor points)
      nodes: [
        { id: 'entrance', name: 'Entrance / Exit', label: 'Entrance', type: 'Entrance', x: 60, y: 333 },
        { id: 'r008', name: 'Room 008', label: '008', type: 'Classroom', x: 133, y: 107 },
        { id: 'stairs', name: 'Staircase', label: 'Stairs', type: 'Stairs', x: 280, y: 110 },
        { id: 'xerox', name: 'Alams Xerox', label: 'Xerox', type: 'Xerox', x: 323, y: 208 },
        { id: 'office', name: 'Office', label: 'Office', type: 'Office', x: 411, y: 142 },
        { id: 'r003', name: 'Room 003', label: '003', type: 'Classroom', x: 824, y: 72 },
        { id: 'r001', name: 'Room 001', label: '001', type: 'Classroom', x: 920, y: 163 },
        // corridor / hall waypoints (not selectable)
        { id: 'hall-1', hidden: true, x: 113, y: 300 },
        { id: 'hall-2', hidden: true, x: 280, y: 300 },
        { id: 'hall-3', hidden: true, x: 411, y: 300 },
        { id: 'hall-4', hidden: true, x: 600, y: 300 },
        { id: 'hall-5', hidden: true, x: 824, y: 300 },
        { id: 'hall-6', hidden: true, x: 920, y: 300 },
        { id: 'hall-mid', hidden: true, x: 600, y: 145 }
      ],
      edges: [
        ['entrance', 'hall-1'],
        ['r008', 'hall-1'],
        ['hall-1', 'hall-2'],
        ['hall-2', 'hall-3'],
        ['hall-3', 'hall-4'],
        ['hall-4', 'hall-5'],
        ['hall-5', 'hall-6'],
        ['stairs', 'hall-2'],
        ['stairs', 'xerox'],
        ['xerox', 'hall-2'],
        ['office', 'hall-3'],
        ['office', 'hall-mid', 12],
        ['hall-mid', 'hall-4'],
        ['hall-mid', 'r003', 11],
        ['r003', 'r001', 3],
        ['r001', 'hall-6'],
        ['r003', 'hall-5']
      ]
    })
  };

  // true when a campus location has an indoor map
  window.hasIndoorMap = function (locationId) {
    return !!(window.INDOOR_PLANS && window.INDOOR_PLANS[locationId]);
  };
})();
