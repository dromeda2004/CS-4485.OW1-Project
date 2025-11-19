import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Searchbar from "../components/Searchbar";
import BreakingPostList from "../components/BreakingPostList";
import { fetchBreakingPosts } from "../api/addressPointsApi";

export default function DisasterTracker() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // 🔹 Fetch disaster posts
  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchBreakingPosts();
        if (!data) {
          console.warn("No data returned from API");
          return;
        }

        const arr = data.breaking_disasters ?? data.posts ?? [];

        const mappedPosts = arr.map((p, i) => ({
          id: i,
          user: p.author || "Unknown",
          time: p.created_at,
          updated_at: p.ingested_at,
          text: p.text,
          hashtag: `#${p.disaster_type ?? "Disaster"}`,
          category: p.disaster_type ?? "Unknown",
          reposts: p.repostCount ?? 0,
          likes: p.likeCount ?? 0,
          location: p.location_name ?? "Unknown",
          lat: isFinite(Number(p.lat)) ? Number(p.lat) : null,
          lng: isFinite(Number(p.lon)) ? Number(p.lon) : null,
          score: Math.ceil(p.score || 1),
          nearby_records: [],
        }));

        setPosts(mappedPosts);
      } catch (err) {
        console.error("Failed to load breaking disasters", err);
      }
    }

    loadPosts();
  }, []);

  // 🔹 Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Location access denied:", err);
          setLocationError(err.message);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    } else {
      setLocationError("Geolocation not supported by this browser.");
    }
  }, []);

  // 🔹 Filtering logic
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtag.toLowerCase().includes(search.toLowerCase());

    const normalizedCategory = (() => {
      const c = post.category.toLowerCase();
      if (["hurricane", "typhoon", "cyclone"].includes(c)) return "storm";
      return c;
    })();

    const matchesFilter =
      filter === "All" || normalizedCategory === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link to="/" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">Landing</Link>
          <Link to="/home" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">Home</Link>
          <Link to="/breakingposts" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">Breaking Posts</Link>
          <Link to="/firstresponders" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">First Responders</Link>
          <Link to="/faq" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">FAQ</Link>
          <Link to="/statistics" className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10">Statistics</Link>
        </nav>
      </header>

              <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Breaking Posts</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Breaking posts about current disasters and emergencies worldwide. Use the filters below to sort by severity, location, or time to stay informed about what matters most.
          </p>
        </div>
      {/* Search bar */}
      <Searchbar search={search} setSearch={setSearch} />

      {/* Filter dropdown */}
      <div className="flex gap-4 mb-6">
  {/* Category Filter */}
  <select
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
    className="px-4 py-2 rounded-lg"
  >
    <option>All</option>
    <option>Storm</option>
    <option>Tornado</option>
    <option>Flood</option>
    <option>Tsunamis</option>
    <option>Earthquake</option>
    <option>Wildfires</option>
  </select>

  {/* Sorting Filter */}
  <select
    value={sortMode}
    onChange={(e) => setSortMode(e.target.value)}
    className="px-4 py-2 rounded-lg"
  >
    <option value="recent">Recent</option>
    <option value="score_recent">Severity + Recent</option>
    <option value="popular">Popular</option>
    <option value="score">Severity</option>
    <option value="nearest" disabled={!userLocation}>
      Nearest
    </option>
  </select>
</div>

      {/* Location status */}
      <div className="text-white text-sm mb-4">
        {userLocation ? (
          <p>
            📍 Location: {userLocation.lat.toFixed(2)},{" "}
            {userLocation.lng.toFixed(2)}
          </p>
        ) : locationError ? (
          <p className="text-red-300">⚠️ {locationError}</p>
        ) : (
          <p>📍 Getting your location...</p>
        )}
      </div>

      {/* Updated posts with location-aware sorting */}
     <BreakingPostList
  posts={filteredPosts}
  userLocation={userLocation}
  sortMode={sortMode}
  setSortMode={setSortMode}
/>

    </div>
  );
}
