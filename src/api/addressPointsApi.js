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
        const weight = Math.round(Math.max(1, rawScore * 100));
        const name = loc.location_name;
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
       
        return [lat, lng, weight, disasterType, name];

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
// src/api/breakingPostsApi.js
const DEFAULT_LAMBDA_POSTS =
  "https://lhncgjlrzotzbrvqulbeq5jm340jtaza.lambda-url.us-east-1.on.aws/breaking-disaster";

export async function fetchBreakingPosts({
  url = process.env.REACT_APP_POSTS_URL || DEFAULT_LAMBDA_POSTS,
  timeout = 7000,
} = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      console.warn("Posts API returned non-OK:", res.status);
      return null;
    }

    const data = await res.json();

    // Handle Lambda wrapping like { statusCode, body }
    if (data && data.statusCode && data.body) {
      try {
        return JSON.parse(data.body);
      } catch (e) {
        console.warn("Posts API returned invalid JSON body:", e);
        return null;
      }
    }

    return data;
  } catch (err) {
    clearTimeout(id);
    console.error("Failed to fetch breaking posts:", err);
    return null;
  }
}

const DEFAULT_TOP_POSTS_API = process.env.REACT_APP_TOP_POSTS_URL || "https://8rhqi3yodd.execute-api.us-east-1.amazonaws.com/production/top-posts";

export async function fetchTopPostsByLocation(locationName, { url = DEFAULT_TOP_POSTS_API, timeout = 7000 } = {}) {
  if (!locationName) return null;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const fullUrl = `${url}?location_name=${encodeURIComponent(locationName)}`;
    const res = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      console.warn("topPosts API returned non-OK status:", res.status);
      return null;
    }

    const data = await res.json();

    if (data && data.statusCode && data.body) {
      try {
        return JSON.parse(data.body);
      } catch (e) {
        console.warn("topPosts API returned invalid JSON body:", e);
        return null;
      }
    }

    return data;
  } catch (err) {
    clearTimeout(id);
    console.error("Failed to fetch top posts:", err);
    return null;
  }
}
