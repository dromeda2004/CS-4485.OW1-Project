import React, { useState } from "react";
import heatmap from "./assets/mapplaceholder.png";

export default function DisasterTracker() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Example posts data
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

  // Filtering logic
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtag.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || post.category === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      {/* Title */}
      <h1 className="text-white font-bold text-3xl mb-6">DISASTER TRACKER</h1>

      {/* Search */}
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

      {/* Filter */}
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

      {/* Main content */}
      <div className="flex gap-6 w-full max-w-6xl">
        {/* Heatmap */}
        <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <div className="w-full h-[400px] rounded-lg overflow-hidden">
            {/* Placeholder heatmap image */}
            {<img
              src= {heatmap}
              alt="Heatmap"
              className="object-cover w-full h-full"
            />}
          </div>
      <div className="absolute top-[659px] left-[200px] w-[132px] font-inner font-[number:var(--inner-font-weight)] text-black text-[length:var(--inner-font-size)] tracking-[var(--inner-letter-spacing)] leading-[var(--inner-line-height)] [font-style:var(--inner-font-style)]">
        Heatmap
      </div>
        <div className="absolute top-[659px] left-[450px] w-[472px] h-[27px] rounded-[5px] bg-[linear-gradient(90deg,rgba(251,232,115,1)_0%,rgba(230,55,76,1)_100%)]" />

        </div>
        {/* Breaking Posts */}
        <div className="w-[300px] bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="font-bold text-lg text-gray-800 mb-3">Breaking Posts</h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 shadow-sm bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">
                      {post.user}
                    </span>
                    <span className="text-sm text-gray-500">{post.time}</span>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {post.text}{" "}
                    <span className="text-blue-600 font-medium">
                      {post.hashtag}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No posts found.</p>
            )}
          </div>
          <button className="mt-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium text-gray-700">
            See All
          </button>
        </div>
      </div>
    </div>
  );
}
