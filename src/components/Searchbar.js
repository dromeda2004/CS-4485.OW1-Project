import React from 'react'

function Searchbar({ search, setSearch }) {
  return (
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
  );
}


export default Searchbar