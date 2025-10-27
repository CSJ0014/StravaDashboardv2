import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

// ---------- Helper utilities ----------
const toMiles = m => (m ?? 0) / 1609.34;
const toFeet = m => (m ?? 0) * 3.28084;
const toHMS = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return (h ? `${h}h ` : "") + `${m}m`;
};
const avg = a => (a?.length ? a.reduce((x, y) => x + (y || 0), 0) / a.length : 0);

// rolling 30s mean → normalized power
const rollingMean = (arr, win = 30) => {
  if (!arr?.length) return [];
  const out = new Array(arr.length);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i] || 0;
    if (i >= win) sum -= arr[i - win] || 0;
    out[i] = sum / Math.min(i + 1, win);
  }
  return out;
};
const normalizedPower = watts => {
  if (!watts?.length) return 0;
  const roll = rollingMean(watts, 30);
  const mean4 = avg(roll.map(x => Math.pow(x || 0, 4)));
  return Math.pow(mean4, 0.25);
};

// zone helpers
const powerZones = [0.56, 0.76, 0.90, 1.05, 1.20]; // Coggan
const hrZones = [0.60, 0.70, 0.80, 0.90];
const labelsP = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"];
const labelsH = ["Z1", "Z2", "Z3", "Z4", "Z5"];

const zoneDist = (arr, zones, labels, scale) => {
  if (!arr?.length) return labels.map(() => 0);
  const bins = new Array(labels.length).fill(0);
  for (const v of arr) {
    const ratio = (v || 0) / scale;
    let i = zones.findIndex(z => ratio < z);
    if (i === -1) i = labels.length - 1;
    bins[i]++;
  }
  return bins.map(b => Math.round((b / arr.length) * 100));
};

// ---------- Component ----------
export default function RideDetails({ activity, streams }) {
  if (!activity)
    return <div className="card panel empty">Select a ride from the left to see details.</div>;

  // choose correct keys
  const watts = streams?.watts?.data || streams?.watts_calc?.data || [];
  const hr = streams?.heartrate?.data || [];
  const time = streams?.time?.data || [];
  const dist = streams?.distance?.data || [];

  const np = useMemo(() => Math.round(normalizedPower(watts)), [watts]);
  const powerPct = useMemo(() => zoneDist(watts, powerZones, labelsP, 222), [watts]);
  const hrPct = useMemo(() => zoneDist(hr, hrZones, labelsH, 200), [hr]);

  const chartData = useMemo(() => {
    if (!time.length) return [];
    return time.map((t, i) => ({
      t,
      watts: watts[i] ?? null,
      hr: hr[i] ?? null
    }));
  }, [time, watts, hr]);

  return (
    <div>
      <div className="stats-row">
        <div className="card stat"><h4>Distance</h4><div>{toMiles(activity.distance).toFixed(2)} mi</div></div>
        <div className="card stat"><h4>Elevation</h4><div>{Math.round(toFeet(activity.total_elevation_gain))} ft</div></div>
        <div className="card stat"><h4>Moving Time</h4><div>{toHMS(activity.moving_time)}</div></div>
        <div className="card stat"><h4>Avg HR</h4><div>{Math.round(activity.average_heartrate || 0) || "—"} bpm</div></div>
        <div className="card stat"><h4>Avg Power</h4><div>{Math.round(activity.average_watts || 0) || "—"} W</div></div>
        <div className="card stat"><h4>Normalized Power</h4><div>{np || "—"} W</div></div>
      </div>

      <div className="card panel" style={{ height: 360, marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Power & Heart Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" tickFormatter={v => Math.floor(v / 60) + " m"} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="watts" stroke="#4cc9f0" dot={false} strokeWidth={1.4} />
            <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#f72585" dot={false} strokeWidth={1.4} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card panel" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch"
      }}>
        <ZoneGrid title="Power Zones" labels={labelsP} pct={powerPct}
          colors={["#3a86ff", "#4cc9f0", "#06d6a0", "#ffd166", "#ef476f", "#ff006e"]} />
        <ZoneGrid title="HR Zones" labels={labelsH} pct={hrPct}
          colors={["#56ccf2", "#4bc0c8", "#c779d0", "#f093fb", "#f5576c"]} />
      </div>
    </div>
  );
}

// ---------- ZoneGrid subcomponent ----------
function ZoneGrid({ title, labels, pct, colors }) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "flex", gap: 8 }}>
        {labels.map((z, i) => (
          <div key={z}
            className="card"
            style={{
              flex: 1,
              padding: 14,
              textAlign: "center",
              color: "white",
              background: colors[i],
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              transition: "transform .2s",
            }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{z}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{pct[i]}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
