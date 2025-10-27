import React, { useEffect, useState, useMemo } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import RideDetails from './components/RideDetails.jsx'
import TxtButton from './components/TxtButton.jsx'
import { getActivities, getActivityStreams } from './api/strava.js'

export default function App() {
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState(null)
  const [streams, setStreams] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const acts = await getActivities()
        setActivities(acts)
        if (acts?.length) setSelected(acts[0])
      } catch (e) {
        console.error(e)
        setError('Failed to load activities. Check your Vercel env vars.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!selected) return
      setStreams(null)
      try {
        const s = await getActivityStreams(selected.id)
        setStreams(s)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [selected?.id])

  return (
    <div className="app">
      <Header />
      <aside className="sidebar">
        <Sidebar
          activities={activities}
          selectedId={selected?.id}
          onSelect={setSelected}
          loading={loading}
          error={error}
        />
      </aside>
      <main className="main">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h2 style={{margin:0}}>Ride Dashboard</h2>
          <TxtButton activity={selected} streams={streams} />
        </div>
        <RideDetails activity={selected} streams={streams} />
        <div className="footer-note">Data via Strava API. This is a personal training dashboard.</div>
      </main>
    </div>
  )
}
