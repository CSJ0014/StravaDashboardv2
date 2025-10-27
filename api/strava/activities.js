const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities'

async function getAccessToken() {
  const client_id = process.env.STRAVA_CLIENT_ID
  const client_secret = process.env.STRAVA_CLIENT_SECRET
  const refresh_token = process.env.STRAVA_REFRESH_TOKEN
  if (!client_id || !client_secret || !refresh_token) {
    throw new Error('Missing STRAVA_* env vars')
  }
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id, client_secret, refresh_token, grant_type: 'refresh_token'
    })
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error('Strava token refresh failed: ' + t)
  }
  const data = await res.json()
  return data.access_token
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const token = await getAccessToken()
    const url = new URL(STRAVA_ACTIVITIES_URL)
    url.searchParams.set('per_page', '50')
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) {
      const t = await r.text()
      throw new Error('Strava activities failed: ' + t)
    }
    const list = await r.json()
    // filter to only ride-like types and slice 15
    const TYPES = new Set(['Ride','GravelRide','VirtualRide'])
    const filtered = list.filter(a => TYPES.has(a.type)).slice(0, 15)
    res.status(200).json(filtered)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e.message || e) })
  }
}
