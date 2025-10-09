import React from 'react'

function BreakingPostCard({ user, time, text, reposts, likes, score }) {
  // 🔹 Color intensity by score
  const severityColor =
    score >= 4 ? "border-red-500 bg-red-50" :
    score === 3 ? "border-orange-400 bg-orange-50" :
    score === 2 ? "border-yellow-400 bg-yellow-50" :
    "border-green-400 bg-green-50";

  // 🔹 Severity label
  const severityLabel =
    score >= 4 ? "Severe" :
    score === 3 ? "High" :
    score === 2 ? "Moderate" :
    "Low";

  return (
    <div className={`border rounded-lg p-4 flex gap-3 items-start ${severityColor}`}>
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

        {/* 🔹 Severity Indicator */}
        {score && (
          <div
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              score >= 4
                ? "bg-red-200 text-red-800"
                : score === 3
                ? "bg-orange-200 text-orange-800"
                : score === 2
                ? "bg-yellow-200 text-yellow-800"
                : "bg-green-200 text-green-800"
            }`}
          >
            {severityLabel} ({score})
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Reposts: {reposts}, Likes: {likes}
        </div>
      </div>
    </div>
  );
}

export default BreakingPostCard;
