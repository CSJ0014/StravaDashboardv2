// /api/strava.js
export default async function handler(req, res) {
  const STRAVA_ACCESS_TOKEN = process.env.STRAVA_ACCESS_TOKEN;

  if (!STRAVA_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Missing STRAVA_ACCESS_TOKEN" });
  }

  const base = "https://www.strava.com/api/v3";

  try {
    // === 1️⃣ List Activities ===
    if (req.url.startsWith("/api/strava/activities")) {
      const perPage = req.query.per_page || 15;
      const response = await fetch(`${base}/athlete/activities?per_page=${perPage}`, {
        headers: { Authorization: `Bearer ${STRAVA_ACCESS_TOKEN}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Strava API error ${response.status}: ${text}`);
      }

      const data = await response.json();
      return res.status(200).json({ activities: data });
    }

    // === 2️⃣ Single Activity + Streams ===
    if (req.url.startsWith("/api/strava/activity")) {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing ?id parameter" });

      const [activityRes, streamsRes] = await Promise.all([
        fetch(`${base}/activities/${id}`, {
          headers: { Authorization: `Bearer ${STRAVA_ACCESS_TOKEN}` },
        }),
        fetch(`${base}/activities/${id}/streams?keys=watts,heartrate,velocity_smooth,time&key_by_type=true`, {
          headers: { Authorization: `Bearer ${STRAVA_ACCESS_TOKEN}` },
        }),
      ]);

      if (!activityRes.ok || !streamsRes.ok) {
        const errText = await activityRes.text();
        const errText2 = await streamsRes.text();
        throw new Error(
          `Strava API error: ${activityRes.statusText} / ${streamsRes.statusText}\n${errText}\n${errText2}`
        );
      }

      const activity = await activityRes.json();
      const streams = await streamsRes.json();
      return res.status(200).json({ activity, streams });
    }

    // === 3️⃣ Catch-All ===
    return res.status(404).json({ error: "Invalid route. Use /activities or /activity" });
  } catch (error) {
    console.error("Strava API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
