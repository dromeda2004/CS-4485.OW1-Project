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

    // If the Lambda /heatmap endpoint returns an object with heatmap_locations, convert that.
    if (data && Array.isArray(data.heatmap_locations)) {
      const mapped = data.heatmap_locations.map((loc) => {
        // loc is expected to have { lat, lon, avg_score } (already normalized in your DynamoDB)
        const lat = Number(loc.lat);
        const lng = Number(loc.lon ?? loc.lng ?? loc.longitude);
        // Multiply avg_score/intensity by 100 as requested
        const rawScore = Number(loc.intensity ?? loc.weight ?? loc.avg_score ?? 0) || 0;
        const weight = Math.max(1, rawScore * 100);
        return [lat, lng, weight];
      });
      if (mapped.length === 0) {
        console.warn("addressPoints API returned empty heatmap_locations, using static points");
        return { points: staticPoints, source: 'static' };
      }
      return { points: mapped, source: 'live' };
    }

    const normalized = normalizePoints(data);
    if (!normalized || normalized.length === 0) {
      console.warn("addressPoints API returned empty data, using static points");
      return { points: staticPoints, source: 'static' };
    }
    return { points: normalized, source: 'live' };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn("addressPoints API request timed out, using static points");
    } else {
      console.warn("addressPoints API request failed, using static points", err);
    }
    return { points: staticPoints, source: 'static' };
  }
}
