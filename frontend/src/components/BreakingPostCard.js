import React from 'react'

function BreakingPostCard({ user, time, text, reposts, likes }) {
  return (
    <div className="border rounded-lg p-4 flex gap-3 items-start">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
        <span className="text-blue-700 font-bold">{user[0]}</span>
      </div>

      {/* Post content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">{user}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-700 mb-2">{text}</p>
        <div className="text-xs text-gray-500">
          Reposts: {reposts}, Likes: {likes}
        </div>
      </div>
    </div>
  );
}

export default BreakingPostCard