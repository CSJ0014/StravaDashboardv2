import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function metersToMiles(m) {
  return m / 1609.34;
}
function secondsToHMS(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return (h ? h + "h " : "") + m + "m";
}
function avg(arr) {
  const n = arr?.length || 0;
  if (!n) return 0;
  return arr.reduce((a, b) => a + (b ?? 0), 0) / n;
}
function rollingMean(arr, win = 30) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i] || 0;
    if (i >= win) sum -= arr[i - win] || 0;
    out.push(sum / Math.min(i + 1, win));
  }
  return out;
}
function normalizedPower(watts) {
  if (!watts?.length) return 0;
  const r = rollingMean(watts.map((w) => w || 0), 30);
  const fourth = avg(r.map((x) => Math.pow(x, 4)));
  return Math.pow(fourth, 1 / 4);
}
function hrDrift(time, hr, watts) {
  if (!time?.length || !hr?.length) return 0;
  const mid = Math.floor(time.length / 2);
  const h1 = avg(hr.slice(0, mid)),
    h2 = avg(hr.slice(mid));
  const w1 = avg(watts?.slice(0, mid) || []),
    w2 = avg(watts?.slice(mid) || []);
  const ratio1 = w1 ? h1 / w1 : 0,
    ratio2 = w2 ? h2 / w2 : 0;
  if (!ratio1) return 0;
  return ((ratio2 - ratio1) / ratio1) * 100;
}

function zoneDistributionPower(watts, ftp = 222) {
  const zones = [0.56, 0.76, 0.90, 1.05, 1.20];
  const labels = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"];
  const buckets = [0, 0, 0, 0, 0, 0];
  const total = watts?.length || 0;
  if (!total) return { labels, pct: [0, 0, 0, 0, 0, 0] };
  for (const w of watts) {
    const p = (w || 0) / ftp;
    let i = zones.findIndex((z) => p < z);
    if (i === -1) i = 5;
    buckets[i]++;
  }
  const pct = buckets.map((b) => Math.round((b / total) * 100));
  return { labels, pct };
}

function zoneDistributionHR(hr, maxHR = 200) {
  const zones = [0.6, 0.7, 0.8, 0.9];
  const labels = ["Z1", "Z2", "Z3", "Z4", "Z5"];
  const buckets = [0, 0, 0, 0, 0];
  const total = hr?.length || 0;
  if (!total) return { labels, pct: [0, 0, 0, 0, 0] };
  for (const h of hr) {
    const p = (h || 0) / maxHR;
    let i = zones.findIndex((z) => p < z);
    if (i === -1) i = 4;
    buckets[i]++;
  }
  const pct = buckets.map((b) => Math.round((b / total) * 100));
  return { labels, pct };
}

// gradient helper arrays
const powerZoneColors = [
  "linear-gradient(135deg,#3a86ff,#4cc9f0)",
  "linear-gradient(135deg,#4cc9f0,#90f1ef)",
  "linear-gradient(135deg,#00f5d4,#06d6a0)",
  "linear-gradient(135deg,#ffd166,#ef476f)",
  "linear-gradient(135deg,#ef476f,#ff006e)",
  "linear-gradient(135deg,#ff006e,#ff5400)",
];

const hrZoneColors = [
  "linear-gradient(135deg,#56ccf2,#2f80ed)",
  "linear-gradient(135deg,#4bc0c8,#c779d0)",
  "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#fbc2eb,#a6c1ee)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
];

export default function RideDetails({ activity, streams }) {
  if (!activity)
    return (
      <div className="card panel empty">
        Select a ride from the left to see details.
      </div>
    );

  const distanceMi = metersToMiles(activity.distance || 0).toFixed(2);
  const elev = Math.round(activity.total_elevation_gain || 0);
  const hrAvg = Math.round(activity.average_heartrate || 0);
  const pAvg = Math.round(activity.average_watts || 0);
  const moving = secondsToHMS(activity.moving_time || 0);

  const chartData = useMemo(() => {
    if (!streams?.time?.data) return [];
    const t = streams.time.data;
    const w = streams.watts?.data || [];
    const hr = streams.heartrate?.data || [];
    const dist = streams.distance?.data || [];
    return t.map((sec, i) => ({
      t: sec,
      watts: w[i] ?? null,
      hr: hr[i] ?? null,
      miles: dist[i] != null ? dist[i] / 1609.34 : null,
    }));
  }, [streams]);

  const np = useMemo(
    () =>
      streams?.watts?.data?.length
        ? normalizedPower(streams.watts.data)
        : 0,
    [streams]
  );

  const zonesPower = useMemo(
    () => zoneDistributionPower(streams?.watts?.data || []),
    [streams]
  );
  const zonesHR = useMemo(
    () => zoneDistributionHR(streams?.heartrate?.data || []),
    [streams]
  );

  return (
    <div>
      <div className="stats-row">
        <div className="card stat"><h4>Distance</h4><div>{distanceMi} mi</div></div>
        <div className="card stat"><h4>Elevation</h4><div>{elev} ft</div></div>
        <div className="card stat"><h4>Moving Time</h4><div>{moving}</div></div>
        <div className="card stat"><h4>Avg HR</h4><div>{hrAvg || "—"} bpm</div></div>
        <div className="card stat"><h4>Avg Power</h4><div>{pAvg || "—"} W</div></div>
        <div className="card stat"><h4>Normalized Power</h4><div>{np ? Math.round(np) : "—"} W</div></div>
      </div>

      <div className="card panel" style={{ height: 360, marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Power &amp; Heart Rate</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="t" tickFormatter={(v) => Math.floor(v / 60) + "m"} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="watts" stroke="#8ef0ff" dot={false} strokeWidth={1.5} />
              <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#a779ff" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="card panel"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        <div>
          <h3 style={{ marginTop: 0 }}>Power Zones</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {zonesPower.labels.map((z, i) => (
              <div
                key={z}
                className="card"
                style={{
                  flex: 1,
                  padding: 14,
                  textAlign: "center",
                  color: "white",
                  background: powerZoneColors[i],
                  boxShadow: "0 0 12px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>{z}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {zonesPower.pct[i]}%
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>HR Zones</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {zonesHR.labels.map((z, i) => (
              <div
                key={z}
                className="card"
                style={{
                  flex: 1,
                  padding: 14,
                  textAlign: "center",
                  color: "white",
                  background: hrZoneColors[i],
                  boxShadow: "0 0 12px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>{z}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {zonesHR.pct[i]}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
