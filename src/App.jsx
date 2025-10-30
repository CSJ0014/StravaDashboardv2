import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RideDetails from "./components/RideDetails";
import { getActivities, getActivityStreams } from "./api/strava";

export default function App() {
  const [activities, setActivities] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null); // can be id or object
  const [rideData, setRideData] = useState(null);

  // Load recent activities on mount
  useEffect(() => {
    getActivities().then(setActivities).catch(console.error);
  }, []);

  // Normalize to a full activity object for the UI
  const selectedActivity = useMemo(() => {
    if (!selectedRide) return null;
    return typeof selectedRide === "object"
      ? selectedRide
      : activities.find((a) => a.id === selectedRide) || null;
  }, [selectedRide, activities]);

  // Fetch streams when we have an id
  useEffect(() => {
    const id =
      typeof selectedRide === "object" ? selectedRide?.id : selectedRide;
    if (!id) return;
    getActivityStreams(id)
      .then((data) => setRideData(data))
      .catch(console.error);
  }, [selectedRide]);

  return (
    <div className="app">
      <Header />
      <Sidebar onSelect={setSelectedRide} />
      <main className="main">
        <RideDetails
          activity={selectedActivity}
          streams={rideData?.streams || {}}
        />
      </main>
    </div>
  );
}
