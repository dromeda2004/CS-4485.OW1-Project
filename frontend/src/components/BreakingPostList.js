import React, { useState } from "react";
import BreakingPostCard from "./BreakingPostCard";

function BreakingPostList({ posts }) {
  const [sortMode, setSortMode] = useState("recent"); // "recent" or "popular"

  // 🔹 Sort logic
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortMode === "popular") {
      return b.likes - a.likes; // sort by likes descending
    } else {
      // parse times safely (YYYY-MM-DD HH:MM)
      return new Date(b.time) - new Date(a.time);
    }
  });

  // 🔹 Toggle label
  const toggleLabel = sortMode === "recent" ? "Recent ▼" : "Popular ▼";

  // 🔹 Handle sort change
  const handleToggle = () => {
    setSortMode(sortMode === "recent" ? "popular" : "recent");
  };

  return (
    <div className="bg-white w-full max-w-2xl rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Breaking Posts</h2>
        <button
          onClick={handleToggle}
          className="text-sm text-gray-600 hover:text-gray-800 transition"
        >
          {toggleLabel}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {sortedPosts.map((post) => (
          <BreakingPostCard key={post.id} {...post} />
        ))}
      </div>

      <button className="w-full text-center text-sm text-blue-600 mt-4 py-2 hover:underline">
        See All
      </button>
    </div>
  );
}

export default BreakingPostList;
