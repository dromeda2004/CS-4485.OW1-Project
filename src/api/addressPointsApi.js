import { addressPoints as staticPoints } from "../addressPoints";

// Normalizes various possible server responses into the expected shape:
// Array of [lat, lng, weight]
function normalizePoints(data) {
  if (!Array.isArray(data)) return [];

  return data.map((p) => {
    // allow forms: {lat, lng, weight} or [lat, lng, weight]
    if (Array.isArray(p)) {
      const lat = Number(p[0]);
      const lng = Number(p[1]);
      const weight = p[2] !== undefined ? Number(p[2]) : undefined;
      return [lat, lng, weight].filter((x, i) => x !== undefined || i < 2);
    }

    const lat = Number(p.lat ?? p.latitude ?? p[0]);
    const lng = Number(p.lng ?? p.longitude ?? p[1]);
    const weight = p.weight ?? p.count ?? p.intensity ?? undefined;
    return [lat, lng, weight].filter((x, i) => x !== undefined || i < 2);
  });
}

const DEFAULT_LAMBDA_HEATMAP = "https://lhncgjlrzotzbrvqulbeq5jm340jtaza.lambda-url.us-east-1.on.aws/heatmap";

export async function fetchAddressPoints({ url = process.env.REACT_APP_HEATMAP_URL || DEFAULT_LAMBDA_HEATMAP, timeout = 7000 } = {}) {
  // Try to fetch from the provided API endpoint. On failure, return staticPoints.
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      console.warn("addressPoints API returned non-OK, using static points", res.status);
      return staticPoints;
    }

    const data = await res.json();

    // Some deployments / gateway setups may return the Lambda wrapper object
    // { statusCode, headers, body } where body is a JSON string. Normalize that.
    let payload = data;
    if (payload && payload.statusCode && payload.body) {
      try {
        payload = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
      } catch (e) {
        console.warn('addressPoints API returned non-JSON body in wrapper:', e);
        payload = null;
      }
    }

    // If the Lambda /heatmap endpoint returns an object with heatmap_locations, convert that.
    if (payload && Array.isArray(payload.heatmap_locations)) {
      const mapped = payload.heatmap_locations.map((loc) => {
        // loc is expected to have { lat, lon, intensity/avg_score, disaster_breakdown }
        const lat = Number(loc.lat);
        const lng = Number(loc.lon ?? loc.lng ?? loc.longitude);
        // Multiply avg_score/intensity by 100 as requested
        const rawScore = Number(loc.intensity ?? loc.weight ?? loc.avg_score ?? 0) || 0;
        const weight = Math.max(1, rawScore * 100);

        // Determine dominant disaster type from disaster_breakdown (object of {type: count})
        let disasterType = undefined;
        const breakdown = loc.disaster_breakdown || {};
        if (breakdown && typeof breakdown === 'object') {
          const entries = Object.entries(breakdown);
          if (entries.length > 0) {
            entries.sort((a, b) => b[1] - a[1]);
            disasterType = entries[0][0];
          }
        }

        return [lat, lng, weight, disasterType];
      });
      if (mapped.length === 0) {
        console.warn('addressPoints API returned empty heatmap_locations, using static points');
        return { points: staticPoints, source: 'static' };
      }
      return { points: mapped, source: 'live' };
    }

    const normalized = normalizePoints(data);
    if (!normalized || normalized.length === 0) {
      console.warn("addressPoints API returned empty data, using static points");
      return { points: staticPoints, source: 'static' };
    }
    // Ensure normalized arrays have optional 4th element for disaster type
    const normalizedWithType = normalized.map((p) => {
      if (Array.isArray(p)) {
        return [p[0], p[1], p[2], p[3] ?? undefined];
      }
      // if p is object, try extract similar to above
      const lat = Number(p.lat ?? p.latitude ?? p[0]);
      const lng = Number(p.lng ?? p.longitude ?? p[1]);
      const weight = Number(p.weight ?? p.count ?? p.intensity ?? 0) || 0;
      const breakdown = p.disaster_breakdown || {};
      let disasterType = undefined;
      const entries = Object.entries(breakdown || {});
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        disasterType = entries[0][0];
      }
      return [lat, lng, weight, disasterType];
    });
    return { points: normalizedWithType, source: 'live' };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn("addressPoints API request timed out, using static points");
    } else {
      console.warn("addressPoints API request failed, using static points", err);
    }
    return { points: staticPoints, source: 'static' };
  }
}
