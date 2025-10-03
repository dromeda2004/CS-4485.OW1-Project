import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FAQPage from "./pages/FAQPage";
import BreakingPosts from "./pages/BreakingPosts";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/breakingposts" element={<BreakingPosts />} />
    </Routes>
  );
}