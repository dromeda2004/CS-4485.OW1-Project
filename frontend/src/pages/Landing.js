import React from "react";
import { Link } from "react-router-dom";
import bg from "../assets/mapplaceholder.png";

export default function Landing() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      gap: 20,
      padding: 20,
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>
      <h1 style={{ margin: 0, color: "#000000ff" }}>Welcome to Disaster Tracker</h1>
      <p style={{ maxWidth: 600, textAlign: "center", color: "#000000ff" }}>
        Choose where to go next.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/home" style={{
          padding: "10px 18px",
          background: "#1f2937",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6
        }}>
          Open Map / Home
        </Link>
        <Link to="/faq" style={{
          padding: "10px 18px",
          background: "#374151",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6
        }}>
          FAQ
        </Link>
      </div>
    </div>
  );
}