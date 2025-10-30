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

  // === FIX: safely unwrap nested Strava stream data ===
  const s = streams?.streams || streams || {};
  const time = s.time?.data || [];
  const watts = s.watts?.data || [];
  const hr = s.heartrate?.data || [];
  const speed = s.velocity_smooth?.data || [];

  // === Build chart data ===
  const chartData = useMemo(() => {
    if (!time.length) return [];
    return time.map((t, i) => ({
      time: (t / 60).toFixed(1), // convert to minutes
      Power: watts[i] || null,
      HR: hr[i] || null,
      Speed: speed[i] ? (speed[i] * 2.237).toFixed(1) : null, // m/s → mph
    }));
  }, [time, watts, hr, speed]);

  // === Compute Power & HR Zone distributions ===
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
    Power: "#7cc9ff",
    HR: "#ff7e87",
    Speed: "#82ffb8",
  };

  return (
    <div className="ride-details">
      {/* === Header === */}
      <div className="card">
        <div className="header-row">
          <h2>{activity.name}</h2>
          <TxtButton activity={activity} />
        </div>

        {/* === Stat Cards === */}
        <div className="stats-row">
          <div className="stat">
            <h4>Distance</h4>
            <div>{(activity.distance / 1609).toFixed(2)} mi</div>
          </div>
          <div className="stat">
            <h4>Elevation</h4>
            <div>{activity.total_elevation_gain.toFixed(0)} ft</div>
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
            <h4>Normalized Power</h4>
            <div>{activity.normalized_power?.toFixed(0) || "-"} W</div>
          </div>
        </div>
      </div>

      {/* === Main Chart === */}
      <div className="card">
        <h3>Power • Heart Rate • Speed</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 25, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" tick={{ fill: "#999" }} label={{ value: "min", position: "insideBottomRight", offset: -6, fill: "#666" }} />
              <YAxis tick={{ fill: "#999" }} />
              <Tooltip
                contentStyle={{
                  background: "#1c1c1c",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#aaa" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Power" stroke={colors.Power} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="HR" stroke={colors.HR} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Speed" stroke={colors.Speed} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#777", padding: "24px" }}>No stream data available.</p>
        )}
      </div>

      {/* === Zone Charts === */}
      <div className="zones-row">
        <div className="card">
          <h3>Power Zones</h3>
          {powerZones.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={powerZones}>
                <XAxis dataKey="zone" tick={{ fill: "#999" }} />
                <YAxis tick={{ fill: "#999" }} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1c1c",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar dataKey="pct" fill={colors.Power} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#777" }}>Power data loaded</p>
          )}
        </div>

        <div className="card">
          <h3>HR Zones</h3>
          {hrZones.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hrZones}>
                <XAxis dataKey="zone" tick={{ fill: "#999" }} />
                <YAxis tick={{ fill: "#999" }} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1c1c",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar dataKey="pct" fill={colors.HR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#777" }}>Heart rate data loaded</p>
          )}
        </div>
      </div>

      <div className="footer-note">
        Data via Strava API. This is a personal training dashboard.
      </div>
    </div>
  );
}
