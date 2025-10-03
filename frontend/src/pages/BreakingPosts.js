import { useState } from "react";
import Searchbar from "../components/Searchbar";
import BreakingPostList from "../components/BreakingPostList";

export default function DisasterTracker() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const posts = [
    {
      id: 1,
      user: "User1",
      time: "2h",
      text: "Massive flood in India displaces thousands of people.",
      hashtag: "#IndiaFlood",
      category: "Floods and Typhoons",
      reposts: 2,
      likes: 30,
    },
    {
      id: 2,
      user: "User2",
      time: "5h",
      text: "Tropical cyclone causes severe damage in Philippines.",
      hashtag: "#Typhoon",
      category: "Floods and Typhoons",
      reposts: 1,
      likes: 3,
    },
    {
      id: 3,
      user: "User3",
      time: "1d",
      text: "Wildfires spreading in California hills.",
      hashtag: "#Wildfire",
      category: "Wildfires",
      reposts: 5,
      likes: 20,
    },
  ];

  // 🔹 Filtering logic goes here
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtag.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || post.category === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <h1 className="text-white font-bold text-3xl mb-6">DISASTER TRACKER</h1>

      {/* Search bar (controlled via state) */}
      <Searchbar search={search} setSearch={setSearch} />

      {/* Dropdown filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 px-4 py-2 rounded-lg"
      >
        <option>All</option>
        <option>Floods and Typhoons</option>
        <option>Wildfires</option>
      </select>

      {/* Pass filtered posts to the list */}
      <BreakingPostList posts={filteredPosts} />
    </div>
  );
}
