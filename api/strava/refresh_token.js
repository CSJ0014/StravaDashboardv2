// /api/strava/refresh_token.js
// One-time use endpoint: hit /api/strava/refresh_token?code=OAUTH_CODE after your Strava app redirect
// It will exchange the code for a long-lived refresh token.

import fetch from 'node-fetch'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const code = req.query.code
  if (!code) return res.status(400).json({ error: 'Missing ?code=' })

  const client_id = process.env.STRAVA_CLIENT_ID
  const client_secret = process.env.STRAVA_CLIENT_SECRET
  if (!client_id || !client_secret) {
    return res.status(500).json({ error: 'Missing STRAVA_CLIENT_ID/SECRET in env' })
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        grant_type: 'authorization_code'
      })
    })
    const data = await response.json()
    if (!response.ok) {
      return res.status(500).json({ error: 'Exchange failed', details: data })
    }
    res.status(200).json({
      message: 'Use this refresh_token in your Vercel env vars.',
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      athlete: data.athlete
    })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
}
