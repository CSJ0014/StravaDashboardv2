import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TxtButton from "./TxtButton.jsx";
import "../styles.css";

export default function RideDetails({ activity, details, series }) {
  if (!activity || !details) {
    return (
      <div className="card">
        <p>Select a ride from the sidebar to view details.</p>
      </div>
    );
  }

  // === Compute metrics ===
  const distance = (details.distance / 1609).toFixed(1);
  const avgPower = details.average_watts || "-";
  const np = details.weighted_average_watts || "-";
  const hr = details.average_heartrate || "-";
  const elev = details.total_elevation_gain?.toFixed(0) || "-";

  // === Format data streams ===
  const streamData = [];
  if (series?.time?.data && series?.watts?.data) {
    for (let i = 0; i < series.time.data.length; i++) {
      streamData.push({
        time: i,
        watts: series.watts.data[i],
        hr: series.heartrate?.data?.[i] || null,
        speed: series.velocity_smooth?.data?.[i]
          ? series.velocity_smooth.data[i] * 2.23694
          : null, // convert m/s to mph
      });
    }
  }

  return (
    <div className="content">
      {/* === Metrics Summary === */}
      <div className="metrics">
        <div className="metric">
          <h3>Distance</h3>
          <p>{distance} mi</p>
        </div>
        <div className="metric">
          <h3>Elevation Gain</h3>
          <p>{elev} ft</p>
        </div>
        <div className="metric">
          <h3>Avg Power</h3>
          <p>{avgPower} W</p>
        </div>
        <div className="metric">
          <h3>Normalized Power</h3>
          <p>{np} W</p>
        </div>
        <div className="metric">
          <h3>Avg HR</h3>
          <p>{hr} bpm</p>
        </div>
      </div>

      {/* === Chart Section === */}
      <div className="card chart-container">
        <h3 style={{ marginBottom: "12px", color: "#aeb9e1" }}>
          Power, HR & Speed Over Time
        </h3>
        {streamData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={streamData}>
              <XAxis dataKey="time" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="watts"
                stroke="#6c72ff"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="hr"
                stroke="#ff5a65"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#57c3ff"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No stream data available for this ride.</p>
        )}
      </div>

      {/* === Export Button === */}
      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <TxtButton activity={details} />
      </div>
    </div>
  );
}
