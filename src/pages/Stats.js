import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchOpenAIResponse } from "../api/fetchKey";
import { fetchAddressPoints, fetchHeatmapArchiveElements, getContinentFromCoordinates } from "../api/addressPointsApi";
import ReactMarkdown from "react-markdown";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { useDisasterStats } from "../components/useDisasterStats"; // Adjust path as needed

function TopIntensityTable({ points, isHistorical }) {
  const top10 = [...points]
    .sort((a, b) => (b[2] || 0) - (a[2] || 0))
    .reduce((unique, item) => {
      // Deduplicate by location name (p[4])
      const locationName = item[4] || "Unknown";
      const exists = unique.some((u) => (u[4] || "Unknown") === locationName);
      if (!exists) {
        unique.push(item);
      }
      return unique;
    }, [])
    .slice(0, 10);
  return (
    <div className="w-full bg-white rounded-lg shadow px-3 py-2 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Top 10 Highest Intensity Disasters {isHistorical ? "(Historical)" : "(Live)"}
      </h2>
      {top10.length === 0 ? (
        <p className="text-gray-600 text-center">No data available.</p>
      ) : (
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-3 py-2">Location</th>
              <th className="border border-gray-300 px-3 py-2">Intensity</th>
              <th className="border border-gray-300 px-3 py-2">Disaster Type</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((p, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 px-3 py-2">{p[4] || "Unknown"}</td>
                <td className="border border-gray-300 px-3 py-2">{Math.round(p[2] || 0)}</td>
                <td className="border border-gray-300 px-3 py-2">{p[3] || "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function getLast7DaysDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

// Aggregator: live + last-7-days historical
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

export default function Stats() {
  const [isHistorical, setIsHistorical] = useState(false);
  const [historicalRows, setHistoricalRows] = useState([]);
  const [livePoints, setLivePoints] = useState([]);
  const [aiResult, setAiResult] = useState("");
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState("2025-10-29"); // oldest snapshot default
  const [continentCounts, setContinentCounts] = useState({});
  const [impactByContinent, setImpactByContinent] = useState([]);
  const [historicalForLive, setHistoricalForLive] = useState([]);

  function toggleDataSource() {
    setIsHistorical((prev) => !prev);
  }
    useEffect(() => {
    let cancelled = false;

    async function loadHistoricalForLive() {
      // Load all historical data from oldest to today
      const dates = [];
      const today = new Date();
      const oldestDate = new Date(2025, 9, 29); // October 29, 2025 (oldest snapshot)
      
      const current = new Date(oldestDate);
      while (current <= today) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
      }
      
      const all = [];
      for (const d of dates) {
        const archive = await fetchHeatmapArchiveElements(d);
        if (archive?.points) {
          all.push(...archive.points);
        }
      }
      if (!cancelled) setHistoricalForLive(all);
    }

    loadHistoricalForLive();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function getData() {
      if (isHistorical) {
        const archive = await fetchHeatmapArchiveElements(selectedSnapshotDate);
        const rows = (archive?.points || []).map((p, idx) => ({
          id: idx + 1,
          lat: p[0],
          lng: p[1],
          intensity: p[2],
          type: p[3] || "Unknown",
          name: p[4] || "",
          snapshotDate: archive.snapshot_date,
        }));
        setHistoricalRows(rows);
        setAiResult("");
        setLivePoints([]);
      } else {
        const { points } = await fetchAddressPoints();
        setLivePoints(points || []);
        setHistoricalRows([]); // Clear historical rows

        // AI summary preparation (only for live data)
        const top = (points || [])
          .slice()
          .sort((a, b) => (b[2] || 0) - (a[2] || 0))
          .slice(0, 12);

        const counts = {};
        (points || []).forEach((p) => {
          const t = (p && p[3]) || "Unknown";
          counts[t] = (counts[t] || 0) + 1;
        });

        const countsLine = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ");
        const hotspotLines = top
          .map((p, i) => {
            const lat = p[0];
            const lng = p[1];
            const intensity = Math.round(p[2] || 0);
            const type = p[3] || "Unknown";
            const name = p[4] || "";
            return `${i + 1}. ${lat.toFixed(4)},${lng.toFixed(4)} — intensity ${intensity} — ${type}${name ? ` — ${name}` : ""}`;
          })
          .join("\n");

        const prompt = `You are an assistant that summarizes disaster heatmap data for emergency managers.\n\nCounts by type: ${countsLine}\n\nTop hotspots (by intensity):\n${hotspotLines}\n\nTask: In 100 words, summarize the current situation in general terms for user to understand. Use only the data provided.`;
        const res = await fetchOpenAIResponse(prompt);
        if (res?.ok) {
          setAiResult(res.result);
        } else {
          setAiResult(res?.error || 'Failed to generate AI summary.');
        }
      }
    }
    getData();
  }, [isHistorical, selectedSnapshotDate]);

  const points = isHistorical
    ? historicalRows.map((row) => [row.lat, row.lng, row.intensity, row.type, row.name])
    : livePoints;

  const {
    pieData,
    stackedData,
    topHotspots,
    coOccurrenceData,
    severityPercentiles,
  } = useDisasterStats(points);

  // Compute avgIntensityByType
  const avgIntensityByType = useMemo(() => {
    if (!points.length) return [];
    const sums = {}, counts = {};
    points.forEach(([_, __, intensity, type]) => {
      sums[type] = (sums[type] || 0) + intensity;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(sums).map(([type, sum]) => ({
      type,
      averageIntensity: sum / counts[type],
    }));
  }, [points]);

    const top5HistoricalAndLive = useMemo(
    () => computeTop5HistoricalAndLive(historicalForLive, livePoints),
    [historicalForLive, livePoints]
  );

  useEffect(() => {
    async function computeContinentStats() {
      if (!points.length) {
        setContinentCounts({});
        setImpactByContinent([]);
        return;
      }
      const continents = await Promise.all(points.map(async ([lat, lng]) => {
        const c = await getContinentFromCoordinates(lat, lng);
        return c || "Unknown";
      }));
      const counts = {};
      const intensitySums = {};
      continents.forEach((continent, i) => {
        counts[continent] = (counts[continent] || 0) + 1;
        intensitySums[continent] = (intensitySums[continent] || 0) + (points[i][2] || 0);
      });
      setContinentCounts(counts);
      setImpactByContinent(Object.entries(counts).map(([continent, count]) => ({
        continent,
        totalIntensity: intensitySums[continent],
        averageIntensity: count ? intensitySums[continent] / count : 0,
      })));
    }
    computeContinentStats();
  }, [points]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FF4', '#FF6699', '#33CC33', '#FF9933'];

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-8 font-sans overflow-auto">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link to="/" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Landing</Link>
          <Link to="/home" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Home</Link>
          <Link to="/breakingposts" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Breaking Posts</Link>
          <Link to="/firstresponders" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">First Responders</Link>
          <Link to="/faq" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">FAQ</Link>
          <Link to="/statistics" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Statistics</Link>
        </nav>
      </header>

      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-4">Statistics</h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
          Welcome to the Statistics page! Here, you can find detailed insights and data visualizations related to various disasters tracked by our platform. Explore trends, impact assessments, and more to stay informed and prepared.
        </p>
        <button
          onClick={toggleDataSource}
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          {isHistorical ? "Switch to Live Data" : "Switch to Historical Data"}
        </button>
        {isHistorical && (
          <div className="mt-4">
            <label htmlFor="snapshotDate" className="text-white mr-2 font-semibold">
              Select Snapshot Date:
            </label>
            <input
              id="snapshotDate"
              type="date"
              value={selectedSnapshotDate}
              onChange={(e) => setSelectedSnapshotDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="px-2 py-1 rounded"
            />
          </div>
        )}
      </div>

      <div className="flex-1 w-full max-w-6xl px-8 pb-16 flex gap-6 min-h-[500px] flex-wrap overflow-auto">
        {!isHistorical && (
          <div className="w-full bg-white rounded-lg shadow px-3 py-2 mb-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Statistics Summary</h2>
            <div className="flex justify-center">
              <ReactMarkdown>{aiResult || "Loading summary..."}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex-grow bg-white rounded-lg shadow px-3 py-2 mb-4 flex flex-col items-center overflow-auto">
          {!isHistorical && top5HistoricalAndLive.length > 0 && (
            <div className="w-full bg-white rounded-lg shadow px-3 py-2 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Top 5 Most Affected Locations (All Historical + Live)
              </h2>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">Location</th>
                    <th className="border border-gray-300 px-3 py-2">Total Intensity</th>
                    <th className="border border-gray-300 px-3 py-2">Event Count</th>
                  </tr>
                </thead>
                <tbody>
                  {top5HistoricalAndLive.map((loc) => (
                    <tr key={loc.locationKey}>
                      <td className="border border-gray-300 px-3 py-2">{loc.name}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {loc.totalIntensity.toFixed(0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {loc.eventCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isHistorical ? (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Disaster Type Distribution</h2>
              {pieData.length ? (
                <PieChart width={400} height={400}>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <p className="text-gray-600 mt-20">No disaster type data to display.</p>
              )}

              <h2 className="text-2xl font-bold my-6 text-center">Disaster Intensity Ranges</h2>
              {stackedData.length ? (
                <BarChart width={700} height={400} data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar stackId="a" dataKey="Low" fill="#0088FE" />
                  <Bar stackId="a" dataKey="Medium" fill="#00C49F" />
                  <Bar stackId="a" dataKey="High" fill="#FFBB28" />
                  <Bar stackId="a" dataKey="Unknown" fill="#FF8042" />
                </BarChart>
              ) : (
                <p className="text-gray-600 mt-10">No intensity data to display.</p>
              )}

              <h2 className="text-2xl font-bold my-6 text-center">Average Intensity by Disaster Type</h2>
              {avgIntensityByType.length ? (
                <BarChart width={700} height={300} data={avgIntensityByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageIntensity" fill="#8884d8" />
                </BarChart>
              ) : (
                <p className="text-gray-600 text-center">Loading average intensity data...</p>
              )}

              {/* Disaster Impact by Continent Table */}
              <h2 className="text-2xl font-bold my-6 text-center">Disaster Impact by Continent</h2>
              {impactByContinent.length ? (
                <table className="w-full text-left border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2">Continent</th>
                      <th className="border border-gray-300 px-3 py-2">Total Intensity</th>
                      <th className="border border-gray-300 px-3 py-2">Average Intensity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impactByContinent.map(({ continent, totalIntensity, averageIntensity }) => (
                      <tr key={continent}>
                        <td className="border border-gray-300 px-3 py-2">{continent}</td>
                        <td className="border border-gray-300 px-3 py-2">{totalIntensity.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2">{averageIntensity.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">Loading continent impact data...</p>
              )}

              <h2 className="text-xl font-bold mb-4 text-center">Distribution by Continent</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Continent</th>
                    <th className="px-3 py-2">Disaster Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(continentCounts).map(([continent, count]) => (
                    <tr key={continent}>
                      <td className="px-3 py-2">{continent}</td>
                      <td className="px-3 py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Co-occurrence Matrix Table */}
              <h2 className="text-2xl font-bold my-6 text-center">Disaster Type Co-occurrence</h2>
              {coOccurrenceData.length ? (
                <table className="w-full text-left border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2">Disaster Type 1</th>
                      <th className="border border-gray-300 px-3 py-2">Disaster Type 2</th>
                      <th className="border border-gray-300 px-3 py-2">Co-occurrence Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coOccurrenceData.map(({ type1, type2, count }, idx) => (
                      <tr key={`${type1}-${type2}-${idx}`}>
                        <td className="border border-gray-300 px-3 py-2">{type1}</td>
                        <td className="border border-gray-300 px-3 py-2">{type2}</td>
                        <td className="border border-gray-300 px-3 py-2">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">Loading co-occurrence data...</p>
              )}

              {/* Severity Percentiles */}
              <h2 className="text-2xl font-bold my-6 text-center">Severity Distribution Percentiles</h2>
              {severityPercentiles.p50 !== undefined ? (
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="bg-gray-100 rounded p-3">25th Percentile: {severityPercentiles.p25.toFixed(2)}</div>
                  <div className="bg-gray-100 rounded p-3">Median (50th): {severityPercentiles.p50.toFixed(2)}</div>
                  <div className="bg-gray-100 rounded p-3">75th Percentile: {severityPercentiles.p75.toFixed(2)}</div>
                </div>
              ) : (
                <p className="text-gray-600 text-center">Loading severity percentiles...</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Disaster Type Distribution</h2>
              {pieData.length ? (
                <PieChart width={400} height={400}>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <p className="text-gray-600 mt-20">No disaster type data to display.</p>
              )}

              <h2 className="text-2xl font-bold my-6 text-center">Disaster Intensity Ranges</h2>
              {stackedData.length ? (
                <BarChart width={700} height={400} data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar stackId="a" dataKey="Low" fill="#0088FE" />
                  <Bar stackId="a" dataKey="Medium" fill="#00C49F" />
                  <Bar stackId="a" dataKey="High" fill="#FFBB28" />
                  <Bar stackId="a" dataKey="Unknown" fill="#FF8042" />
                </BarChart>
              ) : (
                <p className="text-gray-600 mt-10">No intensity data to display.</p>
              )}

              <h2 className="text-2xl font-bold my-6 text-center">Average Intensity by Disaster Type</h2>
              {avgIntensityByType.length ? (
                <BarChart width={700} height={300} data={avgIntensityByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageIntensity" fill="#8884d8" />
                </BarChart>
              ) : (
                <p className="text-gray-600 text-center">Loading average intensity data...</p>
              )}

              {/* Disaster Impact by Continent Table */}
              <h2 className="text-2xl font-bold my-6 text-center">Disaster Impact by Continent</h2>
              {impactByContinent.length > 0 ? (
                <table className="w-full text-left border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2">Continent</th>
                      <th className="border border-gray-300 px-3 py-2">Total Intensity</th>
                      <th className="border border-gray-300 px-3 py-2">Average Intensity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impactByContinent.map(({ continent, totalIntensity, averageIntensity }) => (
                      <tr key={continent}>
                        <td className="border border-gray-300 px-3 py-2">{continent}</td>
                        <td className="border border-gray-300 px-3 py-2">{totalIntensity.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2">{averageIntensity.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">Loading continent impact data...</p>
              )}


              <h2 className="text-xl font-bold mb-4 text-center">Distribution by Continent</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Continent</th>
                    <th className="px-3 py-2">Disaster Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(continentCounts).map(([continent, count]) => (
                    <tr key={continent}>
                      <td className="px-3 py-2">{continent}</td>
                      <td className="px-3 py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Co-occurrence Matrix Table */}
              <h2 className="text-2xl font-bold my-6 text-center">Disaster Type Co-occurrence</h2>
              {coOccurrenceData.length ? (
                <table className="w-full text-left border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2">Disaster Type 1</th>
                      <th className="border border-gray-300 px-3 py-2">Disaster Type 2</th>
                      <th className="border border-gray-300 px-3 py-2">Co-occurrence Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coOccurrenceData.map(({ type1, type2, count }, idx) => (
                      <tr key={`${type1}-${type2}-${idx}`}>
                        <td className="border border-gray-300 px-3 py-2">{type1}</td>
                        <td className="border border-gray-300 px-3 py-2">{type2}</td>
                        <td className="border border-gray-300 px-3 py-2">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">Loading co-occurrence data...</p>
              )}

              <h2 className="text-2xl font-bold my-6 text-center">Severity Distribution Percentiles</h2>
              {severityPercentiles.p50 !== undefined ? (
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="bg-gray-100 rounded p-3">25th Percentile: {severityPercentiles.p25.toFixed(2)}</div>
                  <div className="bg-gray-100 rounded p-3">Median (50th): {severityPercentiles.p50.toFixed(2)}</div>
                  <div className="bg-gray-100 rounded p-3">75th Percentile: {severityPercentiles.p75.toFixed(2)}</div>
                </div>
              ) : (
                <p className="text-gray-600 text-center">Loading severity percentiles...</p>
              )}
            </>
          )}
          <TopIntensityTable points={points} isHistorical={isHistorical} />
        </div>
      </div>
    </div>
  );
}
