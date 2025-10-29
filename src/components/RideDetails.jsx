import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

export default function RideDetails({ rideId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId) return;
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/strava/activity?id=${rideId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching ride:", err);
        setError("Failed to load ride details.");
      }
    };
    fetchActivity();
  }, [rideId]);

  if (error) return <div className="card">Error: {error}</div>;
  if (!data) return <div className="card">Select a ride to view details</div>;

  const { activity, streams } = data;
  if (!streams || !streams.watts || !streams.heartrate) {
    return <div className="card">⚠️ No stream data available for this ride.</div>;
  }

  // Extract data arrays
  const watts = streams.watts?.data || [];
  const hr = streams.heartrate?.data || [];
  const speed = streams.velocity_smooth?.data?.map((v) => v * 2.23694) || []; // m/s → mph
  const cadence = streams.cadence?.data || [];
  const time = streams.time?.data || [];

  // Merge into chart-friendly format
  const chartData = time.map((t, i) => ({
    t: (t / 60).toFixed(1), // minutes
    Power: watts[i] || 0,
    HR: hr[i] || 0,
    Speed: speed[i] || 0,
    Cadence: cadence[i] || 0,
  }));

  // Basic stats
  const avgPower = watts.reduce((a, b) => a + b, 0) / watts.length || 0;
  const np = Math.pow(
    watts
      .map((w, i) => {
        const window = watts.slice(i, i + 30);
        const mean4 = Math.pow(
          window.reduce((a, b) => a + b, 0) / window.length || 0,
          4
        );
        return mean4;
      })
      .reduce((a, b) => a + b, 0) / watts.length,
    0.25
  );
  const ftp = 222;
  const ifFactor = np / ftp;
  const tss = ((activity.moving_time / 3600) * np * ifFactor) / (ftp * 0.01);

  // HR drift: ratio of second-half avg HR / first-half avg HR
  const half = Math.floor(hr.length / 2);
  const hrDrift =
    hr.length > 0
      ? (hr.slice(half).reduce((a, b) => a + b, 0) / (hr.length - half)) /
        (hr.slice(0, half).reduce((a, b) => a + b, 0) / half)
      : 1;

  // HR & Power zones
  const hrZones = [0.6, 0.7, 0.8, 0.9, 1.0].map((z, i, arr) => ({
    zone: `Z${i + 1}`,
    min: i === 0 ? 0 : arr[i - 1],
    max: z,
  }));
  const powerZones = [0.55, 0.75, 0.9, 1.05, 1.2].map((z, i, arr) => ({
    zone: `Z${i + 1}`,
    min: i === 0 ? 0 : arr[i - 1],
    max: z,
  }));

  const hrZoneDist = hrZones.map((z) => ({
    zone: z.zone,
    percent:
      (hr.filter(
        (h) => h / 200 >= z.min && h / 200 < z.max
      ).length /
        hr.length) *
        100 || 0,
  }));
  const powerZoneDist = powerZones.map((z) => ({
    zone: z.zone,
    percent:
      (watts.filter(
        (w) => w / ftp >= z.min && w / ftp < z.max
      ).length /
        watts.length) *
        100 || 0,
  }));

  return (
    <div className="ride-details" style={{ padding: "1rem" }}>
      <div className="summary-card" style={{ marginBottom: "1rem" }}>
        <h2>{activity.name}</h2>
        <p>
          <strong>Distance:</strong>{" "}
          {(activity.distance / 1609.34).toFixed(1)} mi |{" "}
          <strong>Elevation:</strong> {activity.total_elevation_gain.toFixed(0)} m |{" "}
          <strong>Avg HR:</strong> {activity.average_heartrate?.toFixed(0)} bpm |{" "}
          <strong>Avg Power:</strong> {avgPower.toFixed(0)} W |{" "}
          <strong>NP:</strong> {np.toFixed(0)} W | <strong>IF:</strong>{" "}
          {ifFactor.toFixed(2)} | <strong>TSS:</strong> {tss.toFixed(0)} |{" "}
          <strong>HR Drift:</strong> {(hrDrift - 1).toFixed(2)}
        </p>
      </div>

      <div className="chart-card" style={{ marginBottom: "2rem" }}>
        <h3>Power / Heart Rate / Speed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="t" label={{ value: "Time (min)", position: "insideBottomRight" }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="Power" stroke="#00bcd4" dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="HR" stroke="#f44336" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="Speed" stroke="#ffeb3b" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="zones" style={{ display: "flex", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h3>Power Zone Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={powerZoneDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percent" fill="#00bcd4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Heart Rate Zone Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hrZoneDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percent" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
