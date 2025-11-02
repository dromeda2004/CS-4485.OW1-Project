import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Searchbar from "../components/Searchbar";
import BreakingPostList from "../components/BreakingPostList";
//import { fetchAddressPoints } from "../api/addressPointsApi";
import { fetchBreakingPosts } from "../api/addressPointsApi";

export default function DisasterTracker() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
 useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchBreakingPosts();

        if (!data) {
          console.warn("No data returned from API");
          return;
        }

        // Handle both possible structures
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
    const matchesFilter = filter === "All" || normalizedCategory === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link
            to="/"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            Landing
          </Link>
          <Link
            to="/home"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            to="/breakingposts"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            Breaking Posts
          </Link>
          <Link
            to="/firstresponders"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            First Responders
          </Link>
          <Link
            to="/faq"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            FAQ
          </Link>
          <Link
            to="/statistics"
            className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            Statistics
          </Link>
        </nav>
      </header>

      {/* Search bar */}
      <Searchbar search={search} setSearch={setSearch} />

      {/* Filter dropdown */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 px-4 py-2 rounded-lg"
      >
        <option>All</option>
        <option>Storm</option>
        <option>Tornado</option>
        <option>Flood</option>
        <option>Tsunamis</option>
        <option>Earthquake</option>
        <option>Wildfires</option>

      </select>

      {/* Updated posts */}
      <BreakingPostList posts={filteredPosts} />
    </div>
  );
}
