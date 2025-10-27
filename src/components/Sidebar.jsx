import React from 'react'
import { format } from 'date-fns'

function metersToMiles(m){ return m / 1609.34 }

function TypeChip({ type }) {
  const t = (type || '').toLowerCase()
  const cls = t === 'gravelride' ? 'gravel' : t === 'virtualride' ? 'virtual' : 'ride'
  const label = t === 'gravelride' ? 'Gravel' : t === 'virtualride' ? 'Virtual' : 'Ride'
  return <span className={`chip ${cls}`}>{label}</span>
}

export default function Sidebar({ activities, selectedId, onSelect, loading, error }) {
  if (loading) return <div className="card panel">Loading rides…</div>
  if (error) return <div className="card panel" role="alert">{error}</div>
  if (!activities?.length) return <div className="card panel empty">No activities yet. Once your Strava env vars are set on Vercel, your last rides will appear here.</div>

  return (
    <div>
      {activities.slice(0,15).map(a => {
        const d = new Date(a.start_date_local || a.start_date)
        const date = isNaN(d) ? '' : format(d, 'MMM d, yyyy')
        const miles = (metersToMiles(a.distance || 0)).toFixed(1)
        return (
          <div
            key={a.id}
            className={`card ride-item ${selectedId===a.id ? 'active' : ''}`}
            onClick={() => onSelect(a)}
            role="button" aria-label={`Open ${a.name}`}
          >
            <div>
              <div className="ride-title">{a.name || 'Untitled Ride'}</div>
              <div className="ride-meta">{date} • {miles} mi</div>
            </div>
            <div className="chips">
              <TypeChip type={a.type} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
