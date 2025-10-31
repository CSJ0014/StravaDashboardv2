import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import RideDetails from "./components/RideDetails.jsx";
import "./styles.css";

export default function App() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [streams, setStreams] = useState(null);
  const [loading, setLoading] = useState(true);

// === FETCH RECENT ACTIVITIES ===
useEffect(() => {
  async function loadActivities() {
    try {
      const res = await fetch("/api/strava/activities?per_page=15");
      const text = await res.text();

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);

      const data = JSON.parse(text);
      console.log("Fetched activities:", data);

      // Handle both array and wrapped formats
      setActivities(data.activities || data || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }

  loadActivities(); // 👈 move this call *after* the async function definition
}, []); // 👈 this closing brace was missing in your snippet

  // === LOAD SELECTED ACTIVITY DETAILS ===
  const loadActivityDetails = async (activity) => {
    setSelectedActivity(activity);
    setStreams(null);
    try {
      const res = await fetch(`/api/strava/activity?id=${activity.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("Fetched activity details:", data);

      // Save combined activity + streams data
      setStreams(data.streams || {});
    } catch (err) {
      console.error("Error loading activity details:", err);
    }
  };

  return (
    <div className="app">
      {/* === TOP HEADER === */}
      <Header />

      {/* === MAIN SECTION === */}
      <div className="main">
        {/* === SIDEBAR === */}
        <Sidebar
          activities={activities}
          selectedId={selectedActivity?.id}
          onSelect={loadActivityDetails}
          loading={loading}
        />

        {/* === DASHBOARD CONTENT === */}
        <div className="content">
          <RideDetails
            activity={selectedActivity}
            streams={streams}
          />
        </div>
      </div>
    </div>
  );
}
