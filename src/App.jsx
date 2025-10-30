import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RideDetails from "./components/RideDetails";
import { getActivities, getActivityStreams } from "./api/strava";

export default function App() {
  const [activities, setActivities] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideData, setRideData] = useState(null);

  // Load recent activities
  useEffect(() => {
    getActivities().then(setActivities).catch(console.error);
  }, []);

  // Load selected ride streams
  useEffect(() => {
    if (!selectedRide) return;
    getActivityStreams(selectedRide.id)
      .then((data) => setRideData(data))
      .catch(console.error);
  }, [selectedRide]);

  return (
    <div className="app">
      <Header />
      <Sidebar rides={activities} onSelect={setSelectedRide} />
      <main className="main">
        <RideDetails activity={selectedRide} streams={rideData?.streams || {}} />
      </main>
    </div>
  );
}
