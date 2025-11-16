import React from 'react'
function BreakingPostCard({
  user,
  time,
  updated_at,
  text,
  reposts,
  likes,
  score,
  location,
  lat,
  lng,
  nearby_records = [],
}) {
  // 🔹 Background gradient based on severity
const severityStyle =
  score >= 200
    ? "from-red-50 to-red-100 border-red-300"
    : score >= 100
    ? "from-orange-50 to-orange-100 border-orange-300"
    : score >= 50
    ? "from-yellow-50 to-yellow-100 border-yellow-300"
    : "from-green-50 to-green-100 border-green-300";

const severityLabel =
  score >= 200 ? "Severe" :
  score >= 100 ? "High" :
  score >= 50  ? "Moderate" :
  "Low";

  return (
    <div
      className={`border ${severityStyle} rounded-2xl p-5 flex gap-4 items-start 
        bg-gradient-to-br shadow-md hover:shadow-xl 
        hover:-translate-y-1 transition-all duration-300 ease-out`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center shadow-sm">
        <span className="text-blue-700 font-bold text-lg">{user[0]}</span>
      </div>

      {/* Post content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-gray-800">{user}</span>
          <span className="text-xs text-gray-500">{new Date(time).toLocaleString()}</span>
        </div>

        {/* Text */}
        <p className="text-sm text-gray-700 mb-3 leading-snug">{text}</p>
        {/* Severity Badge */}
        {score && (
          <div
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full shadow-sm
              ${
                score >= 200
                  ? "bg-red-200 text-red-800"
                  : score === 100
                  ? "bg-orange-200 text-orange-800"
                  : score === 50
                  ? "bg-yellow-200 text-yellow-800"
                  : "bg-green-200 text-green-800"
              }`}
          >
            {severityLabel} ({score})
          </div>
        )}

        {/* Meta Info */}
        <div className="text-xs text-gray-500 mt-3 space-y-1">
          <div>📍 <span className="font-medium">{location}</span></div>
          <div>💬 Reposts: {reposts} ❤️ Likes: {likes} </div>

          {nearby_records.length > 0 && (
            <div>🌐 Nearby: {nearby_records.join(", ")}</div>
          )}

          {updated_at && (
            <div className="text-[11px] text-gray-400 italic">
              Updated: {new Date(updated_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BreakingPostCard;
