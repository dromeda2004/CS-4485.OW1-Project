import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Searchbar from "../components/Searchbar";
import BreakingPostList from "../components/BreakingPostList";

export default function DisasterTracker() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // 🔹 Mock posts (based on /search-location structure)
  const posts = [
    {
      id: 1,
      user: "User7",
      time: "2025-09-28 21:08",
      text: "Apparently a hurricane has just formed over Atlanta",
      hashtag: "#Hurricane",
      category: "Hurricane",
      reposts: 0,
      likes: 1,
      location: "Atlanta",
      score: 1, // severity indicator
    },
    {
      id: 2,
      user: "User3",
      time: "2025-09-27 10:15",
      text: "Wildfires are spreading fast near Los Angeles.",
      hashtag: "#Wildfire",
      category: "Wildfires",
      reposts: 3,
      likes: 15,
      location: "Los Angeles",
      score: 4,
    },
    {
      id: 3,
      user: "User5",
      time: "2025-09-29 09:20",
      text: "Heavy rainfall causing floods across Mumbai suburbs.",
      hashtag: "#Floods",
      category: "Floods and Typhoons",
      reposts: 2,
      likes: 10,
      location: "Mumbai",
      score: 3,
    },
    {
      id: 4,
      user: "User1",
      time: "2025-09-29 09:20",
      text: "Massive flood in India displaces thousands of people.",
      hashtag: "#IndiaFlood",
      category: "Floods and Typhoons",
      reposts: 2,
      likes: 30,
      score: 3,
    },
    {
      id: 5,
      user: "User2",
      time: "2025-09-20 09:20",
      text: "Tropical cyclone causes severe damage in Philippines.",
      hashtag: "#Typhoon",
      category: "Floods and Typhoons",
      reposts: 1,
      likes: 3,
    },
    {
      id: 6,
      user: "User3",
      time: "2025-09-25 09:20",
      text: "Wildfires spreading in California hills.",
      hashtag: "#Wildfire",
      category: "Wildfires",
      reposts: 5,
      likes: 20,
    },
  ];

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
