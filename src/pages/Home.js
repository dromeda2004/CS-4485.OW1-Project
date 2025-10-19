import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { addressPoints as staticAddressPoints } from "../addressPoints";
import { fetchAddressPoints } from "../api/addressPointsApi";
import "leaflet.heat";
import HeatmapLayer from "../components/HeatmapLayer";
import { Link } from "react-router-dom";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [points, setPoints] = useState(staticAddressPoints);
  const [source, setSource] = useState('static');
  const [loadingPoints, setLoadingPoints] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingPoints(true);
    fetchAddressPoints()
      .then(({ points: pnts, source: src }) => {
        if (!mounted) return;
        setPoints(pnts);
        setSource(src);
      })
      .catch((err) => {
        console.error('fetchAddressPoints failed', err);
      })
      .finally(() => mounted && setLoadingPoints(false));

    return () => { mounted = false; };
  }, []);

  const posts = [
    {
      user: "User1",
      time: "2h",
      text: "Massive flood in India displaces thousands of people.",
      hashtag: "#IndiaFlood",
      category: "Floods and Typhoons",
    },
    {
      user: "User2",
      time: "5h",
      text: "Tropical cyclone causes severe damage in Philippines.",
      hashtag: "#Typhoon",
      category: "Floods and Typhoons",
    },
    {
      user: "User3",
      time: "1d",
      text: "Strong earthquake hits California, shaking buildings.",
      hashtag: "#Earthquake",
      category: "Earthquakes",
    },
    {
      user: "User4",
      time: "3d",
      text: "Wildfires spread rapidly in Australia causing evacuations.",
      hashtag: "#Wildfire",
      category: "Wildfires",
    },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtag.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || post.category === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link to="/" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Landing</Link>
          <Link to="/home" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Home</Link>
          <Link to="/breakingposts" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Breaking Posts</Link>
          <Link to="/firstresponders" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">First Responders</Link>
          <Link to="/faq" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">FAQ</Link>
        </nav>
      </header>

      <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 w-[400px] mb-4">
        <input
          type="text"
          placeholder="Search hashtags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-gray-700"
        />
        <span className="text-gray-500 text-lg ml-2">🔍</span>
      </div>

      <div className="text-white mb-4 flex gap-2 items-center">
        <span>Filter by disaster:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 rounded-md text-gray-700"
        >
          <option>All</option>
          <option>Floods and Typhoons</option>
          <option>Earthquakes</option>
          <option>Wildfires</option>
          <option>Hurricanes</option>
        </select>
      </div>

      <div className="flex gap-6 w-full items-start">
        <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center w-full">
          {/* larger map: use 90vh or calc to account for header/controls */}
          <div className="w-full h-[90vh] md:h-[80vh] rounded-lg overflow-hidden">
            <MapContainer center={[32.7767, -96.7970]} zoom={5} className="w-full h-full">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              />
              <HeatmapLayer
                points={points.map((p) => [p[0], p[1], Number(p[2]) || 1])}
                options={{
                  radius: 30,
                  blur: 20,
                  maxZoom: 17,
                  gradient: { 0.2: "#fcde46", 0.4: "#f6b840", 0.6: "#eb7f35", 0.8: "#e4572e", 1.0: "#dc2726" },
                }}
              />

              {/*
                Overlay small interactive CircleMarkers (transparent) so we can show a Tooltip on hover.
                Adjust radius/pathOptions as needed. Assumes addressPoints entries: [lat, lng, weight, info?]
              */}
              {points.map((p, idx) => {
                const lat = p[0];
                const lng = p[1];
                const weight = Number(p[2]) || 1;
                const info = `Intensity: ${weight}`;
                // radius scaled from weight so larger signatures get larger hover target
                const radius = Math.min(30, Math.max(6, weight * 4));
                return (
                  <CircleMarker
                    key={`hover-${idx}`}
                    center={[lat, lng]}
                    radius={radius}
                    // make marker mostly invisible but still interactive
                    pathOptions={{ color: "#ffffff00", fillColor: "#ffffff00", weight: 1, fillOpacity: 0.01 }}
                    eventHandlers={{
                      // optional: additional handlers for click, etc.
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -radius - 6]} opacity={0.95} sticky>
                      <div style={{ color: "#000" }}>
                        <strong>Location</strong><br />
                        {lat.toFixed(4)}, {lng.toFixed(4)}<br />
                        <small>{info}</small>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div className="mt-4 flex items-center gap-4 w-full">
            <span className="font-bold text-black text-lg">Heatmap</span>
            <div className="flex-1 h-[27px] rounded-[5px] bg-gradient-to-r from-yellow-300 to-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}