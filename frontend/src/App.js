import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FAQPage from "./pages/FAQPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/faq" element={<FAQPage />} />
    </Routes>
  );
}