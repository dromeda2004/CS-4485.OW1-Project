import React, { useState, useMemo } from "react";
import BreakingPostCard from "./BreakingPostCard";

function BreakingPostList({ posts, userLocation }) {
  const [sortMode, setSortMode] = useState("recent"); // "recent" | "popular" | "score" | "score_recent" | "nearest"

  // 🔹 Haversine distance function
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if ([lat1, lon1, lat2, lon2].some(v => v == null)) return Infinity;
    const R = 6371; // Earth radius (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 🔹 Memoized sorting
  const sortedPosts = useMemo(() => {
    const arr = [...posts];

    if (sortMode === "popular") {
      return arr.sort((a, b) => b.likes - a.likes);
    } else if (sortMode === "score") {
      return arr.sort((a, b) => b.score - a.score);
    } else if (sortMode === "score_recent") {
      return arr.sort((a, b) => {
        const weightA = a.score + new Date(a.time).getTime() / 1e10;
        const weightB = b.score + new Date(b.time).getTime() / 1e10;
        return weightB - weightA;
      });
    } else if (sortMode === "nearest" && userLocation) {
  return arr.sort((a, b) => {
    const dist = (p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      if (isNaN(lat) || isNaN(lng)) return Infinity;
      return calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
    };
    return dist(a) - dist(b);
  });
}
 else {
      return arr.sort((a, b) => new Date(b.time) - new Date(a.time)); // recent
    }
  }, [posts, sortMode, userLocation]);

  // 🔹 Toggle label
  const toggleLabelMap = {
    recent: "Recent ▼",
    score_recent: "Severity + Recent ▼",
    popular: "Popular ▼",
    score: "Severity ▼",
    nearest: "Nearest ▼",
  };
  const toggleLabel = toggleLabelMap[sortMode];

  // 🔹 Cycle through sorting modes
  const handleToggle = () => {
    if (sortMode === "recent") setSortMode("score_recent");
    else if (sortMode === "score_recent") setSortMode("popular");
    else if (sortMode === "popular") setSortMode("score");
    else if (sortMode === "score") setSortMode("nearest");
    else setSortMode("recent");
  };

  return (
    <div className="bg-white w-full max-w-6xl rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Breaking Posts</h2>
        <button
          onClick={handleToggle}
          className="text-sm text-gray-600 hover:text-gray-800 transition"
        >
          {toggleLabel}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 justify-between">
        {sortedPosts.map((post) => (
          <div key={post.id} className="w-[48%]">
            <BreakingPostCard {...post} />
          </div>
        ))}
      </div>

      <button className="w-full text-center text-sm text-blue-600 mt-4 py-2 hover:underline">
        See All
      </button>
    </div>
  );
}

export default BreakingPostList;
