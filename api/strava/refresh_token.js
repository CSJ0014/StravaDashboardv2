// api/strava/refresh_token.js
// Exchanges a temporary code for a long-lived refresh token.
// After authorization, visit: /api/strava/refresh_token?code=XYZ

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing ?code=" });

  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    console.error("Missing env vars:", { client_id, client_secret });
    return res
      .status(500)
      .json({ error: "Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET" });
  }

  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Strava exchange failed:", data);
      return res.status(500).json({
        error: "Strava token exchange failed",
        details: data,
      });
    }

    console.log("✅ Strava exchange success:", {
      athlete: data.athlete?.id,
      refresh_token: data.refresh_token?.slice(0, 6) + "...",
    });

    return res.status(200).json({
      message: "Use this refresh_token in your Vercel env vars.",
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      athlete: data.athlete,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected error", details: String(err) });
  }
}
