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
  AreaChart,
  Area,
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
  const altitude = s.altitude?.data || [];
  const distance = s.distance?.data || [];
  const cadence = s.cadence?.data || [];

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

  // === Tick values for 30s intervals ===
  const tickValues = useMemo(() => {
    if (!chartData.length) return [];
    const last = parseFloat(chartData[chartData.length - 1].time);
    const ticks = [];
    for (let t = 0; t <= last; t += 0.5) ticks.push(t.toFixed(1));
    return ticks;
  }, [chartData]);

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

  // === Smart elevation (real vs synthetic) ===
  const elevationData = useMemo(() => {
    if (altitude?.length && distance?.length) {
      return altitude.map((alt, i) => ({
        dist: (distance[i] / 1609).toFixed(1),
        elev: (alt * 3.28084).toFixed(0),
      }));
    } else if (distance?.length && activity.total_elevation_gain) {
      const totalGain = activity.total_elevation_gain * 3.28084;
      const maxDist = distance[distance.length - 1] / 1609;
      return Array.from({ length: 120 }, (_, i) => ({
        dist: ((i / 120) * maxDist).toFixed(1),
        elev: Math.round(
          (Math.sin((i / 120) * Math.PI * 2) + 1) * (totalGain / 4)
        ),
      }));
    }
    return [];
  }, [altitude, distance, activity.total_elevation_gain]);

  // === Power histogram ===
  const powerBins = useMemo(() => {
    if (!watts.length) return [];
    const binSize = 25;
    const maxWatt = Math.max(...watts);
    const bins = [];
    for (let start = 0; start <= maxWatt; start += binSize) {
      const end = start + binSize;
      const count = watts.filter((w) => w >= start && w < end).length;
      bins.push({ bin: `${start}-${end}`, count });
    }
    return bins;
  }, [watts]);

  // === Cadence histogram ===
  const cadenceBins = useMemo(() => {
    if (!cadence.length) return [];
    const binSize = 5;
    const maxCad = Math.max(...cadence);
    const bins = [];
    for (let start = 50; start <= maxCad; start += binSize) {
      const end = start + binSize;
      const count = cadence.filter((c) => c >= start && c < end).length;
      bins.push({ bin: `${start}-${end}`, count });
    }
    return bins;
  }, [cadence]);

  // === HR drift / decoupling ===
  const hrDriftData = useMemo(() => {
    if (!time.length || !hr.length || !watts.length) return [];
    const window = 300;
    const segments = [];
    for (let i = 0; i < time.length; i += window) {
      const sliceWatts = watts.slice(i, i + window);
      const sliceHR = hr.slice(i, i + window);
      if (sliceWatts.length && sliceHR.length) {
        const avgP = sliceWatts.reduce((a, b) => a + b, 0) / sliceWatts.length;
        const avgHR = sliceHR.reduce((a, b) => a + b, 0) / sliceHR.length;
        segments.push({
          segment: (i / window + 1).toFixed(0),
          AvgPower: Math.round(avgP),
          AvgHR: Math.round(avgHR),
        });
      }
    }
    return segments;
  }, [time, hr, watts]);

  const tooltipStyle = {
    background: "rgba(12, 18, 34, 0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    color: "#fff",
    fontSize: "13px",
  };

  const colors = {
    Power: "#6c72ff",
    HR: "#ff7e87",
    Speed: "#57c3ff",
    Cadence: "#3be2b0",
  };

  return (
    <div className="ride-details">
      {/* === HEADER === */}
      <div className="card ride-header">
        <div className="header-row">
          <h2 className="ride-title">{activity.name}</h2>
          <TxtButton rideData={{ activity, streams: s }} />
        </div>

        {/* === STATS === */}
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

      {/* === MAIN CHART === */}
      <div className="card chart-card">
        <h3>Power • Heart Rate • Speed</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" ticks={tickValues} tick={{ fill: "#aaa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#6c72ff" }} />
              <Legend />
              <Line type="monotone" dataKey="Power" stroke={colors.Power} strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="HR" stroke={colors.HR} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Speed" stroke={colors.Speed} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-note">No stream data available</p>
        )}
      </div>

      {/* === ZONE CHARTS === */}
      <div className="zones-row">
        {/* Power Zones */}
        <div className="card zone-card">
          <h3>Power Zones</h3>
          {powerZones.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={powerZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                <Bar dataKey="pct" fill={colors.Power} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">Power data not available</p>
          )}
        </div>

        {/* HR Zones */}
        <div className="card zone-card">
          <h3>Heart Rate Zones</h3>
          {hrZones.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hrZones}>
                <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                <Bar dataKey="pct" fill={colors.HR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">HR data not available</p>
          )}
        </div>
      </div>

      {/* === DISTRIBUTION CHARTS === */}
      <div className="zones-row">
        {/* Power Distribution */}
        <div className="card zone-card">
          <h3>Power Distribution</h3>
          {powerBins.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={powerBins}>
                <XAxis dataKey="bin" tick={{ fill: "#aaa", fontSize: 10 }} />
                <YAxis tick={{ fill: "#aaa", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill={colors.Power} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">No power data</p>
          )}
        </div>

        {/* Cadence Distribution */}
        <div className="card zone-card">
          <h3>Cadence Distribution</h3>
          {cadenceBins.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cadenceBins}>
                <XAxis dataKey="bin" tick={{ fill: "#aaa", fontSize: 10 }} />
                <YAxis tick={{ fill: "#aaa", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill={colors.Cadence} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-note">No cadence data</p>
          )}
        </div>
      </div>

      {/* === ELEVATION PROFILE === */}
      <div className="card chart-card">
        <h3>Elevation Profile</h3>
        {elevationData.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={elevationData}>
              <defs>
                <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7074ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0b0c10" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dist" tick={{ fill: "#aaa" }} />
              <YAxis tick={{ fill: "#aaa" }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
              <Area type="monotone" dataKey="elev" stroke="#7074ff" fill="url(#elevGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-note">Elevation data not available</p>
        )}
      </div>

      {/* === HR DRIFT === */}
      <div className="card chart-card">
        <h3>Heart Rate Drift (Decoupling)</h3>
        {hrDriftData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hrDriftData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="segment" tick={{ fill: "#aaa" }} />
              <YAxis tick={{ fill: "#aaa" }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
              <Legend />
              <Line type="monotone" dataKey="AvgPower" stroke="#6c72ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="AvgHR" stroke="#ff7e87" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-note">Not enough data for HR drift</p>
        )}
      </div>

      <div className="footer-note">
        Data via Strava API • Powered by your Cycling Dashboard
      </div>
    </div>
  );
}
