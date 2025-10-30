import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RideDetails from "./components/RideDetails";

export default function App() {
  const [rideId, setRideId] = useState(null);

  return (
    <div className="app">
      <Header />
      <Sidebar onSelect={(id) => setRideId(id)} />
      <main className="main">
        <RideDetails rideId={rideId} />
      </main>
    </div>
  );
}
