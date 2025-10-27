import React from 'react'

export default function Header() {
  return (
    <header className="header card" role="banner" aria-label="Top bar">
      <div className="brand">
        <span className="brand-dot" aria-hidden="true"></span>
        <span>Strava Dashboard</span>
      </div>
      <div className="actions">
        <a className="button" href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer">
          Strava API Settings
        </a>
        <a className="button" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
          Vercel
        </a>
      </div>
    </header>
  )
}
