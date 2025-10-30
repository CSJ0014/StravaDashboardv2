import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Area
} from "recharts";
import TxtButton from "./TxtButton";

export default function RideDetails({ rideId }) {
  const [activity, setActivity] = useState(null);
  const [streams, setStreams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rideId) return;
    setLoading(true);
    setError("");
    fetch(`/api/strava/activity?id=${rideId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.error) throw new Error(json.error);
        setActivity(json.activity || null);
        setStreams(json.streams || null);
      })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [rideId]);

  if (!rideId) return <div className="empty">Select a ride to view details</div>;
  if (loading) return <div className="empty">Loading ride data…</div>;
  if (error) return <div className="empty" style={{ color: '#ff6b6b' }}>Error: {error}</div>;
  if (!activity || !streams) return <div className="empty">No data available.</div>;

  // Build chart streams safely
  const time = streams.time?.data || [];
  const watts = streams.watts?.data || [];
  const hr = streams.heartrate?.data || [];
  const speed = streams.velocity_smooth?.data || [];
  const chartData = time.map((t, i) => ({
    tMin: (t / 60).toFixed(1),
    watts: watts[i] ?? null,
    hr: hr[i] ?? null,
    speed: speed[i] != null ? +(speed[i] * 2.23694).toFixed(1) : null, // m/s → mph
  }));

  // Summary metrics
  const distanceMi = (activity.distance / 1609.34).toFixed(2);
  const elevationFt = (activity.total_elevation_gain || 0).toFixed(0);
  const movingMin = Math.round((activity.moving_time || 0) / 60);
  const avgPower = (activity.average_watts || 0).toFixed(0);
  const avgHR = (activity.average_heartrate || 0).toFixed(0);
  const np = activity.weighted_average_watts || null; // server returns this; otherwise compute client-side

  return (
    <section>
      {/* top row: title + export */}
      <div className="card panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{activity.name}</h2>
        <TxtButton rideData={{ activity, streams }} />
      </div>

      {/* stat cards */}
      <div className="stats-row">
        <div className="card stat"><h4>Distance</h4><div>{distanceMi} mi</div></div>
        <div className="card stat"><h4>Elevation</h4><div>{elevationFt} ft</div></div>
        <div className="card stat"><h4>Moving Time</h4><div>{movingMin} min</div></div>
        <div className="card stat"><h4>Avg HR</h4><div>{avgHR} bpm</div></div>
        <div className="card stat"><h4>Avg Power</h4><div>{avgPower} W</div></div>
        <div className="card stat"><h4>Normalized Power</h4><div>{np ? `${np} W` : "—"}</div></div>
      </div>

      {/* main chart */}
      <div className="card panel">
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Power • Heart Rate • Speed</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="gPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8ef0ff" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#8ef0ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gHR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#69f0ae" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#69f0ae" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="tMin" tick={{ fill: "#9aa3b2" }} />
              <YAxis yAxisId="left" tick={{ fill: "#9aa3b2" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9aa3b2" }} />
              <Tooltip contentStyle={{ background: "#171923", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12 }} />
              <Legend />

              <Area yAxisId="left" type="monotone" dataKey="watts" fill="url(#gPower)" stroke="#8ef0ff" strokeWidth={2} name="Power (W)" />
              <Area yAxisId="left" type="monotone" dataKey="hr" fill="url(#gHR)" stroke="#ff6b6b" strokeWidth={1.8} name="Heart Rate (bpm)" />
              <Area yAxisId="right" type="monotone" dataKey="speed" fill="url(#gSpeed)" stroke="#69f0ae" strokeWidth={1.8} name="Speed (mph)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty">No stream data available.</div>
        )}
      </div>

      {/* zones placeholders – wire up later if desired */}
      <div className="stats-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card panel">
          <h3 style={{ marginTop: 0 }}>Power Zones</h3>
          <div className="footer-note">{streams?.watts ? "Power data loaded" : "No data available"}</div>
        </div>
        <div className="card panel">
          <h3 style={{ marginTop: 0 }}>HR Zones</h3>
          <div className="footer-note">{streams?.heartrate ? "Heart rate data loaded" : "No data available"}</div>
        </div>
      </div>

      <div className="footer-note">Data via Strava API • {chartData.length} samples loaded</div>
    </section>
  );
}
