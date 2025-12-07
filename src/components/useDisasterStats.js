import { useMemo, useState, useEffect } from "react";
import { getContinentFromCoordinates, aggregateStatsByContinent } from "../api/addressPointsApi"; // your API function

export function useDisasterStats(points,historicalPointsForLive = []) {

  const [continentStats, setContinentStats] = useState({
    continentCounts: {},
    impactByContinent: [],
  });



  function classifyDisasterType(type) {
    if (!type) return "Unknown";
    const t = String(type).toLowerCase();
    if (t.includes("wildfire")) return "Wildfires";
    if (t.includes("earthquake")) return "Earthquakes";
    if (t.includes("tsunami")) return "Tsunamis";
    if (t.includes("flood")) return "Floods";
    if (t.includes("tornado")) return "Tornadoes";
    if (t.includes("storm") || t.includes("cyclone") || t.includes("typhoon") || t.includes("hurricane"))
      return "Storms";
    return "Other";
  }

  function classifyIntensity(weight) {
    if (weight == null) return "Unknown";
    if (weight < 1000) return "Low";
    if (weight < 10000) return "Medium";
    return "High";
  }
useEffect(() => {
  let cancelled = false;
  async function computeContinents() {
    if (!points.length) {
      setContinentStats({ continentCounts: {}, impactByContinent: [] });
      return;
    }

    const agg = await aggregateStatsByContinent(points);
    if (cancelled || !agg) return;

    const continentCounts = {};
    agg.forEach(({ continent, count }) => {
      continentCounts[continent] = count;
    });

    const impactByContinent = agg.map(({ continent, totalIntensity, averageIntensity }) => ({
      continent,
      totalIntensity,
      averageIntensity,
    }));

    setContinentStats({ continentCounts, impactByContinent });
  }
  computeContinents();
      return () => {
      cancelled = true;
    };
}, [points]);

function computeTop5HistoricalAndLive(historicalPoints, livePoints) {
    const all = [...(historicalPoints || []), ...(livePoints || [])];
    if (!all.length) return [];

    const byLocation = {};

    all.forEach(([lat, lng, intensity, type, name]) => {
      const locName = name || "Unknown";
      const key = `${locName}:${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (!byLocation[key]) {
        byLocation[key] = {
          locationKey: key,
          name: locName,
          lat,
          lng,
          totalIntensity: 0,
          eventCount: 0,
        };
      }
      byLocation[key].totalIntensity += intensity || 0;
      byLocation[key].eventCount += 1;
    });

    return Object.values(byLocation)
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 5);
  }


  return useMemo(() => {
    if (!points || points.length === 0) {
      return {
        pieData: [],
        stackedData: [],
        topHotspots: [],
        coOccurrenceData: [],
        severityPercentiles: {},
        continentCounts: {},
        avgIntensityByType: [],
        impactByContinent: [],
        top5HistoricalAndLive: []
      };
    }

    // Disaster count by category for pie chart
    const categorizedCounts = {};

    // Intensity classification by type for stacked bar chart
    const intensityMap = {};

    // Top hotspots by location aggregation
    const locationMap = {};

    // Disaster types present for co-occurrence matrix
    const disasterTypesSet = new Set();

    // Collect intensities for percentiles
    const intensities = [];

    points.forEach((p) => {
      const lat = p[0];
      const lng = p[1];
      const intensity = p[2] || 0;
      const rawType = p[3];
      const type = classifyDisasterType(rawType);

      disasterTypesSet.add(type);

      categorizedCounts[type] = (categorizedCounts[type] || 0) + 1;

      const intensityClass = classifyIntensity(intensity);
      if (!intensityMap[type]) {
        intensityMap[type] = { name: type, Low: 0, Medium: 0, High: 0, Unknown: 0 };
      }
      intensityMap[type][intensityClass] = (intensityMap[type][intensityClass] || 0) + 1;

      // Use location key with lat, lng fixed to 3 decimals for grouping
      const locationKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (!locationMap[locationKey]) {
        locationMap[locationKey] = { count: 0, totalIntensity: 0, location: locationKey };
      }
      locationMap[locationKey].count += 1;
      locationMap[locationKey].totalIntensity += intensity;

      intensities.push(intensity);
    });

    // Pie chart array
    const pieData = Object.entries(categorizedCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        // Sort "Other" to the end
        if (a.name === "Other") return 1;
        if (b.name === "Other") return -1;
        // Otherwise sort by value descending
        return b.value - a.value;
      });

    // Stacked bar data array
    const stackedData = Object.values(intensityMap);

    // Top hotspots sorted
    const topHotspots = Object.values(locationMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Co-occurrence matrix calculation
    const disasterTypes = Array.from(disasterTypesSet);
    const proximityThreshold = 0.1; // approximate degrees threshold

    // Initialize co-occurrence matrix
    const coOccurrenceMatrix = {};
    disasterTypes.forEach((type) => {
      coOccurrenceMatrix[type] = {};
      disasterTypes.forEach((t2) => {
        coOccurrenceMatrix[type][t2] = 0;
      });
    });

    // Efficient double loop over points to count co-occurrences by proximity

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const type1 = classifyDisasterType(p1[3]);
      const lat1 = p1[0];
      const lng1 = p1[1];
      for (let j = i + 1; j < points.length; j++) {
        const p2 = points[j];
        const type2 = classifyDisasterType(p2[3]);
        const lat2 = p2[0];
        const lng2 = p2[1];
        const dist = Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
        if (dist < proximityThreshold) {
          coOccurrenceMatrix[type1][type2]++;
          coOccurrenceMatrix[type2][type1]++;
        }
      }
    }

    // Flatten co-occurrence into list for table rendering
    const coOccurrenceData = [];
    disasterTypes.forEach((type1) => {
      disasterTypes.forEach((type2) => {
        if (type1 <= type2) {
          coOccurrenceData.push({
            type1,
            type2,
            count: coOccurrenceMatrix[type1][type2],
          });
        }
      });
    });

    // Severity percentiles helper
    function percentile(arr, p) {
      if (arr.length === 0) return 0;
      const idx = Math.floor(p * (arr.length - 1));
      return arr[idx];
    }
    intensities.sort((a, b) => a - b);

    const severityPercentiles = {
      p25: percentile(intensities, 0.25),
      p50: percentile(intensities, 0.5),
      p75: percentile(intensities, 0.75),
    };

    // You can add continentCounts, avgIntensityByType, impactByContinent similarly if continent data is provided

        const top5HistoricalAndLive = computeTop5HistoricalAndLive(
      historicalPointsForLive,
      points
    );

    return {
      pieData,
      stackedData,
      topHotspots,
      coOccurrenceData,
      severityPercentiles,
      continentCounts: continentStats.continentCounts,
      impactByContinent: continentStats.impactByContinent,
      top5HistoricalAndLive
      // additional stats keys here...
    };
  }, [points, historicalPointsForLive, continentStats]);
}
