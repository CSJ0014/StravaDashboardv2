import React, { useEffect, useState } from "react";

export default function Sidebar({ onSelect }) {
  const [rides, setRides] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetch("/api/strava/activities")
      .then((r) => r.json())
      .then((data) => setRides(Array.isArray(data) ? data.slice(0, 15) : []))
      .catch((err) => console.error("Failed to fetch rides:", err));
  }, []);

  const chipClass = (type) =>
    type === "Ride" ? "chip ride" :
    type === "GravelRide" ? "chip gravel" :
    "chip virtual";

  return (
    <aside className="sidebar">
      <h2 style={{ margin: 0 }}>Recent Rides</h2>
      {rides.map((ride) => (
        <div
          key={ride.id}
          className={`card ride-item ${activeId === ride.id ? "active" : ""}`}
          onClick={() => { setActiveId(ride.id); onSelect(ride.id); }}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="ride-title">{ride.name}</div>
            <div className="ride-meta">
              {(ride.distance / 1609.34).toFixed(1)} mi — {Math.round(ride.moving_time / 60)} min
            </div>
          </div>
          <div className="chips">
            <span className={chipClass(ride.type)}>
              {ride.type === "VirtualRide" ? "Virtual" : ride.type === "GravelRide" ? "Gravel" : "Ride"}
            </span>
          </div>
        </div>
      ))}
    </aside>
  );
}
