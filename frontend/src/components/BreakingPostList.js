import React, { useState } from "react";
import BreakingPostCard from "./BreakingPostCard";

function BreakingPostList({ posts }) {
  const [sortMode, setSortMode] = useState("recent"); // "recent" or "popular"

  // 🔹 Sort logic
const sortedPosts = [...posts].sort((a, b) => {
  if (sortMode === "popular") {
    return b.likes - a.likes; // sort by likes descending
  } else if (sortMode === "score") {
    return b.score - a.score; // sort by severity descending
  } else {
    // sort by most recent time
    return new Date(b.time) - new Date(a.time);
  }
});
// 🔹 Toggle label
let toggleLabel;
if (sortMode === "recent") toggleLabel = "Recent ▼";
else if (sortMode === "popular") toggleLabel = "Popular ▼";
else toggleLabel = "Severity ▼";

// 🔹 Handle sort change (cycles through 3 modes)
const handleToggle = () => {
  if (sortMode === "recent") setSortMode("popular");
  else if (sortMode === "popular") setSortMode("score");
  else setSortMode("recent");
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
