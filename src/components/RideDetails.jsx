import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import TxtButton from "./TxtButton.jsx";

export default function RideDetails({ activity, streams }) {
  if (!activity)
    return (
      <div className="card empty">
        <p>Select a ride to view details</p>
      </div>
    );

  // === Safely unwrap streams ===
  const s = streams?.streams || streams || {};
  const time = s.time?.data || [];
  const watts = s.watts?.data || [];
  const hr = s.heartrate?.data || [];
  const speed = s.velocity_smooth?.data || [];

  // === Build chart data ===
  const chartData = useMemo(() => {
    if (!time.length) return [];
    return time.map((t, i) => ({
      time: (t / 60).toFixed(1), // convert seconds → minutes
      Power: watts[i] || null,
      HR: hr[i] || null,
      Speed: speed[i] ? (speed[i] * 2.237).toFixed(1) : null,
    }));
  }, [time, watts, hr, speed]);

  // === Zone computations ===
  const computeZones = (arr, zones) => {
    if (!arr?.length) return [];
    const counts = zones.map(() => 0);
    for (const val of arr) {
      for (let i = 0; i < zones.length; i++) {
        const [low, high] = zones[i];
        if (val >= low && val < high) counts[i]++;
      }
    }
    const total = arr.length;
    return counts.map((c, i) => ({
      zone: `Z${i + 1}`,
      pct: ((c / total) * 100).toFixed(1),
    }));
  };

  const powerZones = computeZones(watts, [
    [0, 0.55 * 222],
    [0.55 * 222, 0.75 * 222],
    [0.75 * 222, 0.9 * 222],
    [0.9 * 222, 1.05 * 222],
    [1.05 * 222, 1.2 * 222],
    [1.2 * 222, 9999],
  ]);

  const hrZones = computeZones(hr, [
    [0, 108],
    [108, 126],
    [126, 144],
    [144, 162],
    [162, 180],
    [180, 999],
  ]);

  // === Chart colors ===
  const colors = {
    Power: "#00bfff",
    HR: "#ff7e87",
    Speed: "#7aff8f",
  };

  return (
    <div className="ride-details">
      {/* === Header === */}
      <div className="card">
        <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#eaeaea", textShadow: "0 0 8px rgba(0,191,255,0.3)" }}>
            {activity.name}
          </h2>
          <TxtButton rideData={{ activity, streams: s }} />
        </div>

        {/* === Stats === */}
        <div className="stats-row">
          <div className="stat"><h4>Distance</h4><div>{(activity.distance / 1609).toFixed(2)} mi</div></div>
          <div className="stat"><h4>Elevation</h4><div>{activity.total_elevation_gain.toFixed(0)} ft</div></div>
          <div className="stat"><h4>Moving Time</h4><div>{Math.round(activity.moving_time / 60)} min</div></div>
          <div className="stat"><h4>Avg HR</h4><div>{activity.average_heartrate?.toFixed(0) || "-"} bpm</div></div>
          <div className="stat"><h4>Avg Power</h4><div>{activity.average_watts?.toFixed(0) || "-"} W</div></div>
          <div className="stat"><h4>Normalized Power</h4><div>{(activity.normalized_power ?? activity.weighted_average_watts ?? null)?.toFixed?.(0) || "-"} W</div></div>
        </div>
      </div>

      {/* === Combined Chart === */}
      <div className="card" style={{ background: "#111", height: 360 }}>
        <h3 style={{ marginBottom: 12, color: "#8ef0ff" }}>
          Power • Heart Rate • Speed
        </h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(0,191,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#999", fontSize: 11 }}
                label={{
                  value: "Minutes",
                  fill: "#777",
                  position: "insideBottomRight",
                  offset: -8,
                }}
              />
              <YAxis tick={{ fill: "#999", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f0f12",
                  border: "1px solid rgba(0,191,255,0.2)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#00bfff" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Power" stroke={colors.Power} strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="HR" stroke={colors.HR} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Speed" stroke={colors.Speed} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#777", padding: "24px" }}>No stream data available.</p>
        )}
      </div>

      {/* === Zone Charts === */}
      <div className="zones-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ background: "#111" }}>
          <h3 style={{ color: "#8ef0ff" }}>Power Zones</h3>
          {powerZones.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={powerZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(0,191,255,0.2)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#00bfff" }}
                />
                <Bar dataKey="pct" fill={colors.Power} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#777" }}>Power data not available</p>
          )}
        </div>

        <div className="card" style={{ background: "#111" }}>
          <h3 style={{ color: "#8ef0ff" }}>Heart Rate Zones</h3>
          {hrZones.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hrZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(255,126,135,0.2)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#ff7e87" }}
                />
                <Bar dataKey="pct" fill={colors.HR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#777" }}>HR data not available</p>
          )}
        </div>
      </div>

      <div className="footer-note">
        Data via Strava API • Powered by your Cycling Dashboard
      </div>
    </div>
  );
}
