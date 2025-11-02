import React from "react";
import { Link } from "react-router-dom";

export default function FirstResponders() {
  const organizations = [
    {
      icon: "✚",
      title: "Emergency Response Organization",
      description: "Providing rapid response and medical assistance during disasters.",
      link: "https://teamrubiconusa.org/?utm_source=chatgpt.com"
    },
    {
      icon: "👥",
      title: "Disaster Relief Network",
      description: "Coordinating logistics and resources for disaster-hit areas.",
      link: "https://www.fema.gov/about/how-fema-works"
    },
    {
      icon: "♥",
      title: "Humanitarian Aid Foundation",
      description: "Supporting communities with essential supplies and services.",
      link: "https://www.ifrc.org/?utm_source=chatgpt.com"
    }
  ];

  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center font-sans">
      <header className="w-full max-w-7xl flex items-center justify-between py-6 px-8">
        <h1 className="text-white font-bold text-3xl">DISASTER TRACKER</h1>
        <nav className="flex gap-3">
          <Link to="/" className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors duration-200">Landing</Link>
          <Link to="/home" className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors duration-200">Home</Link>
          <Link to="/breakingposts" className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors duration-200">Breaking Posts</Link>
          <Link to="/firstresponders" className="px-4 py-2 rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors duration-200">First Responders</Link>
          <Link to="/faq" className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors duration-200">FAQ</Link>
          <Link to="/statistics" className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors duration-200">Statistics</Link>
        </nav>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-7xl px-8 pb-16">
        {/* Page Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">First Responders</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Connect with emergency response organizations and disaster relief services when you need help most.
          </p>
        </div>

        {/* Organization Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          {organizations.map((org, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Icon */}
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white text-3xl mb-6 mx-auto">
                {org.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">{org.title}</h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed text-center">{org.description}</p>
              
              {/* Learn More Link */}
              <div className="text-center">
                <a 
                  href={org.link} 
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Contact Message */}
        <div className="text-center bg-red-600/20 rounded-2xl p-8 border-2 border-red-500/30">
          <p className="text-red-400 font-bold text-4xl mb-2">
            For Urgent Emergency Contact 911
          </p>
          <p className="text-white/80 text-lg">
            In case of life-threatening emergency, call 911 immediately
          </p>
        </div>
      </div>
    </div>
  );
}
