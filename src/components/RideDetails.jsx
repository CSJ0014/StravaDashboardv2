import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function metersToMiles(m){ return m / 1609.34 }
function secondsToHMS(s){ const h=Math.floor(s/3600), m=Math.floor((s%3600)/60); return (h? h+'h ': '') + m + 'm' }
function avg(arr){ const n=arr?.length||0; if(!n) return 0; return arr.reduce((a,b)=>a+(b??0),0)/n }
function std(arr){ const m=avg(arr); return Math.sqrt(avg(arr.map(x => (x-m)**2))) }
function rollingMean(arr, win=30){ const out=[]; let sum=0; for(let i=0;i<arr.length;i++){ sum+=arr[i]||0; if(i>=win) sum-=arr[i-win]||0; out.push(sum/Math.min(i+1,win)); } return out }
function normalizedPower(watts){
  if(!watts?.length) return 0
  const r = rollingMean(watts.map(w=>w||0), 30) // 30s rolling mean
  const fourth = avg(r.map(x => Math.pow(x,4)))
  return Math.pow(fourth, 1/4)
}
function hrDrift(time, hr, watts){
  if(!time?.length || !hr?.length) return 0
  const mid = Math.floor(time.length/2)
  const h1 = avg(hr.slice(0, mid)), h2 = avg(hr.slice(mid))
  const w1 = avg(watts?.slice(0, mid) || []), w2 = avg(watts?.slice(mid) || [])
  const ratio1 = w1 ? h1 / w1 : 0, ratio2 = w2 ? h2 / w2 : 0
  if(!ratio1) return 0
  return ((ratio2 - ratio1) / ratio1) * 100
}
function zoneDistribution(watts, ftp=Number(import.meta.env.VITE_DEFAULT_FTP || 222)){
  const zones = [0.56, 0.76, 0.90, 1.05, 1.20] // Coggan-esque boundaries
  const buckets = [0,0,0,0,0,0]
  const total = watts?.length || 0
  if(!total) return { buckets, labels: ['Z1','Z2','Z3','Z4','Z5','Z6'], pct:[0,0,0,0,0,0] }
  for(const w of watts){
    const p = (w||0)/ftp
    let i=0
    if(p<zones[0]) i=0
    else if(p<zones[1]) i=1
    else if(p<zones[2]) i=2
    else if(p<zones[3]) i=3
    else if(p<zones[4]) i=4
    else i=5
    buckets[i]++
  }
  const pct = buckets.map(b => Math.round((b/total)*100))
  return { buckets, labels: ['Z1','Z2','Z3','Z4','Z5','Z6'], pct }
}

export default function RideDetails({ activity, streams }){
  if(!activity) return <div className="card panel empty">Select a ride from the left to see details.</div>

  const distanceMi = (metersToMiles(activity.distance || 0)).toFixed(2)
  const elev = Math.round(activity.total_elevation_gain || 0)
  const hrAvg = Math.round(activity.average_heartrate || 0)
  const pAvg = Math.round(activity.average_watts || 0)
  const moving = secondsToHMS(activity.moving_time || 0)

  const chartData = useMemo(() => {
    if(!streams?.time?.data) return []
    const t = streams.time.data
    const w = streams.watts?.data || []
    const hr = streams.heartrate?.data || []
    const dist = streams.distance?.data || []
    const data = t.map((sec,i) => ({
      t: sec,
      watts: w[i] ?? null,
      hr: hr[i] ?? null,
      miles: dist[i] != null ? (dist[i]/1609.34) : null
    }))
    return data
  }, [streams])

  const np = useMemo(() => normalizedPower(streams?.watts?.data || []), [streams])
  const drift = useMemo(() => hrDrift(streams?.time?.data, streams?.heartrate?.data, streams?.watts?.data), [streams])
  const zones = useMemo(() => zoneDistribution(streams?.watts?.data || []), [streams])

  return (
    <div>
      <div className="stats-row">
        <div className="card stat"><h4>Distance</h4><div>{distanceMi} mi</div></div>
        <div className="card stat"><h4>Elevation</h4><div>{elev} ft</div></div>
        <div className="card stat"><h4>Moving Time</h4><div>{moving}</div></div>
        <div className="card stat"><h4>Avg HR</h4><div>{hrAvg || '—'} bpm</div></div>
        <div className="card stat"><h4>Avg Power</h4><div>{pAvg || '—'} W</div></div>
        <div className="card stat"><h4>Normalized Power</h4><div>{np ? Math.round(np) : '—'} W</div></div>
      </div>

      <div className="card panel" style={{height:360, marginBottom:12}}>
        <h3 style={{marginTop:0}}>Power & Heart Rate</h3>
        <div style={{width:'100%', height:300}}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{left:12, right:12, top:8, bottom:8}}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="t" tickFormatter={(v)=>Math.floor(v/60)+'m'} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="watts" dot={false} strokeWidth={1.5} />
              <Line yAxisId="right" type="monotone" dataKey="hr" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card panel" style={{height:280}}>
        <h3 style={{marginTop:0}}>Zone Distribution</h3>
        <div style={{display:'flex', gap:8}}>
          {zones.labels.map((z, i) => (
            <div key={z} className="card" style={{padding:12, textAlign:'center', flex:1}}>
              <div style={{fontSize:12, color:'var(--muted)'}}>{z}</div>
              <div style={{fontSize:22, fontWeight:700}}>{zones.pct[i]}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
