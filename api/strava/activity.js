const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing activity ID" });
  }

  const accessToken = process.env.STRAVA_ACCESS_TOKEN;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  try {
    // 1️⃣ Refresh the access token if needed
    let token = accessToken;
    if (!token) {
      const refresh = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const refreshed = await refresh.json();
      token = refreshed.access_token;
    }

    // 2️⃣ Fetch main activity summary
    const summaryRes = await fetch(
      `https://www.strava.com/api/v3/activities/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const activity = await summaryRes.json();

    // 3️⃣ Fetch streams (power, hr, speed, etc.)
    const streamsRes = await fetch(
      `https://www.strava.com/api/v3/activities/${id}/streams?keys=watts,heartrate,velocity_smooth,cadence,time,distance,altitude&key_by_type=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const streams = await streamsRes.json();

    // 4️⃣ Return both together
    return res.status(200).json({ activity, streams });
  } catch (err) {
    console.error("Strava activity fetch failed", err);
    return res.status(500).json({ error: "Failed to load activity", details: err.message });
  }
}
