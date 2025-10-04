import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FAQPage from "./pages/FAQPage";
import Landing from "./pages/Landing";

// ...existing code...
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/faq" element={<FAQPage />} />
    </Routes>
  );
}