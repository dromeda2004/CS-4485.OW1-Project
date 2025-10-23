import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Searchbar from "../components/Searchbar";
import BreakingPostList from "../components/BreakingPostList";
import { fetchAddressPoints } from "../api/addressPointsApi";

export default function DisasterTracker() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPosts() {
      try {
        const { points, source } = await fetchAddressPoints();
        // Map API response into BreakingPostCard-friendly objects
        const mappedPosts = points.map((p, i) => ({
          id: i,
          user: "LiveUser",
          time: new Date().toISOString(),
          text: `Disaster reported at ${p[4] ?? "unknown location"}`,
          hashtag: `#${p[3] ?? "Disaster"}`,
          category: p[3] ?? "Unknown",
          reposts: 0,
          likes: p[2] ?? 1,
          location: p[4] ?? "Unknown",
          score: Math.ceil((p[2] ?? 1) / 25), // map weight -> severity 1-4
          updated_at: new Date().toISOString(),
          nearby_records: [],
        }));
        setPosts(mappedPosts);
      } catch (err) {
        console.error("Failed to load live posts", err);
      }
    }
    loadPosts();
  }, []);
  // 🔹 Filtering logic
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
        <option>Floods and Typhoons</option>
        <option>Wildfires</option>
        <option>Hurricane</option>
      </select>

      {/* Updated posts */}
      <BreakingPostList posts={filteredPosts} />
    </div>
  );
}
