import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function RideDetails({ selectedRide }) {
  const [activity, setActivity] = useState(null);
  const [streams, setStreams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedRide) return;
    setLoading(true);
    setError("");

    fetch(`/api/strava/activity?id=${selectedRide.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setActivity(data.activity);
        setStreams(data.streams);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedRide]);

  if (!selectedRide)
    return (
      <div className="p-6 text-gray-400 text-lg">
        Select a ride to view details
      </div>
    );

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (error)
    return (
      <div className="p-6 text-red-400">
        Error loading activity: {error}
      </div>
    );

  if (!activity || !streams)
    return (
      <div className="p-6 text-gray-400">
        No data available for this activity.
      </div>
    );

  // Prepare data for charts
  const time = streams.time?.data || [];
  const watts = streams.watts?.data || [];
  const hr = streams.heartrate?.data || [];
  const speed = streams.velocity_smooth?.data || [];
  const chartData = time.map((t, i) => ({
    time: t,
    watts: watts[i] || 0,
    hr: hr[i] || 0,
    speed: speed[i] ? (speed[i] * 2.23694).toFixed(1) : 0, // m/s → mph
  }));

  const avgPower = activity.average_watts?.toFixed(0);
  const avgHR = activity.average_heartrate?.toFixed(0);
  const distance = (activity.distance / 1609.34).toFixed(2);
  const elevation = activity.total_elevation_gain.toFixed(0);
  const movingTime = Math.round(activity.moving_time / 60);

  return (
    <div className="p-6 space-y-6 text-gray-200">
      <h2 className="text-2xl font-semibold mb-2">
        {activity.name}
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {[
          { label: "Distance", value: `${distance} mi` },
          { label: "Elevation", value: `${elevation} ft` },
          { label: "Moving Time", value: `${movingTime} min` },
          { label: "Avg HR", value: `${avgHR} bpm` },
          { label: "Avg Power", value: `${avgPower} W` },
          { label: "Normalized Power", value: `${activity.weighted_average_watts || "--"} W` },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#1c1d20] rounded-2xl p-4 text-center shadow-md border border-gray-700/50"
          >
            <div className="text-sm text-gray-400">{m.label}</div>
            <div className="text-xl font-semibold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Power / HR / Speed Chart */}
      <div className="bg-[#1c1d20] p-6 rounded-2xl shadow-md border border-gray-700/50">
        <h3 className="text-lg font-medium mb-3 text-gray-300">
          Power • Heart Rate • Speed
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={false} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="watts"
                stroke="#4FC3F7"
                strokeWidth={2}
                dot={false}
                name="Power (W)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hr"
                stroke="#F06292"
                strokeWidth={1.8}
                dot={false}
                name="Heart Rate (bpm)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="speed"
                stroke="#81C784"
                strokeWidth={1.8}
                dot={false}
                name="Speed (mph)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 text-sm">
            No stream data available.
          </div>
        )}
      </div>

      {/* Power & HR Zones */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1c1d20] p-4 rounded-2xl border border-gray-700/50 shadow-md">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Power Zones</h3>
          <div className="text-gray-500 text-sm">
            {streams.watts ? "Power data loaded" : "No data available"}
          </div>
        </div>
        <div className="bg-[#1c1d20] p-4 rounded-2xl border border-gray-700/50 shadow-md">
          <h3 className="text-lg font-medium text-gray-300 mb-2">HR Zones</h3>
          <div className="text-gray-500 text-sm">
            {streams.heartrate ? "Heart rate data loaded" : "No data available"}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-600 pt-4 border-t border-gray-700/30">
        Data via Strava API • {chartData.length} samples loaded
      </div>
    </div>
  );
}
