import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOpenAIResponse } from "../api/fetchKey";
import { fetchAddressPoints, getContinentFromCoordinates } from "../api/addressPointsApi";
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

export default function Stats() {
  const [isHistorical, setIsHistorical] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [pieData, setPieData] = useState([]);
  const [stackedData, setStackedData] = useState([]);
  const [continentCounts, setContinentCounts] = useState({});
  const [avgIntensityByType, setAvgIntensityByType] = useState([]);
  const [impactByContinent, setImpactByContinent] = useState([]);
  const [topHotspots, setTopHotspots] = useState([]);
  const [coOccurrenceData, setCoOccurrenceData] = useState([]);
  const [severityPercentiles, setSeverityPercentiles] = useState({});

  function classifyDisasterType(type) {
    if (!type) return 'Unknown';
    const t = String(type).toLowerCase();
    if (t.includes('wildfire')) return 'Wildfires';
    if (t.includes('earthquake')) return 'Earthquakes';
    if (t.includes('tsunami')) return 'Tsunamis';
    if (t.includes('flood')) return 'Floods';
    if (t.includes('tornado')) return 'Tornadoes';
    if (t.includes('storm') || t.includes('cyclone') || t.includes('typhoon') || t.includes('hurricane')) return 'Storms';
    return 'Other';
  }

  function classifyIntensity(weight) {
    if (weight == null) return 'Unknown';
    if (weight < 1000) return 'Low';
    if (weight < 10000) return 'Medium';
    return 'High';
  }

  function toggleDataSource() {
    setIsHistorical(prev => !prev);
  }

  useEffect(() => {
    async function getData() {
      if(isHistorical){

      }else{   
      const { points } = await fetchAddressPoints();

      const top = (points || []).slice().sort((a, b) => (b[2] || 0) - (a[2] || 0)).slice(0, 12);

      const counts = {};
      (points || []).forEach((p) => {
        const t = (p && p[3]) || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
      });
      const countsLine = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ');

      const hotspotLines = top.map((p, i) => {
        const lat = p[0];
        const lng = p[1];
        const intensity = Math.round(p[2] || 0);
        const type = p[3] || 'Unknown';
        const name = p[4] || '';
        return `${i + 1}. ${lat.toFixed(4)},${lng.toFixed(4)} — intensity ${intensity} — ${type}${name ? ` — ${name}` : ''}`;
      }).join('\n');

      const prompt = `You are an assistant that summarizes disaster heatmap data for emergency managers.\n\nCounts by type: ${countsLine}\n\nTop hotspots (by intensity):\n${hotspotLines}\n\nTask: In 100 words, summarize the current situation . Use only the data provided.`;

      const result = await fetchOpenAIResponse(prompt);
      if (result) setAiResult(result);

      // Pie data
      const categorizedCounts = {};
      points.forEach((p) => {
        const category = classifyDisasterType(p[3]);
        categorizedCounts[category] = (categorizedCounts[category] || 0) + 1;
      });
      const pieDataArray = Object.entries(categorizedCounts).map(([name, value]) => ({ name, value }));
      setPieData(pieDataArray);

      const dataMap = {};
      points.forEach(p => {
        const category = classifyDisasterType(p[3]);
        const intensity = classifyIntensity(p[2]);
        if (!dataMap[category]) {
          dataMap[category] = { name: category, Low: 0, Medium: 0, High: 0, Unknown: 0 };
        }
        dataMap[category][intensity] = (dataMap[category][intensity] || 0) + 1;
      });
      setStackedData(Object.values(dataMap));

      // Continents
      const getContinents = points.map(async (p) => {
        const lat = p[0];
        const lng = p[1];
        const continent = await getContinentFromCoordinates(lat, lng);
        return continent || 'Unknown';
      });
      const continents = await Promise.all(getContinents);
      const counter = {};
      continents.forEach((cont) => {
        counter[cont] = (counter[cont] || 0) + 1;
      });
      setContinentCounts(counter);

      // Average Intensity by Type
      const intensitySumsByType = {};
      const countsByType = {};
      points.forEach((p) => {
        const type = classifyDisasterType(p[3]);
        const intensity = p[2] || 0;
        intensitySumsByType[type] = (intensitySumsByType[type] || 0) + intensity;
        countsByType[type] = (countsByType[type] || 0) + 1;
      });
      const avgIntensityData = Object.entries(intensitySumsByType).map(([type, total]) => ({
        type,
        averageIntensity: total / countsByType[type],
      }));
      setAvgIntensityByType(avgIntensityData);

      // Impact by Continent
      const intensitySumsByContinent = {};
      const countsByContinent = {};
      points.forEach((p, i) => {
        const continent = continents[i] || 'Unknown';
        const intensity = p[2] || 0;
        intensitySumsByContinent[continent] = (intensitySumsByContinent[continent] || 0) + intensity;
        countsByContinent[continent] = (countsByContinent[continent] || 0) + 1;
      });
      const impactByContinentData = Object.entries(intensitySumsByContinent).map(([continent, totalIntensity]) => ({
        continent,
        totalIntensity,
        averageIntensity: totalIntensity / countsByContinent[continent],
      }));
      setImpactByContinent(impactByContinentData);

      // Top Hotspots
      const locationMap = {};
      points.forEach(p => {
        const lat = p[0];
        const lng = p[1];
        const intensity = p[2] || 0;
        const name = p[4] || `${lat.toFixed(3)},${lng.toFixed(3)}`;

        if (!locationMap[name]) {
          locationMap[name] = { count: 0, totalIntensity: 0 };
        }
        locationMap[name].count += 1;
        locationMap[name].totalIntensity += intensity;
      });
      const hotspots = Object.entries(locationMap)
        .map(([location, stats]) => ({
          location,
          count: stats.count,
          totalIntensity: stats.totalIntensity,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      setTopHotspots(hotspots);

      // --- Disaster Type Co-occurrence Begins ---
      const disasterTypes = Array.from(new Set(points.map(p => classifyDisasterType(p[3]))));
      const coOccurrenceMatrix = {};
      disasterTypes.forEach(type => {
        coOccurrenceMatrix[type] = {};
        disasterTypes.forEach(t2 => coOccurrenceMatrix[type][t2] = 0);
      });
      const proximityThreshold = 0.1; // degrees
      points.forEach((p1, i) => {
        const type1 = classifyDisasterType(p1[3]);
        const lat1 = p1[0], lng1 = p1[1];
        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const type2 = classifyDisasterType(p2[3]);
          const lat2 = p2[0], lng2 = p2[1];
          const dist = Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
          if (dist < proximityThreshold) {
            coOccurrenceMatrix[type1][type2]++;
            coOccurrenceMatrix[type2][type1]++;
          }
        }
      });
      // Flatten for display
      const coOccurrenceList = [];
      disasterTypes.forEach(type1 => {
        disasterTypes.forEach(type2 => {
          if (type1 <= type2) {
            coOccurrenceList.push({ type1, type2, count: coOccurrenceMatrix[type1][type2] });
          }
        });
      });
      setCoOccurrenceData(coOccurrenceList);

      // --- Severity Percentiles ---
      const intensities = points.map(p => p[2] || 0).sort((a, b) => a - b);
      function percentile(arr, p) {
        const idx = Math.floor(p * arr.length);
        return arr[idx] || 0;
      }
      setSeverityPercentiles({
        p25: percentile(intensities, 0.25),
        p50: percentile(intensities, 0.50),
        p75: percentile(intensities, 0.75),
      });

    }
  }
    getData();
  }, [isHistorical]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FF4'];

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-8 font-sans overflow-auto">
      {/* Header and Navigation (same as before) */}
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
      </div>

      <div className="flex-1 w-full max-w-6xl px-8 pb-16 flex gap-6 min-h-[500px] flex-wrap overflow-auto">
        {/* Left: AI Summary */}
        <div className="w-[400px] bg-white rounded-lg shadow px-3 py-2 mb-4">
          <h2 className="text-2xl font-bold mb-4 text-center">Statistics Summary</h2>
          <ReactMarkdown>{aiResult || "Loading summary..."}</ReactMarkdown>
        </div>

        <div className="flex-grow bg-white rounded-lg shadow px-3 py-2 mb-4 flex flex-col items-center overflow-auto">
          {/* Charts and tables omitted - previous ones go here unchanged */}
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
          <h2 className="text-2xl font-bold my-6 text-center">Top Disaster Hotspots</h2>
          {topHotspots.length ? (
            <table className="w-full text-left border-collapse border border-gray-300 mb-6">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-3 py-2">Location</th>
                  <th className="border border-gray-300 px-3 py-2">Disaster Count</th>
                  <th className="border border-gray-300 px-3 py-2">Total Intensity</th>
                </tr>
              </thead>
              <tbody>
                {topHotspots.map(({ location, count, totalIntensity }) => (
                  <tr key={location}>
                    <td className="border border-gray-300 px-3 py-2">{location}</td>
                    <td className="border border-gray-300 px-3 py-2">{count}</td>
                    <td className="border border-gray-300 px-3 py-2">{totalIntensity.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-center">Loading hotspots...</p>
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
          {/* Add Co-occurrence Matrix Table */}
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
        </div>
      </div>
    </div>
  );
}
