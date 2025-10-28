import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

/* -------------------- Config (override via props if you want) -------------------- */
const DEFAULT_FTP = 222;   // watts
const DEFAULT_MAX_HR = 200;

/* -------------------- Small helpers -------------------- */
const mToMi = (m) => (m ?? 0) / 1609.34;
const mToFt = (m) => (m ?? 0) * 3.28084;
const msToMph = (ms) => (ms ?? 0) * 2.23693629;
const secsToHMS = (s) => {
  const h = Math.floor((s ?? 0) / 3600);
  const m = Math.floor(((s ?? 0) % 3600) / 60);
  return (h ? `${h}h ` : "") + `${m}m`;
};
const avg = (a) =>
  a?.length ? a.reduce((x, y) => x + (y ?? 0), 0) / a.length : 0;

/* Rolling 30s mean → mean of fourth powers → fourth root (Coggan NP) */
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
const normalizedPower = (watts) => {
  if (!watts?.length || watts.length < 30) return 0;
  const roll = rollingMean(watts, 30);
  const mean4 = avg(roll.map((x) => Math.pow(x || 0, 4)));
  return Math.round(Math.pow(mean4, 0.25));
};

/* HR drift (decoupling): % change of HR/W ratio from first half to second half */
const hrDriftPct = (time, hr, watts) => {
  if (!time?.length || !hr?.length || !watts?.length) return 0;
  const n = Math.min(time.length, hr.length, watts.length);
  const mid = Math.floor(n / 2);
  const h1 = avg(hr.slice(0, mid));
  const h2 = avg(hr.slice(mid, n));
  const w1 = avg(watts.slice(0, mid));
  const w2 = avg(watts.slice(mid, n));
  if (!w1 || !w2) return 0;
  const r1 = h1 / w1;
  const r2 = h2 / w2;
  if (!r1) return 0;
  return Math.round(((r2 - r1) / r1) * 1000) / 10; // one decimal
};

/* Zone distributions */
const P_ZONE_THRESH = [0.56, 0.76, 0.9, 1.05, 1.2]; // Coggan Z1–Z6
const H_ZONE_THRESH = [0.6, 0.7, 0.8, 0.9];         // HR Z1–Z5
const labelsP = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"];
const labelsH = ["Z1", "Z2", "Z3", "Z4", "Z5"];

const zoneDist = (arr, thresholds, labels, scale) => {
  if (!arr?.length) return labels.map(() => 0);
  const bins = new Array(labels.length).fill(0);
  for (const v of arr) {
    const r = (v || 0) / scale;
    let i = thresholds.findIndex((t) => r < t);
    if (i === -1) i = labels.length - 1;
    bins[i]++;
  }
  return bins.map((b) => Math.round((b / arr.length) * 100));
};

