import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import RideDetails from "./components/RideDetails";

export default function App() {
  const [selectedRide, setSelectedRide] = useState(null);

  return (
    <div className="app" style={{ display: "flex", height: "100vh" }}>
      <Sidebar onSelect={(id) => setSelectedRide(id)} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <RideDetails rideId={selectedRide} />
      </div>
    </div>
  );
}
