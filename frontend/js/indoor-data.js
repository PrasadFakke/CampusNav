// ========== INDOOR FLOOR PLANS (multi-floor) ==========
// Each building with an indoor map is registered in INDOOR_PLANS under the SAME id
// used in CAMPUS_LOCATIONS (e.g. 'spit'). Opens /indoor.html?building=<id>.
//
// A plan has several FLOORS. Each floor has its own viewBox, shapes, nodes, edges.
//   edge  = [a, b, distanceOverrideMetres?, viaPoints?]   viaPoints = [[x,y],...] bends
//   links = [[floorId:nodeId, floorId:nodeId, metres, 'Stairs' | 'Lift']]  connect floors
//
// Global node id used everywhere in the UI = "<floorId>:<nodeId>"  (e.g. "first:n4").

(function () {
  const DEFAULT_SCALE = 30.7; // px per metre (ground floor plan)

  function buildFloor(f) {
    const scale = f.scale || DEFAULT_SCALE;
    f.scale = scale;
    f.byId = {};
    f.nodes.forEach((n) => { n.floorId = f.id; n.gid = f.id + ':' + n.id; f.byId[n.id] = n; });
    f.edgeList = f.edges.map(([a, b, override, via]) => {
      const A = f.byId[a];
      const B = f.byId[b];
      const pts = [[A.x, A.y], ...(via || []), [B.x, B.y]];
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const m = override != null ? override : Math.max(1, Math.round((len / scale) * 2) / 2);
      return { a: A.gid, b: B.gid, m, pts };
    });
    return f;
  }

  function buildPlan(plan) {
    plan.floors.forEach(buildFloor);
    plan.floorById = {};
    plan.byId = {};
    plan.graph = {};
    plan.floors.forEach((f) => {
      plan.floorById[f.id] = f;
      f.nodes.forEach((n) => { plan.byId[n.gid] = n; plan.graph[n.gid] = {}; });
    });
    plan.floors.forEach((f) =>
      f.edgeList.forEach((e) => { plan.graph[e.a][e.b] = e.m; plan.graph[e.b][e.a] = e.m; })
    );
    // cross-floor links (stairs / lift)
    plan.linkList = (plan.links || []).map(([a, b, m, kind]) => {
      plan.graph[a][b] = m; plan.graph[b][a] = m;
      plan.byId[a].link = { to: b, kind }; plan.byId[b].link = { to: a, kind };
      return { a, b, m, kind };
    });
    return plan;
  }

  window.INDOOR_PLANS = {
    spit: buildPlan({
      id: 'spit',
      name: "Bhavan's Sardar Patel Institute of Technology (SPIT)",
      shortName: 'SPIT',
      defaultFloor: 'ground',
      floors: [
        // ---------------- GROUND FLOOR (unchanged) ----------------
        {
          id: 'ground',
          label: 'Ground floor',
          tab: 'Ground Floor',
          viewBox: '0 0 990 420',
          outline: { x: 30, y: 35, w: 930, h: 360 },
          rooms: [
            { id: 'r008', x: 30, y: 35, w: 167, h: 141, fill: '#eff6ff' },
            { id: 'stairs', x: 260, y: 36, w: 40, h: 146, fill: '#fef3c7', stairs: true },
            { id: 'office', x: 337, y: 99, w: 140, h: 85, fill: '#f5f3ff' },
            { id: 'xerox', x: 307, y: 185, w: 33, h: 47, fill: '#ecfdf5' },
            { id: 'r003', x: 755, y: 37, w: 125, h: 70, fill: '#eff6ff' },
            { id: 'r001', x: 880, y: 60, w: 75, h: 188, fill: '#eff6ff' }
          ],
          nodes: [
            { id: 'entrance', name: 'Entrance / Exit', label: 'Entrance', type: 'Entrance', x: 60, y: 333 },
            { id: 'r008', name: 'Room 008', label: '008', type: 'Classroom', x: 133, y: 107 },
            { id: 'stairs', name: 'Staircase', label: 'Stairs', type: 'Stairs', x: 280, y: 110 },
            { id: 'xerox', name: 'Alams Xerox', label: 'Xerox', type: 'Xerox', x: 323, y: 208 },
            { id: 'office', name: 'Office', label: 'Office', type: 'Office', x: 411, y: 142 },
            { id: 'r003', name: 'Room 003', label: '003', type: 'Classroom', x: 824, y: 72 },
            { id: 'r001', name: 'Room 001', label: '001', type: 'Classroom', x: 920, y: 163 },
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
        },

        // ---------------- 1ST FLOOR (traced from floor-plan image 1024x570) ----------------
        // Distances = the metre labels written on the plan (5 m ≈ 152 px => ~30 px/m).
        {
          id: 'first',
          label: '1st floor',
          tab: '1st Floor',
          viewBox: '0 0 1024 570',
          scale: 30,
          // building wings (outer walls)
          shapes: [
            { x: 21, y: 17, w: 245, h: 521 },   // west wing
            { x: 266, y: 137, w: 60, h: 401 },  // connector wing
            { x: 326, y: 22, w: 674, h: 518 }   // main wing
          ],
          // not walkable (open-to-below / courtyard) — "no passing" per plan note
          blocked: [{ x: 402, y: 145, w: 474, h: 302, label: 'Open area (no access)' }],
          rooms: [
            { id: 'n1', x: 21, y: 17, w: 112, h: 121, fill: '#eff6ff' },
            { id: 'n2', x: 21, y: 313, w: 109, h: 165, fill: '#eff6ff' },
            { id: 'n3', x: 218, y: 351, w: 48, h: 103, fill: '#ecfdf5', lift: true },
            { id: 'n4', x: 328, y: 25, w: 79, h: 122, fill: '#fef3c7', stairs: true },
            { id: 'n5', x: 402, y: 145, w: 90, h: 173, fill: '#f5f3ff' },
            { id: 'n6', x: 536, y: 513, w: 214, h: 31, fill: '#ecfdf5' },
            { id: 'n7', x: 770, y: 145, w: 106, h: 158, fill: '#eff6ff' },
            { id: 'n8', x: 793, y: 26, w: 57, h: 109, fill: '#fef3c7', stairs: true },
            { id: 'n9', x: 857, y: 26, w: 110, h: 41, fill: '#eff6ff' },
            { id: 'n10', x: 963, y: 25, w: 35, h: 120, fill: '#f5f3ff' }
          ],
          nodes: [
            { id: 'n1', name: 'Exam Cell', label: 'Exam Cell', type: 'Office', x: 80, y: 81 },
            { id: 'n2', name: 'Room 107', label: '107', type: 'Classroom', x: 77, y: 399 },
            { id: 'n3', name: 'Lift', label: 'Lift', type: 'Lift', x: 244, y: 399 },
            { id: 'n4', name: 'Staircase 1', label: 'Stairs 1', type: 'Stairs', x: 361, y: 102 },
            { id: 'n5', name: 'TPO Cabin', label: 'TPO', type: 'Office', x: 449, y: 193 },
            { id: 'n6', name: 'Sitting Area', label: 'Sitting', type: 'Common', x: 638, y: 525 },
            { id: 'n7', name: 'Room 105', label: '105', type: 'Classroom', x: 822, y: 225 },
            { id: 'n8', name: 'Staircase 2', label: 'Stairs 2', type: 'Stairs', x: 822, y: 90 },
            { id: 'n9', name: 'Room 103', label: '103', type: 'Classroom', x: 912, y: 48 },
            { id: 'n10', name: 'Professors Cabin', label: 'Prof. Cabin', type: 'Office', x: 981, y: 118 },
            // corridor junctions (not selectable)
            { id: 'n11a', hidden: true, x: 232, y: 224 },
            { id: 'n11b', hidden: true, x: 170, y: 502 },
            { id: 'n12', hidden: true, x: 298, y: 318 },
            { id: 'n13', hidden: true, x: 362, y: 318 },
            { id: 'n14', hidden: true, x: 362, y: 487 },
            { id: 'n15', hidden: true, x: 640, y: 487 },
            { id: 'j1', hidden: true, x: 362, y: 193 },
            { id: 'j2', hidden: true, x: 912, y: 118 }
          ],
          edges: [
            ['n1', 'n11a', 5, [[232, 81]]],
            ['n11a', 'n12', 3, [[298, 224]]],
            ['n11a', 'n11b', 10, [[232, 315], [170, 315]]],
            ['n2', 'n11b', 5, [[77, 502]]],
            ['n11b', 'n3', 3, [[244, 502]]],
            ['n3', 'n2', 8],
            ['n3', 'n12', 3, [[298, 399]]],
            ['n12', 'n13', 3],
            ['n13', 'j1', 8],
            ['j1', 'n5', 5],
            ['j1', 'n4', 3],
            ['n4', 'n5', 8, [[449, 102]]],
            ['n13', 'n14', 8],
            ['n14', 'n15', 8],
            ['n15', 'n6', 3],
            ['n15', 'n7', 12, [[640, 227]]],
            ['n7', 'n8', 4.5],
            ['n8', 'j2', 2],
            ['j2', 'n10', 1],
            ['j2', 'n9', 2.5]
          ]
        }
      ],
      // Cross-floor connections: [globalIdA, globalIdB, metres, kind]
      // Only ONE connection is defined (ground Staircase <-> 1st-floor Staircase 1).
      // Add more here, e.g. ['ground:lift', 'first:n3', 6, 'Lift'], once those exist on the ground plan.
      links: [['ground:stairs', 'first:n4', 10, 'Stairs']]
    })
  };

  window.hasIndoorMap = function (locationId) {
    return !!(window.INDOOR_PLANS && window.INDOOR_PLANS[locationId]);
  };
})();
