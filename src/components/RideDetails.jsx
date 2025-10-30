import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RideDetails({ activity, streams }) {
  if (!activity) {
    return (
      <div className="empty">
        <p>Select a ride to view details</p>
        <p className="footer-note">
          Data provided via Strava API — part of your personal training dashboard.
        </p>
      </div>
    );
  }

  // === Rolling average smoother ===
  const smoothArray = (arr, windowSize = 5) => {
    if (!arr || arr.length === 0) return [];
    return arr.map((_, i) => {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(arr.length, i + windowSize);
      const segment = arr.slice(start, end);
      return segment.reduce((a, b) => a + b, 0) / segment.length;
    });
  };

  // === Correct stream mapping (with .data restored) ===
  const time = streams?.time?.data || [];
  const watts = streams?.watts?.data || [];
  const hr = streams?.heartrate?.data || [];
  const speed = streams?.velocity_smooth?.data || [];

  // === Build combined chart data ===
  const chartData = useMemo(() => {
    if (!time.length) return [];
    const smoothedWatts = smoothArray(watts, 5);
    const smoothedHR = smoothArray(hr, 5);
    const smoothedSpeed = smoothArray(
      speed.map((v) => v * 2.23694),
      5
    );
    return time.map((t, i) => ({
      time: (t / 60).toFixed(1),
      watts: smoothedWatts[i] || 0,
      hr: smoothedHR[i] || 0,
      speed: smoothedSpeed[i] || 0,
    }));
  }, [time, watts, hr, speed]);

  return (
    <div className="main">
      {/* === Ride Header === */}
      <h2 style={{ marginBottom: 20 }}>{activity.name}</h2>

      {/* === Stats Row === */}
      <div className="stats-row">
        <div className="stat">
          <h4>Distance</h4>
          <div>{(activity.distance / 1609.34).toFixed(2)} mi</div>
        </div>
        <div className="stat">
          <h4>Elevation Gain</h4>
          <div>{activity.total_elevation_gain?.toFixed(0)} ft</div>
        </div>
        <div className="stat">
          <h4>Moving Time</h4>
          <div>{Math.round(activity.moving_time / 60)} min</div>
        </div>
        <div className="stat">
          <h4>Avg HR</h4>
          <div>{activity.average_heartrate?.toFixed(0) || "-"} bpm</div>
        </div>
        <div className="stat">
          <h4>Avg Power</h4>
          <div>{activity.average_watts?.toFixed(0) || "-"} W</div>
        </div>
        <div className="stat">
          <h4>Norm Power</h4>
          <div>{activity.weighted_average_watts?.toFixed(0) || "-"} W</div>
        </div>
      </div>

      {/* === Combined Chart === */}
      {chartData.length > 0 ? (
        <div className="card" style={{ height: 340, marginTop: 16 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>
            Power • Heart Rate • Speed
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#aaa", fontSize: 10 }}
                label={{
                  value: "Minutes",
                  fill: "#aaa",
                  position: "insideBottomRight",
                  offset: -8,
                }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#aaa", fontSize: 10 }}
                label={{
                  value: "Power / HR",
                  angle: -90,
                  fill: "#aaa",
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#aaa", fontSize: 10 }}
                label={{
                  value: "Speed (mph)",
                  angle: -90,
                  fill: "#aaa",
                  position: "insideRight",
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1b1c1f",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#8ef0ff" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="watts"
                stroke="#8ef0ff"
                strokeWidth={2}
                dot={false}
                name="Power (W)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hr"
                stroke="#f06292"
                strokeWidth={1.6}
                dot={false}
                name="Heart Rate (bpm)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="speed"
                stroke="#81c784"
                strokeWidth={1.5}
                dot={false}
                name="Speed (mph)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card empty" style={{ height: 220, marginTop: 16 }}>
          <p>Waiting for Strava stream data...</p>
        </div>
      )}

      {/* === Zones Row === */}
      <div
        className="zones-row"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="card">
          <h3>Power Zones</h3>
          <p>Power data loaded</p>
        </div>
        <div className="card">
          <h3>Heart Rate Zones</h3>
          <p>Heart rate data loaded</p>
        </div>
      </div>
    </div>
  );
}
