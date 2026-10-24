// ========== CAMPUS NODE ICONS & ROUTE WALKER MODULE ==========
// Visual enhancements: SVG text emoji icons for each campus vertex
// and smooth SVG animateMotion walking marker along computed paths.

window.CAMPUS_NODE_ICONS = {
  'entrance': '🚪',
  'spit': '🏫',
  'spce': '🏛️',
  'workshop': '🔧',
  'library': '📚',
  'lib-ext': '📖',
  'bhavans-college': '🎓',
  'cultural': '🎭',
  'spjimr': '🏢',
  'spjimr-hostel': '🛏️',
  'hostel': '🏠',
  'wadia': '🏫',
  'sports-complex': '🏟️',
  'playground': '⚽',
  'lake': '💧',
  'canteen': '🍽️',
  'medical': '🏥',
  'security': '🛡️'
};

window.getNodeIcon = function (id) {
  return (window.CAMPUS_NODE_ICONS && window.CAMPUS_NODE_ICONS[id]) || '📍';
};

/**
 * Animate one marker (🚶) along the highlighted path from the first node to the last.
 * Uses SVG animateMotion to travel slowly and continuously along the route.
 * Removes any old marker first.
 *
 * @param {SVGElement} svg
 * @param {Array<string>} pathIds
 * @param {Array<Object>} [locations]
 */
window.animateRouteWalker = function (svg, pathIds, locations, lakeRx, lakeRy) {
  if (!svg) return;

  // 1. Always remove old marker first
  const oldMarker = svg.querySelector('.route-walker-group');
  if (oldMarker) {
    oldMarker.remove();
  }

  // 2. If no path or path < 2 nodes, show no marker
  if (!pathIds || pathIds.length < 2) {
    return;
  }

  const locs = locations || window.CAMPUS_LOCATIONS || [];
  const locMap = {};
  locs.forEach((loc) => {
    locMap[loc.id] = loc;
  });

  const first = locMap[pathIds[0]];
  const second = locMap[pathIds[1]];
  if (!first || !second) return;

  lakeRx = lakeRx || 86;
  lakeRy = lakeRy || 68;
  const firstEdge = window.getEdgeDisplayPoints(first, second, lakeRx, lakeRy);
  const startX = first.id === 'lake' ? firstEdge.x1 : first.x;
  const startY = first.id === 'lake' ? firstEdge.y1 : first.y;
  let pathD = `M ${startX} ${startY}`;
  let lakeEntryFrom = null;

  for (let i = 0; i < pathIds.length - 1; i++) {
    const from = locMap[pathIds[i]];
    const to = locMap[pathIds[i + 1]];
    if (!from || !to) return;

    const edge = window.getEdgeDisplayPoints(from, to, lakeRx, lakeRy);
    if (to.id === 'lake') {
      pathD += ` L ${edge.x2} ${edge.y2}`;
      lakeEntryFrom = from;
    } else if (from.id === 'lake') {
      if (lakeEntryFrom) {
        const lakeArc = window.getLakeArc(lakeEntryFrom, to, lakeRx, lakeRy);
        if (lakeArc) {
          pathD += ` ${lakeArc.arcD}`;
        } else {
          pathD += ` L ${edge.x1} ${edge.y1}`;
        }
      } else {
        pathD += ` L ${edge.x1} ${edge.y1}`;
      }
      pathD += ` L ${to.x} ${to.y}`;
      lakeEntryFrom = null;
    } else {
      pathD += ` L ${to.x} ${to.y}`;
    }
  }

  const pathUid = 'route_path_' + Math.random().toString(36).substr(2, 8);

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'route-walker-group');
  group.style.pointerEvents = 'none';

  group.innerHTML = `
    <path id="${pathUid}" d="${pathD}" fill="none" stroke="none" opacity="0"/>
    <g class="route-walker-marker" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.35))">
      <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#4f46e5" stroke-width="3"/>
      <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="30" style="user-select:none;">🚶</text>
      <animateMotion begin="indefinite" dur="5s" repeatCount="indefinite" path="${pathD}">
        <mpath href="#${pathUid}" xlink:href="#${pathUid}"/>
      </animateMotion>
    </g>
  `;

  svg.appendChild(group);
  group.querySelector('animateMotion').beginElement();
};

/**
 * Render a complete campus mini map SVG with node icons and animated walker.
 * Used on Navigate, Nearest, and Emergency pages.
 *
 * @param {SVGElement} svg
 * @param {Array<string>} pathIds
 * @param {Array<string>} [blockedEdges]
 */
