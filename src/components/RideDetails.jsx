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
import TxtButton from "./TxtButton";

export default function RideDetails({ rideId }) {
  const [rideData, setRideData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    setLoading(true);
    fetch(`/api/strava/activity?id=${rideId}`)
      .then((r) => r.json())
      .then((json) => {
        setRideData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [rideId]);

  if (!rideId)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
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

  if (loading || !rideData)
    return <div style={{ padding: "2rem" }}>Loading ride data...</div>;

  const { activity, streams } = rideData;
  if (!activity) return <p>No activity data found</p>;

  const watts = streams?.watts?.data || [];
  const hr = streams?.heartrate?.data || [];
  const speed = streams?.velocity_smooth?.data || [];
  const cadence = streams?.cadence?.data || [];
  const time = streams?.time?.data || [];
  const distance = streams?.distance?.data || [];

  const ftp = 222;

  // --- Derived metrics ---
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

  const avgPower = activity.average_watts || 0;
  const durationHrs = (activity.moving_time || 0) / 3600;
  const IF = np && ftp ? np / ftp : 0;
  const VI = avgPower ? np / avgPower : 0;
  const TSS = durationHrs * IF * IF * 100;
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

  const chartData = time.map((t, i) => ({
    time: (t / 60).toFixed(1),
    Power: watts[i],
    HR: hr[i],
    Speed: (speed[i] || 0) * 2.23694,
  }));

  // --- Power zones ---
  const zones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0, Z6: 0 };
  watts.forEach((w) => {
    if (w < 0.56 * ftp) zones.Z1++;
    else if (w < 0.76 * ftp) zones.Z2++;
    else if (w < 0.91 * ftp) zones.Z3++;
    else if (w < 1.06 * ftp) zones.Z4++;
    else if (w < 1.21 * ftp) zones.Z5++;
    else zones.Z6++;
  });

  const powerZoneData = Object.entries(zones).map(([k, v]) => ({
    zone: k,
    pct: watts.length ? ((v / watts.length) * 100).toFixed(1) : 0,
  }));

  const hrZones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  hr.forEach((bpm) => {
    if (bpm < 0.6 * 200) hrZones.Z1++;
    else if (bpm < 0.7 * 200) hrZones.Z2++;
    else if (bpm < 0.8 * 200) hrZones.Z3++;
    else if (bpm < 0.9 * 200) hrZones.Z4++;
    else hrZones.Z5++;
  });

  const hrZoneData = Object.entries(hrZones).map(([k, v]) => ({
    zone: k,
    pct: hr.length ? ((v / hr.length) * 100).toFixed(1) : 0,
  }));

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      {/* --- Header --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0 }}>{activity.name}</h2>
        <TxtButton rideData={rideData} />
      </div>

      {/* --- Metrics Grid --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <Metric label="Distance" value={(activity.distance / 1609.34).toFixed(2)} unit="mi" />
        <Metric label="Elevation" value={activity.total_elevation_gain?.toFixed(0)} unit="ft" />
        <Metric label="Moving Time" value={(activity.moving_time / 60).toFixed(0)} unit="min" />
        <Metric label="Avg Power" value={avgPower.toFixed(0)} unit="W" />
        <Metric label="NP" value={np.toFixed(0)} unit="W" />
        <Metric label="IF" value={IF.toFixed(2)} />
        <Metric label="VI" value={VI.toFixed(2)} />
        <Metric label="TSS" value={TSS.toFixed(0)} />
        <Metric label="EF" value={EF.toFixed(2)} />
        <Metric label="HR Drift" value={`${hrDrift.toFixed(1)}%`} />
      </div>

      {/* --- Power / HR / Speed Chart --- */}
      <h3>Power · Heart Rate · Speed</h3>
      <div
        style={{
          background: "#111",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#222" />
            <XAxis dataKey="time" tick={{ fill: "#aaa" }} />
            <YAxis tick={{ fill: "#aaa" }} />
            <Tooltip />
            <Line type="monotone" dataKey="Power" stroke="#00bcd4" dot={false} />
            <Line type="monotone" dataKey="HR" stroke="#ff4081" dot={false} />
            <Line type="monotone" dataKey="Speed" stroke="#4caf50" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- Zones --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        <ZoneChart title="Power Zones" data={powerZoneData} color="#00bcd4" />
        <ZoneChart title="Heart Rate Zones" data={hrZoneData} color="#ff4081" />
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
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
        {value} {unit || ""}
      </div>
    </div>
  );
}

function ZoneChart({ title, data, color }) {
  return (
    <div
      style={{
        background: "#111",
        borderRadius: "12px",
        padding: "1rem",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="zone" tick={{ fill: "#aaa" }} />
          <YAxis tick={{ fill: "#aaa" }} />
          <Tooltip />
          <Bar dataKey="pct" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
