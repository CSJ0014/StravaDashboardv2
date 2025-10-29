const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

export default async function handler(req, res) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  try {
    // 🔄 Refresh access token
    const tokenRes = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 📊 Fetch recent rides
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=15",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const rides = await activitiesRes.json();
    res.status(200).json(rides); // ✅ Correct ending
  } catch (e) {
    console.error("Error fetching Strava activities:", e);
    res.status(500).json({ error: String(e.message || e) }); // ✅ stays for errors only
  }
}
