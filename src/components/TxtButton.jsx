import React from "react";

export default function TxtButton({ rideData }) {
  const handleExport = () => {
    if (!rideData || !rideData.activity || !rideData.streams) {
      alert("No ride data available for export.");
      return;
    }

    const { activity, streams } = rideData;
    const time = streams?.time?.data || [];
    const watts = streams?.watts?.data || [];
    const hr = streams?.heartrate?.data || [];
    const speed = streams?.velocity_smooth?.data || [];
    const cadence = streams?.cadence?.data || [];
    const distance = streams?.distance?.data || [];

    // --- Compute summary metrics ---
    const ftp = 222;
    const np =
      watts.length > 0
        ? Math.pow(
            watts
              .map((_, i, arr) => {
                const window = arr.slice(Math.max(0, i - 30), i);
                const avg =
                  window.reduce((a, b) => a + b, 0) / (window.length || 1);
                return Math.pow(avg, 4);
              })
              .reduce((a, b) => a + b, 0) / watts.length,
            0.25
          )
        : 0;

    const avgPower = activity.average_watts || 0;
    const avgHR = activity.average_heartrate || 0;
    const IF = np && ftp ? np / ftp : 0;
    const VI = avgPower ? np / avgPower : 0;
    const durationHrs = (activity.moving_time || 0) / 3600;
    const TSS = durationHrs * IF * IF * 100;
    const EF = avgHR ? avgPower / avgHR : 0;

    // --- Build text file content ---
    let output = "";
    output += `Ride Summary: ${activity.name}\n`;
    output += `Date: ${new Date(activity.start_date_local).toLocaleString()}\n`;
    output += `Distance: ${(activity.distance / 1609.34).toFixed(2)} mi\n`;
    output += `Elevation Gain: ${(activity.total_elevation_gain * 3.28084).toFixed(0)} ft\n`;
    output += `Duration: ${(activity.moving_time / 60).toFixed(0)} min\n`;
    output += `Avg Power: ${avgPower.toFixed(0)} W\n`;
    output += `NP: ${np.toFixed(0)} W\n`;
    output += `IF: ${IF.toFixed(2)}\n`;
    output += `VI: ${VI.toFixed(2)}\n`;
    output += `TSS: ${TSS.toFixed(0)}\n`;
    output += `Avg HR: ${avgHR.toFixed(0)} bpm\n`;
    output += `EF (P/HR): ${EF.toFixed(2)}\n`;
    output += `\n--- Stream Data ---\n`;
    output += `time(s),power(W),heartrate(bpm),speed(mph),cadence(rpm),distance(mi)\n`;

    for (let i = 0; i < time.length; i++) {
      const line = [
        time[i] || 0,
        watts[i] || "",
        hr[i] || "",
        ((speed[i] || 0) * 2.23694).toFixed(2),
        cadence[i] || "",
        ((distance[i] || 0) / 1609.34).toFixed(3),
      ].join(",");
      output += line + "\n";
    }

    // --- Create and download file ---
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activity.name.replace(/[^\w\s-]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      style={{
        backgroundColor: "#1e1e1e",
        color: "white",
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1px solid #444",
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      Export Summary (.txt)
    </button>
  );
}
