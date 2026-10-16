// ========== GPS LOCATION SNAP MODULE ==========
// Provides: haversine(), nearestNode(), useMyLocation()
// No Google API. No npm. Pure browser Geolocation API.

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
 * Find the nearest campus node to the given GPS coordinates.
 * Skips nodes that have no lat/lon (e.g. lake if it were excluded).
 * @param {number} lat
 * @param {number} lon
 * @returns {{ id: string, name: string, metres: number } | null}
 */
window.nearestNode = function nearestNode(lat, lon) {
  const locs = window.CAMPUS_LOCATIONS || [];
  let best = null;
  let bestDist = Infinity;

  locs.forEach((loc) => {
    if (loc.lat == null || loc.lon == null) return;
    const d = window.haversine(lat, lon, loc.lat, loc.lon);
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  });

  if (!best) return null;
  return { id: best.id, name: best.name, metres: Math.round(bestDist) };
};

/**
 * Use the browser Geolocation API to find the device position and snap it
 * to the nearest campus node.
 *
 * @param {Object} callbacks
 * @param {function({ id, name, metres })} callbacks.onSuccess  - nearest node (≤ 400 m)
 * @param {function(string)} callbacks.onOutsideCampus         - nearest node > 400 m
 * @param {function(string)} callbacks.onError                  - denied / timeout / unsupported
 */
window.useMyLocation = function useMyLocation({ onSuccess, onOutsideCampus, onError }) {
  if (!navigator.geolocation) {
    onError('Location blocked. Pick your start on the map.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      const { latitude, longitude } = pos.coords;
      const nearest = window.nearestNode(latitude, longitude);
      if (!nearest) {
        onError('Location blocked. Pick your start on the map.');
        return;
      }
      if (nearest.metres > LOCATE_MAX_DIST_M) {
        onOutsideCampus('You are outside campus. Pick a start manually.');
        return;
      }
      onSuccess(nearest);
    },
    function (err) {
      // GeolocationPositionError: PERMISSION_DENIED=1, POSITION_UNAVAILABLE=2, TIMEOUT=3
      onError('Location blocked. Pick your start on the map.');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};
