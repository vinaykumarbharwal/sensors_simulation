import { useMemo, useState } from 'react'
import type { SensorReading } from '../types/api'
import { ExportButton } from './ExportButton'

interface SensorReadingsPanelProps {
  readings: SensorReading[]
}

const sensorConfig: Record<string, { icon: string; color: string }> = {
  THERMAL:  { icon: '🌡️', color: 'var(--status-warning)' },
  SMOKE:    { icon: '💨', color: 'var(--status-inactive)' },
  HUMIDITY: { icon: '💧', color: 'var(--accent-primary)' },
}

function statusStyle(s: string) {
  if (s === 'DANGER' || s === 'CRITICAL') return 'bg-status-critical/10 text-status-critical'
  if (s === 'WARNING') return 'bg-status-warning/10 text-status-warning'
  return 'bg-status-safe/10 text-status-safe'
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-4 w-12" />
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 60
  const height = 16
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function SensorReadingsPanel({ readings }: SensorReadingsPanelProps) {
  const [sensorTypeFilter, setSensorTypeFilter] = useState<'ALL' | 'THERMAL' | 'SMOKE' | 'HUMIDITY'>('ALL')
  const [zoneQuery, setZoneQuery] = useState('')

  // Group readings by sensorId to get historical trends
  const sensorTrends = useMemo(() => {
    const trends: Record<string, number[]> = {}
    // Process in reverse (oldest to newest) for sparkline
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    sorted.forEach(r => {
      if (!trends[r.sensorId]) trends[r.sensorId] = []
      trends[r.sensorId].push(r.value)
      if (trends[r.sensorId].length > 10) trends[r.sensorId].shift()
    })
    return trends
  }, [readings])

  const filtered = useMemo(() => {
    return readings
      .filter((r) => sensorTypeFilter === 'ALL' || r.sensorType === sensorTypeFilter)
      .filter((r) => r.zone.toLowerCase().includes(zoneQuery.trim().toLowerCase()))
      .slice(0, 30)
  }, [readings, sensorTypeFilter, zoneQuery])

  return (
    <section className="zone-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="heading-caps mb-1">Telemetry Stream</p>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Live Sensor Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} filename={`sensor-log-${new Date().toISOString().slice(0,10)}.csv`} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 p-3 rounded-xl border border-border-subtle bg-bg-canvas/50 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'THERMAL', 'SMOKE', 'HUMIDITY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSensorTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all ${
                sensorTypeFilter === type
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-white text-text-secondary border border-border-subtle hover:border-accent-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Filter zone..."
          value={zoneQuery}
          onChange={(e) => setZoneQuery(e.target.value)}
          className="flex-1 rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary transition-all sm:max-w-[200px]"
        />
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto border border-border-subtle rounded-xl custom-scrollbar">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-border-subtle bg-bg-canvas/95 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 heading-caps">Type</th>
              <th className="px-4 py-3 heading-caps">Zone</th>
              <th className="px-4 py-3 heading-caps">Trend</th>
              <th className="px-4 py-3 heading-caps">Value</th>
              <th className="px-4 py-3 heading-caps">Status</th>
              <th className="px-4 py-3 heading-caps hidden md:table-cell">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filtered.map((r) => {
              const cfg = sensorConfig[r.sensorType]
              const fillPct = Math.min(100, (r.value / r.dangerThreshold) * 100)
              const trend = sensorTrends[r.sensorId] || []

              return (
                <tr key={`${r.sensorId}-${r.timestamp}`} className="hover:bg-bg-canvas/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-bold text-text-primary">
                      <span>{cfg?.icon}</span>
                      <span>{r.sensorType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">{r.zone}</td>
                  <td className="px-4 py-3">
                    <Sparkline data={trend} color={cfg?.color || 'var(--accent-primary)'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-text-primary text-mono">{r.value.toFixed(1)}</span>
                        <span className="text-[10px] text-text-muted">{r.unit}</span>
                      </div>
                      <div className="h-1 w-16 bg-bg-canvas rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${fillPct}%`, backgroundColor: cfg?.color || 'var(--accent-primary)' }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-mono hidden md:table-cell">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
