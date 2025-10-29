import React, { useEffect, useState } from "react";

export default function RideDetails({ rideId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!rideId) return;
    console.log("Fetching activity for ride ID:", rideId);
    fetch(`/api/strava/activity?id=${rideId}`)
      .then((r) => r.json())
      .then((json) => {
        console.log("✅ Ride details fetched:", json);
        setData(json);
      })
      .catch((e) => console.error("Error fetching ride:", e));
  }, [rideId]);

  if (!rideId)
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Ride Dashboard</h2>
        <p>Select a ride to view details</p>
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
      <div style={{ padding: "2rem" }}>
        <p>⚠️ Error: {data.error}</p>
      </div>
    );

  const { activity, streams } = data;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{activity?.name || "Ride Details"}</h2>
      <p>
        <strong>Distance:</strong>{" "}
        {(activity?.distance / 1609.34).toFixed(1)} mi |{" "}
        <strong>Elevation:</strong>{" "}
        {activity?.total_elevation_gain?.toFixed(0)} ft
      </p>

      {streams ? (
        <>
          <p>✅ Streams loaded: {Object.keys(streams).join(", ")}</p>
        </>
      ) : (
        <p>⚠️ No streams found in response</p>
      )}
    </div>
  );
}
