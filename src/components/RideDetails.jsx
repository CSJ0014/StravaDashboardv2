import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RideDetails from "./components/RideDetails";

export default function App() {
  const [selectedRide, setSelectedRide] = useState(null);

  return (
    <div className="app">
      <Header />
      <Sidebar onSelect={(id) => setSelectedRide(id)} />
      <main className="main">
        <RideDetails selectedRide={selectedRide} />
      </main>
    </div>
  );
}
