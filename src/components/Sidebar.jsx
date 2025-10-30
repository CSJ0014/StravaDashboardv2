import React from "react";
import "../styles.css";

export default function Sidebar({ activities, selectedId, onSelect }) {
  return (
    <aside className="sidebar">
      <h2>Recent Rides</h2>
      {activities.length === 0 ? (
        <p>Loading activities...</p>
      ) : (
        activities.map((a) => {
          const isActive = selectedId === a.id;
          const distanceMiles = (a.distance / 1609).toFixed(1);
          const date = new Date(a.start_date_local).toLocaleDateString();
          const type = a.type === "VirtualRide" ? "Virtual" : a.type;

          return (
            <button
              key={a.id}
              className={isActive ? "active" : ""}
              onClick={() => onSelect(a)}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>{a.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {date} • {distanceMiles} mi
              </div>
              <div
                style={{
                  fontSize: 12,
                  color:
                    a.type === "VirtualRide"
                      ? "#57c3ff"
                      : a.type === "Ride"
                      ? "#14ca74"
                      : "#fdb52a",
                  fontWeight: 500,
                }}
              >
                {type}
              </div>
            </button>
          );
        })
      )}
    </aside>
  );
}
