import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOpenAIResponse } from "../api/fetchKey";
import { fetchAddressPoints, getContinentFromCoordinates } from "../api/addressPointsApi";
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';


export default function Stats() {

  const [aiResult, setAiResult] = useState('');
  const [pieData, setPieData] = useState([]);
  const [stackedData, setStackedData] = useState([]);
  const [continentCounts, setContinentCounts] = useState({});

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

  useEffect(() => {
    async function getData() {
      
      // Fetch live heatmap points and build an aggregated prompt for the LLM
      const { points } = await fetchAddressPoints();
      // points are arrays: [lat, lng, weight, disasterType, name?]
      const top = (points || []).slice().sort((a, b) => (b[2] || 0) - (a[2] || 0)).slice(0, 12);

      // counts by disaster type
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
    }
    getData();
  }, []);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FF4'];

  
  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-8 font-sans">
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
      </div>

      <div className="flex-1 w-full max-w-6xl px-8 pb-16 flex gap-6 min-h-[500px]">
        {/* Left: AI Summary */}
        <div className="w-[400px] bg-white rounded-lg shadow px-3 py-2 mb-4">
          <h2 className="text-2xl font-bold mb-4 text-center">Statistics Summary</h2>
          <ReactMarkdown>{aiResult || "Loading summary..."}</ReactMarkdown>
        </div>

        {/* Right: Pie chart for disaster type & stacked bar chart for intensity */}
        <div className="flex-grow bg-white rounded-lg shadow px-3 py-2 mb-4 flex flex-col items-center">
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
        </div>
      </div>
    </div>
  );
}