import React from 'react'
import BreakingPostCard from './BreakingPostCard';

function BreakingPostList({ posts }) {
  return (
    <div className="bg-white w-full max-w-2xl rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Breaking Posts</h2>
        <button className="text-sm text-gray-500">Recent ▼</button>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <BreakingPostCard key={post.id} {...post} />
        ))}
      </div>

      <button className="w-full text-center text-sm text-blue-600 mt-4 py-2 hover:underline">
        See All
      </button>
    </div>
  );
}

export default BreakingPostList
