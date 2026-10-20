// k-NN, k=3, labeled set = 18 campus nodes, no train/test split.
// ========== GPS k-NN LOCATION SNAP MODULE ==========
// Provides: haversine(), knn(), nearestNode(), useMyLocation(), formatKnnStatus()
// Pure browser Geolocation API. No Google API. No npm package.

const LOCATE_MAX_DIST_M = 400; // metres — do not auto-select beyond this

/**
 * Haversine great-circle distance in metres between two WGS-84 points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in metres
 */
window.haversine = function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * k-Nearest Neighbours on campus nodes using straight-line Haversine distance.
 * Returns the k closest nodes, each { id, metres } (and name), sorted nearest first.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [k=3]
 * @returns {Array<{ id: string, name: string, metres: number }>}
 */
window.knn = function knn(lat, lon, k = 3) {
  const locs = window.CAMPUS_LOCATIONS || [];
  const results = [];

  locs.forEach((loc) => {
    if (loc.lat == null || loc.lon == null) return;
    const d = window.haversine(lat, lon, loc.lat, loc.lon);
    results.push({
      id: loc.id,
      name: loc.name,
      metres: Math.round(d),
      _rawDist: d
    });
  });

  results.sort((a, b) => a._rawDist - b._rawDist);
  return results.slice(0, k).map(({ id, name, metres }) => ({ id, name, metres }));
};

/**
 * Find the nearest single campus node (alias for knn(lat, lon, 1)[0]).
 * @param {number} lat
 * @param {number} lon
 * @returns {{ id: string, name: string, metres: number } | null}
 */
window.nearestNode = function nearestNode(lat, lon) {
  const list = window.knn(lat, lon, 1);
  return list.length ? list[0] : null;
};

/**
 * Formats the 3 nearest neighbours into the exact required status string:
 * “k-NN start: <name> (<metres> m). Also nearby: <name2> (<m2> m), <name3> (<m3> m).”
 * @param {Array<{ id: string, name?: string, metres: number }>} neighbours
 * @returns {string}
 */
window.formatKnnStatus = function formatKnnStatus(neighbours) {
  if (!neighbours || !neighbours.length) return '';
  const locs = window.CAMPUS_LOCATIONS || [];
  const getName = (item) => {
    if (!item) return '';
    if (item.name) return item.name;
    const found = locs.find((l) => l.id === item.id);
    return found ? found.name : item.id;
  };

  const n1 = neighbours[0];
  const n2 = neighbours[1];
  const n3 = neighbours[2];

  let str = `k-NN start: ${getName(n1)} (${n1.metres} m).`;
  if (n2 && n3) {
    str += ` Also nearby: ${getName(n2)} (${n2.metres} m), ${getName(n3)} (${n3.metres} m).`;
  } else if (n2) {
    str += ` Also nearby: ${getName(n2)} (${n2.metres} m).`;
  }
  return str;
};

/**
 * Use the browser Geolocation API to find device position and snap it to
 * the k=3 nearest campus nodes.
 *
 * @param {Object} callbacks
 * @param {function(Array<{ id, name, metres }>)} callbacks.onSuccess  - k closest nodes
 * @param {function(string)} callbacks.onOutsideCampus                 - nearest node > 400 m
 * @param {function(string)} callbacks.onError                         - denied / timeout / unsupported
 */
window.useMyLocation = function useMyLocation({ onSuccess, onOutsideCampus, onError } = {}) {
  const handleBlocked = () => {
    if (typeof onError === 'function') {
      onError('Location blocked. Pick your start on the map.');
    }
  };

  const handleOutside = () => {
    const msg = 'You are outside campus. Pick a start manually.';
    if (typeof onOutsideCampus === 'function') {
      onOutsideCampus(msg);
    } else if (typeof onError === 'function') {
      onError(msg);
    }
  };

  if (!navigator.geolocation) {
    handleBlocked();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      const { latitude, longitude } = pos.coords;
      const neighbours = window.knn(latitude, longitude, 3);
      if (!neighbours || !neighbours.length) {
        handleBlocked();
        return;
      }
      if (neighbours[0].metres > LOCATE_MAX_DIST_M) {
        handleOutside();
        return;
      }
      if (typeof onSuccess === 'function') {
        onSuccess(neighbours);
      }
    },
    function (err) {
      handleBlocked();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};
