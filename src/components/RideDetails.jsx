import React, { useEffect, useState } from "react";

export default function RideDetails({ rideId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId) return;
    console.log("🛰️ Fetching ride details for ID:", rideId);

    fetch(`/api/strava/activity?id=${rideId}`)
      .then((r) => r.json())
      .then((json) => {
        console.log("✅ API response:", json);
        setData(json);
      })
      .catch((e) => {
        console.error("❌ Fetch error:", e);
        setError(e.message);
      });
  }, [rideId]);

  if (!rideId)
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Ride Dashboard</h2>
        <p>Select a ride to view details</p>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <p>❌ Error loading ride: {error}</p>
      </div>
    );

  if (!data)
    return (
      <div style={{ padding: "2rem" }}>
        <p>Loading ride data...</p>
      </div>
    );

  if (data.error)
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <p>⚠️ API Error: {data.error}</p>
      </div>
    );

  const { activity, streams } = data;

  console.log("🎯 Render data", { activity, streams });

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{activity?.name || "Unnamed Ride"}</h2>
      <p>
        <strong>Distance:</strong> {(activity?.distance / 1609.34).toFixed(2)} mi
        <br />
        <strong>Elevation:</strong> {activity?.total_elevation_gain?.toFixed(0)} ft
        <br />
        <strong>Avg Power:</strong> {activity?.average_watts?.toFixed(0)} W
        <br />
        <strong>Avg HR:</strong> {activity?.average_heartrate?.toFixed(0)} bpm
      </p>

      {streams ? (
        <>
          <p>✅ Streams keys: {Object.keys(streams).join(", ")}</p>
          <p>
            <strong>Watts Samples:</strong> {streams.watts?.data?.length || 0}
            <br />
            <strong>Heart Rate Samples:</strong> {streams.heartrate?.data?.length || 0}
            <br />
            <strong>Speed Samples:</strong> {streams.velocity_smooth?.data?.length || 0}
          </p>
        </>
      ) : (
        <p>⚠️ No streams object found</p>
      )}
    </div>
  );
}
