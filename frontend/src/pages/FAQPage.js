import React from "react";
import { Link } from "react-router-dom";
import FAQ from "../components/FAQ";

const FAQPage = () => {
  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <header className="w-full max-w-6xl flex items-center justify-between mb-6">
      <h1 className="text-white font-bold text-3xl mb-6">DISASTER TRACKER </h1>
        <nav className="flex gap-3">
          <Link to="/" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Landing</Link>
          <Link to="/home" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Home</Link>
          <Link to="/breakingposts" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">Breaking Posts</Link>
          <Link to="/faq" className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20">FAQ</Link>
        </nav>
        </header>
      <FAQ />
    </div>
  );
};

export default FAQPage;