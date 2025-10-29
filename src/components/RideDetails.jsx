import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

export default function RideDetails({ rideId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId) return;
    fetch(`/api/strava/activity?id=${rideId}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((e) => setError(e.message));
  }, [rideId]);

  if (!rideId)
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Ride Dashboard</h2>
        <p>Select a ride to view details</p>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <p>❌ Error loading ride: {error}</p>
      </div>
    );

  if (!data) return <div style={{ padding: "2rem" }}>Loading ride data...</div>;

  const { activity, streams } = data;
  if (!activity) return <p>No activity data</p>;
  if (!streams) return <p>No streams data</p>;

  // --- Parse streams safely
  const time = streams?.time?.data || [];
  const watts = streams?.watts?.data || [];
  const hr = streams?.heartrate?.data || [];
  const speed = streams?.velocity_smooth?.data || [];

  const ftp = 222; // user’s FTP — you can make this dynamic later

  // --- Compute Normalized Power (NP)
  const np =
    watts.length > 0
      ? Math.pow(
          watts
            .map((_, i, arr) => {
              const window = arr.slice(Math.max(0, i - 30), i);
              const avg =
                window.reduce((a, b) => a + b, 0) / (window.length || 1);
              return Math.pow(avg, 4);
            })
            .reduce((a, b) => a + b, 0) / watts.length,
          0.25
        )
      : 0;

  // --- Compute Variability Index, Intensity Factor, TSS
  const avgPower = activity.average_watts || 0;
  const durationHrs = (activity.moving_time || 0) / 3600;
  const IF = np && ftp ? np / ftp : 0;
  const VI = avgPower ? np / avgPower : 0;
  const TSS = durationHrs * IF * IF * 100;

  // --- Efficiency Factor & HR Drift
  const avgHR = activity.average_heartrate || 0;
  const EF = avgHR ? avgPower / avgHR : 0;
  const hrDrift = hr.length
    ? ((hr.slice(-Math.floor(hr.length / 2)).reduce((a, b) => a + b, 0) /
        (hr.length / 2)) /
        (hr.slice(0, Math.floor(hr.length / 2)).reduce((a, b) => a + b, 0) /
          (hr.length / 2)) -
        1) *
      100
    : 0;

  // --- Combine for line chart
  const chartData = time.map((t, i) => ({
    time: (t / 60).toFixed(1),
    Power: watts[i],
    HR: hr[i],
    Speed: (speed[i] || 0) * 2.23694, // m/s → mph
  }));

  // --- Power / HR Zone Distribution
  const zones = {
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
  };

  watts.forEach((w) => {
    if (w < 0.56 * ftp) zones.z1++;
    else if (w < 0.76 * ftp) zones.z2++;
    else if (w < 0.91 * ftp) zones.z3++;
    else if (w < 1.06 * ftp) zones.z4++;
    else zones.z5++;
  });

  const powerZoneData = Object.entries(zones).map(([k, v]) => ({
    zone: k.toUpperCase(),
    minutes: (v / 60).toFixed(1),
  }));

  const hrZoneData = [
    { zone: "Z1", bpm: avgHR * 0.6 },
    { zone: "Z2", bpm: avgHR * 0.7 },
    { zone: "Z3", bpm: avgHR * 0.8 },
    { zone: "Z4", bpm: avgHR * 0.9 },
    { zone: "Z5", bpm: avgHR },
  ];

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <h2>{activity.name}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <Metric label="Distance" value={(activity.distance / 1609.34).toFixed(2)} unit="mi" />
        <Metric label="Elevation" value={activity.total_elevation_gain?.toFixed(0)} unit="ft" />
        <Metric label="Avg Power" value={avgPower.toFixed(0)} unit="W" />
        <Metric label="NP" value={np.toFixed(0)} unit="W" />
        <Metric label="IF" value={IF.toFixed(2)} />
        <Metric label="VI" value={VI.toFixed(2)} />
        <Metric label="TSS" value={TSS.toFixed(0)} />
        <Metric label="EF" value={EF.toFixed(2)} />
        <Metric label="HR Drift" value={`${hrDrift.toFixed(1)}%`} />
      </div>

      <h3>Power · Heart Rate · Speed</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="time" label={{ value: "Time (min)", position: "insideBottom", dy: 10 }} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="Power" stroke="#00bcd4" dot={false} />
          <Line type="monotone" dataKey="HR" stroke="#ff4081" dot={false} />
          <Line type="monotone" dataKey="Speed" stroke="#4caf50" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h3>Power Zones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={powerZoneData}>
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="minutes" fill="#00bcd4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <h3>HR Zones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hrZoneData}>
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bpm" fill="#ff4081" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: "2rem", opacity: 0.6 }}>
        <p>Streams loaded: {Object.keys(streams).join(", ")}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div
      style={{
        background: "#18181b",
        padding: "1rem",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
        {value} {unit || ""}
      </div>
    </div>
  );
}