/* -------------------- Component -------------------- */
export default function RideDetails({
  activity,
  streams,
  ftp = DEFAULT_FTP,
  maxHr = DEFAULT_MAX_HR,
}) {
  if (!activity)
    return (
      <div className="card panel empty">Select a ride from the left to see details.</div>
    );

  // Pick safest stream keys (Strava can send watts or watts_calc, and speed as velocity_smooth)
  const watts = streams?.watts?.data || streams?.watts_calc?.data || [];
  const hr = streams?.heartrate?.data || [];
  const speedMs = streams?.velocity_smooth?.data || []; // m/s
  const time = streams?.time?.data || [];
  const distance = streams?.distance?.data || [];

  /* ---------- Top stats ---------- */
  const distanceMi = mToMi(activity.distance || 0).toFixed(2);
  const elevFt = Math.round(mToFt(activity.total_elevation_gain || 0));
  const moving = secsToHMS(activity.moving_time || 0);
  const pAvg = Math.round(activity.average_watts || avg(watts) || 0);
  const hrAvg = Math.round(activity.average_heartrate || avg(hr) || 0);

  /* ---------- Derived metrics ---------- */
  const np = useMemo(() => normalizedPower(watts), [watts]);
  const IF = useMemo(() => (ftp ? Math.round(((np || 0) / ftp) * 100) / 100 : 0), [np, ftp]);
  const VI = useMemo(
    () => (pAvg ? Math.round(((np || 0) / pAvg) * 100) / 100 : 0),
    [np, pAvg]
  );
  const TSS = useMemo(() => {
    if (!ftp || !activity.moving_time || !np) return 0;
    const secs = activity.moving_time;
    const tss = ((secs * np * IF) / (ftp * 3600)) * 100;
    return Math.round(tss);
  }, [activity.moving_time, np, IF, ftp]);
  const EF = useMemo(
    () => (hrAvg ? Math.round((pAvg / hrAvg) * 100) / 100 : 0),
    [pAvg, hrAvg]
  );
  const drift = useMemo(() => hrDriftPct(time, hr, watts), [time, hr, watts]);

  /* ---------- Zones ---------- */
  const powerPct = useMemo(() => zoneDist(watts, P_ZONE_THRESH, labelsP, ftp), [watts, ftp]);
  const hrPct = useMemo(() => zoneDist(hr, H_ZONE_THRESH, labelsH, maxHr), [hr, maxHr]);

  /* ---------- Chart data ---------- */
  const chartData = useMemo(() => {
    const n = Math.max(time.length, watts.length, hr.length, speedMs.length);
    if (!n) return [];
    const data = [];
    for (let i = 0; i < n; i++) {
      data.push({
        t: time[i] ?? i, // seconds
        watts: watts[i] ?? null,
        hr: hr[i] ?? null,
        mph: speedMs[i] != null ? msToMph(speedMs[i]) : null,
      });
    }
    return data;
  }, [time, watts, hr, speedMs]);

  /* ---------- Debug ---------- */
  const debugInfo = useMemo(() => {
    if (!streams) return "No streams object";
    const keys = Object.keys(streams);
    return keys
      .map((k) => `${k}: ${streams[k]?.data?.length ?? 0}`)
      .join(", ");
  }, [streams]);

  return (
    <div>
      {/* Top metrics row */}
      <div className="stats-row">
        <Stat label="Distance" value={`${distanceMi} mi`} />
        <Stat label="Elevation" value={`${elevFt} ft`} />
        <Stat label="Moving Time" value={moving} />
        <Stat label="Avg HR" value={hrAvg ? `${hrAvg} bpm` : "—"} />
        <Stat label="Avg Power" value={pAvg ? `${pAvg} W` : "—"} />
        <Stat label="Normalized Power" value={np ? `${np} W` : "—"} />
      </div>

      {/* Second metrics row (coach metrics) */}
      <div className="stats-row">
        <Stat label="IF" value={IF || IF === 0 ? IF.toFixed(2) : "—"} />
        <Stat label="TSS" value={TSS || TSS === 0 ? TSS : "—"} />
        <Stat label="VI" value={VI || VI === 0 ? VI.toFixed(2) : "—"} />
        <Stat label="EF (P/HR)" value={EF || EF === 0 ? EF.toFixed(2) : "—"} />
        <Stat label="HR Drift" value={`${drift.toFixed(1)}%`} />
        <Stat label="FTP / MaxHR" value={`${ftp} W / ${maxHr} bpm`} />
      </div>

      {/* Power + HR + Speed chart */}
      <div className="card panel" style={{ height: 380, marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Power · Heart Rate · Speed</h3>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ left: 12, right: 18, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="t"
                tickFormatter={(v) => Math.floor((v || 0) / 60) + "m"}
              />
              {/* Left axis: Watts */}
              <YAxis yAxisId="watts" />
              {/* Right axis #1: Heart rate */}
              <YAxis yAxisId="hr" orientation="right" />
              {/* Right axis #2: Speed (hidden ticks, shown in Tooltip/Legend) */}
              <YAxis yAxisId="mph" orientation="right" hide />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="watts"
                type="monotone"
                dataKey="watts"
                name="Power (W)"
                stroke="#4cc9f0"
                dot={false}
                strokeWidth={1.6}
              />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="hr"
                name="HR (bpm)"
                stroke="#f72585"
                dot={false}
                strokeWidth={1.4}
              />
              <Line
                yAxisId="mph"
                type="monotone"
                dataKey="mph"
                name="Speed (mph)"
                stroke="#7dd56f"
                dot={false}
                strokeWidth={1.4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zones side-by-side */}
      <div
        className="card panel"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        <ZoneGrid
          title="Power Zones"
          labels={labelsP}
          pct={powerPct}
          colors={["#3a86ff", "#4cc9f0", "#06d6a0", "#ffd166", "#ef476f", "#ff006e"]}
        />
        <ZoneGrid
          title="HR Zones"
          labels={labelsH}
          pct={hrPct}
          colors={["#56ccf2", "#4bc0c8", "#a17fe0", "#f093fb", "#f5576c"]}
        />
      </div>

      {/* Debug card */}
      <div
        className="card panel"
        style={{ marginTop: 16, background: "rgba(255,255,255,0.05)", color: "#ccc" }}
      >
        <h4 style={{ margin: "4px 0 8px" }}>Debug Info</h4>
        <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{debugInfo}</div>
      </div>
    </div>
  );
}

/* -------------------- Small presentational pieces -------------------- */
function Stat({ label, value }) {
  return (
    <div className="card stat">
      <h4>{label}</h4>
      <div>{value}</div>
    </div>
  );
}

function ZoneGrid({ title, labels, pct, colors }) {
  const sum = pct.reduce((a, b) => a + b, 0);
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {sum === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 14 }}>No data available</div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          {labels.map((z, i) => (
            <div
              key={z}
              className="card"
              style={{
                flex: 1,
                padding: 14,
                textAlign: "center",
                color: "white",
                background: colors[i],
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.85 }}>{z}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{pct[i]}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
