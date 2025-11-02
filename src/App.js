import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FAQPage from "./pages/FAQPage";
import Landing from "./pages/Landing";
import BreakingPosts from "./pages/BreakingPosts";
import FirstResponders from "./pages/FirstResponders";
import Stats from "./pages/Stats";

// ...existing code...
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/breakingposts" element={<BreakingPosts />} />
      <Route path="/firstresponders" element={<FirstResponders />} />
      <Route path="/statistics" element={<Stats />} />
    </Routes>
  );
}