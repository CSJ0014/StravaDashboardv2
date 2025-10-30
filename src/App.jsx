import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import RideDetails from "./components/RideDetails.jsx";
import "./styles.css";

export default function App() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityData, setActivityData] = useState(null);

  // === Load Recent Activities ===
  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/strava/activities?per_page=15");
        const data = await res.json();
        setActivities(data || []);
      } catch (err) {
        console.error("Failed to load activities:", err);
      }
    }
    loadActivities();
  }, []);

  // === Load Selected Activity ===
  const handleSelect = async (activity) => {
    setSelectedActivity(activity);
    try {
      const res = await fetch(`/api/activity/${activity.id}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Normalize the object so RideDetails always receives consistent keys
      setActivityData({
        details: data.activity,
        series: data.streams,
        metrics: {},
        zones: {},
      });
    } catch (err) {
      console.error("Error loading activity details:", err);
      setActivityData(null);
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="main">
        <Sidebar
          activities={activities}
          selectedId={selectedActivity?.id}
          onSelect={handleSelect}
        />
        <div className="content">
          {selectedActivity && activityData ? (
            <RideDetails
              activity={selectedActivity}
              details={activityData.details}
              series={activityData.series}
              metrics={activityData.metrics}
              zones={activityData.zones}
            />
          ) : (
            <div className="card">
              <p>Select a ride from the sidebar to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