window.renderCampusMiniMap = function (svg, pathIds, blockedEdges) {
  if (!svg) return;
  const locations = window.CAMPUS_LOCATIONS || [];
  const blocked = blockedEdges || [];
  const pathSet = new Set(pathIds || []);

  function isPathEdge(u, v) {
    if (!pathIds || pathIds.length < 2) return false;
    for (let i = 0; i < pathIds.length - 1; i++) {
      if ((pathIds[i] === u && pathIds[i + 1] === v) || (pathIds[i] === v && pathIds[i + 1] === u)) {
        return true;
      }
    }
    return false;
  }

  const lake = locations.find((loc) => loc.id === 'lake');
  let edgesHtml = lake
    ? `<ellipse cx="${lake.x}" cy="${lake.y}" rx="86" ry="68" fill="none"
        stroke="#cbd5e1" stroke-width="2.5" opacity="0.6" pointer-events="none"/>`
    : '';
  const drawn = new Set();

  Object.keys(window.CAMPUS_GRAPH || {}).forEach((u) => {
    const locU = locations.find((l) => l.id === u);
    if (!locU) return;
    Object.keys(window.CAMPUS_GRAPH[u] || {}).forEach((v) => {
      const key = window.edgeKey ? window.edgeKey(u, v) : [u, v].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);
      const locV = locations.find((l) => l.id === v);
      if (!locV) return;
      const isBlocked = blocked.includes(key);
      const isPath = !isBlocked && isPathEdge(u, v);
      const strokeColor = isBlocked ? '#ef4444' : isPath ? '#4f46e5' : '#cbd5e1';
      const animClass = isPath ? 'class="path-edge-animated"' : '';
      const edgePoints = window.getEdgeDisplayPoints(locU, locV, 86, 68);

      edgesHtml += `<line x1="${edgePoints.x1}" y1="${edgePoints.y1}" x2="${edgePoints.x2}" y2="${edgePoints.y2}"
        stroke="${strokeColor}" stroke-width="${isPath ? 5.5 : 2.5}" stroke-dasharray="${isBlocked ? '6 4' : '0'}"
        stroke-linecap="round" opacity="${isPath ? 1 : 0.6}" ${animClass}/>`;
    });
  });

  if (pathIds && pathIds.length > 2) {
    for (let i = 1; i < pathIds.length - 1; i++) {
      if (pathIds[i] !== 'lake') continue;
      const from = locations.find((loc) => loc.id === pathIds[i - 1]);
      const to = locations.find((loc) => loc.id === pathIds[i + 1]);
      if (!from || !to) continue;
      const lakeArc = window.getLakeArc(from, to, 86, 68);
      if (lakeArc) {
        edgesHtml += `<path d="${lakeArc.fullD}" fill="none" stroke="#4f46e5" stroke-width="5.5"
          stroke-linecap="round" stroke-linejoin="round" class="path-edge-animated" pointer-events="none"/>`;
      }
    }
  }

  let nodesHtml = '';
  locations.forEach((loc) => {
    if (loc.id === 'lake') {
      nodesHtml += `
        <g class="lake-promenade-group" pointer-events="none">
          <ellipse cx="${loc.x}" cy="${loc.y}" rx="72" ry="56" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.8" />
          <ellipse cx="${loc.x}" cy="${loc.y}" rx="68" ry="52" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2" opacity="0.95" />
          <path d="M ${loc.x - 22} ${loc.y - 16} Q ${loc.x - 14} ${loc.y - 20} ${loc.x - 6} ${loc.y - 16} T ${loc.x + 8} ${loc.y - 16}" fill="none" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <path d="M ${loc.x + 6} ${loc.y + 12} Q ${loc.x + 14} ${loc.y + 8} ${loc.x + 22} ${loc.y + 12} T ${loc.x + 36} ${loc.y + 12}" fill="none" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <text x="${loc.x}" y="${loc.y - 3}" text-anchor="middle" dominant-baseline="central" font-size="20" style="user-select:none;">💧</text>
          <text x="${loc.x}" y="${loc.y + 15}" text-anchor="middle" fill="#0284c7" font-size="11" font-weight="800" letter-spacing="1">LAKE</text>
          <text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">WALKWAY</text>
        </g>`;
      return;
    }
    const onPath = pathSet.has(loc.id);
    const isStart = pathIds && pathIds[0] === loc.id;
    const isEnd = pathIds && pathIds[pathIds.length - 1] === loc.id;

    let fill = '#ffffff';
    let stroke = '#4f46e5';
    let strokeW = 2.5;
    let r = onPath ? 16 : 13;

    if (isStart) {
      fill = '#10b981';
      stroke = '#047857';
      strokeW = 3;
    } else if (isEnd) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      strokeW = 3;
    } else if (onPath) {
      fill = '#6366f1';
      stroke = '#4338ca';
      strokeW = 3;
    }

    const icon = window.getNodeIcon(loc.id);
    nodesHtml += `<g class="mini-node" data-id="${loc.id}">
      <circle cx="${loc.x}" cy="${loc.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <text x="${loc.x}" y="${loc.y}" text-anchor="middle" dominant-baseline="central" font-size="18" style="user-select:none;pointer-events:none;">${icon}</text>
      <text x="${loc.x}" y="${loc.y + 26}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="700">${window.getShortLabel ? window.getShortLabel(loc.id) : loc.name}</text>
    </g>`;
  });

  svg.innerHTML = `<rect width="800" height="700" fill="#f8fafc" rx="14"/>${edgesHtml}${nodesHtml}`;

  // Animate the route walker
  window.animateRouteWalker(svg, pathIds, locations, 86, 68);
};
