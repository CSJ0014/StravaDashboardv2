import React from "react";

export default function Sidebar({ activities, selectedId, onSelect }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Recent Rides</h2>

      <div className="sidebar-list">
        {activities?.length ? (
          activities.map((a) => (
            <div
              key={a.id}
              className={`ride-item ${
                selectedId === a.id ? "active" : ""
              }`}
              onClick={() => onSelect(a)}
            >
              <div className="ride-name">{a.name}</div>
              <div className="ride-meta">
                {(a.distance / 1609).toFixed(1)} mi —{" "}
                {Math.round(a.moving_time / 60)} min
              </div>
              <div
                className={`ride-type ${
                  a.type === "VirtualRide" ? "virtual" : "ride"
                }`}
              >
                {a.type === "VirtualRide" ? "Virtual" : "Ride"}
              </div>
            </div>
          ))
        ) : (
          <p className="sidebar-empty">Loading activities...</p>
        )}
      </div>
    </aside>
  );
}
