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
      time: (t / 60).toFixed(1),
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

  const colors = {
    Power: "#6c72ff",
    HR: "#ff7e87",
    Speed: "#57c3ff",
  };

  return (
    <div className="ride-details">
      {/* === HEADER === */}
      <div className="card ride-header">
        <div className="header-row">
          <h2 className="ride-title">{activity.name}</h2>
          <TxtButton rideData={{ activity, streams: s }} />
        </div>

        {/* === DASHDARK-STYLE METRIC CARDS === */}
        <div className="stats-grid">
          {[
            { label: "Distance", value: `${(activity.distance / 1609).toFixed(2)} mi` },
            { label: "Elevation", value: `${(activity.total_elevation_gain * 3.28084).toFixed(0)} ft` },
            { label: "Moving Time", value: `${Math.round(activity.moving_time / 60)} min` },
            { label: "Avg HR", value: `${activity.average_heartrate?.toFixed(0) || "-"} bpm` },
            { label: "Avg Power", value: `${activity.average_watts?.toFixed(0) || "-"} W` },
            {
              label: "Normalized Power",
              value: `${
                (activity.normalized_power ??
                  activity.weighted_average_watts ??
                  null)?.toFixed?.(0) || "-"
              } W`,
            },
          ].map((stat, i) => (
            <div className="stat-card" key={i}>
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* === CHARTS === */}
      <div className="card chart-card">
        <h3>Power • Heart Rate • Speed</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0b1228",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#6c72ff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Power"
                stroke={colors.Power}
                strokeWidth={1.8}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="HR"
                stroke={colors.HR}
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Speed"
                stroke={colors.Speed}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-note">No stream data available</p>
        )}
      </div>

      {/* === ZONES === */}
      <div className="zones-row">
        {/* === Power Zones === */}
        <div className="card zone-card">
          <h3>Power Zones</h3>
          {powerZones.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={powerZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip
                  wrapperStyle={{ zIndex: 10000 }}
                  cursor={{ fill: "transparent" }}
                  formatter={(value) => [`${value}%`, "Time in Zone"]}
                  contentStyle={{
                    background: "rgba(20,25,40,0.95)",
                    border: "none",
                    borderRadius: "6px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    color: "var(--neutral-100)",
                    fontSize: "13px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                    marginBottom: "2px",
                  }}
                />
                <Bar dataKey="pct" fill={colors.Power} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">Power data not available</p>
          )}
        </div>

        {/* === HR Zones === */}
        <div className="card zone-card">
          <h3>Heart Rate Zones</h3>
          {hrZones.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hrZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip
                  wrapperStyle={{ zIndex: 10000 }}
                  cursor={{ fill: "transparent" }}
                  formatter={(value) => [`${value}%`, "Time in Zone"]}
                  contentStyle={{
                    background: "rgba(20,25,40,0.95)",
                    border: "none",
                    borderRadius: "6px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    color: "var(--neutral-100)",
                    fontSize: "13px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                    marginBottom: "2px",
                  }}
                />
                <Bar dataKey="pct" fill={colors.HR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">HR data not available</p>
          )}
        </div>
      </div>

      <div className="footer-note">
        Data via Strava API • Powered by your Cycling Dashboard
      </div>
    </div>
  );
}
