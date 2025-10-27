import React from 'react'

export default function PdfButton({ activity, streams }){
  const handleDownload = () => {
    if(!activity) return
    const lines = []
    const miles = (activity.distance/1609.34).toFixed(2)
    const elev = Math.round(activity.total_elevation_gain || 0)
    const avgHR = Math.round(activity.average_heartrate || 0)
    const avgW = Math.round(activity.average_watts || 0)
    const np = computeNP(streams?.watts?.data || [])
    const drift = computeDrift(streams?.time?.data, streams?.heartrate?.data, streams?.watts?.data)

    lines.push(`# ${activity.name}`)
    lines.push(`Date: ${activity.start_date_local || activity.start_date}`)
    lines.push('')
    lines.push('== Summary ==')
    lines.push(`Distance: ${miles} mi`)
    lines.push(`Elevation Gain: ${elev} ft`)
    lines.push(`Moving Time (s): ${activity.moving_time}`)
    lines.push(`Avg HR: ${avgHR} bpm`)
    lines.push(`Avg Power: ${avgW} W`)
    lines.push(`Normalized Power: ${np ? Math.round(np) : '—'} W`)
    lines.push(`HR Drift: ${drift ? drift.toFixed(1) : 0}%`)
    lines.push('')
    lines.push('== Notes ==')
    lines.push('- Warm-up quality, first 10 min feel.')
    lines.push('- Cadence strategy.')
    lines.push('- Mid-ride fueling & hydration.')
    lines.push('- Final 15 min execution.')
    const blob = new Blob([lines.join('\n')], {type:'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (activity.name || 'ride') + '_summary.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="button" onClick={handleDownload} disabled={!activity} title="Download text summary">
      Export Summary (.txt)
    </button>
  )
}

function avg(arr){ const n=arr?.length||0; if(!n) return 0; return arr.reduce((a,b)=>a+(b??0),0)/n }
function rollingMean(arr, win=30){ const out=[]; let sum=0; for(let i=0;i<arr.length;i++){ sum+=arr[i]||0; if(i>=win) sum-=arr[i-win]||0; out.push(sum/Math.min(i+1,win)); } return out }
function computeNP(watts){
  if(!watts?.length) return 0
  const r = rollingMean(watts.map(w=>w||0), 30)
  const fourth = avg(r.map(x => Math.pow(x,4)))
  return Math.pow(fourth, 1/4)
}
function computeDrift(time, hr, watts){
  if(!time?.length || !hr?.length) return 0
  const mid = Math.floor(time.length/2)
  const h1 = avg(hr.slice(0, mid)), h2 = avg(hr.slice(mid))
  const w1 = avg(watts?.slice(0, mid) || []), w2 = avg(watts?.slice(mid) || [])
  const ratio1 = w1 ? h1 / w1 : 0, ratio2 = w2 ? h2 / w2 : 0
  if(!ratio1) return 0
  return ((ratio2 - ratio1) / ratio1) * 100
}
