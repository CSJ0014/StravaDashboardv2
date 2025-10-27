import fetch from 'node-fetch'

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

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

  const id = req.query.id
  if (!id) return res.status(400).json({ error: 'Missing ?id=' })

  try {
    const token = await getAccessToken()
    const url = `https://www.strava.com/api/v3/activities/${id}/streams?keys=time,distance,watts,heartrate,altitude,latlng&key_by_type=true`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) {
      const t = await r.text()
      throw new Error('Strava streams failed: ' + t)
    }
    const json = await r.json()
    res.status(200).json(json)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e.message || e) })
  }
}
