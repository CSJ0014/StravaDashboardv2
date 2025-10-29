import React, { useEffect, useState } from "react";

export default function Sidebar({ onSelect }) {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    fetch("/api/strava/activities")
      .then((r) => r.json())
      .then(setRides)
      .catch((err) => console.error("Failed to fetch rides:", err));
  }, []);

  return (
    <div
      style={{
        width: "300px",
        background: "#111",
        color: "#fff",
        overflowY: "auto",
        padding: "1rem",
      }}
    >
      <h2>Recent Rides</h2>
      {rides.map((ride) => (
        <div
          key={ride.id}
          onClick={() => onSelect(ride.id)}
          style={{
            padding: "0.5rem",
            margin: "0.5rem 0",
            border: "1px solid #333",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <strong>{ride.name}</strong>
          <p style={{ margin: 0, fontSize: "0.8rem" }}>
            {(ride.distance / 1609.34).toFixed(1)} mi —{" "}
            {Math.round(ride.moving_time / 60)} min
          </p>
        </div>
      ))}
    </div>
  );
}
