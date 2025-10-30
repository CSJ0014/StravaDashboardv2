import React from "react";
import "../styles.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Strava Dashboard</h1>
      </div>
      <div className="header-right">
        <p className="header-subtitle">Live Activity Insights</p>
      </div>
    </header>
  );
}
