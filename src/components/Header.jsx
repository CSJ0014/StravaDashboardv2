import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Strava Dashboard</h1>
        <nav className="header-links">
          <a
            href="https://www.strava.com/settings/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Strava API Settings
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel
          </a>
        </nav>
      </div>
    </header>
  );
}
