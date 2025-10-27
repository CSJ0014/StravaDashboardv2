const TYPES = new Set(['Ride','GravelRide','VirtualRide'])

export async function getActivities() {
  const res = await fetch('/api/strava/activities')
  if (!res.ok) throw new Error('Failed to fetch activities')
  const data = await res.json()
  return (data || []).filter(a => TYPES.has(a.type)).slice(0, 15)
}

export async function getActivityStreams(id) {
  const res = await fetch(`/api/strava/activity?id=${id}`)
  if (!res.ok) throw new Error('Failed to fetch streams')
  return await res.json()
}
