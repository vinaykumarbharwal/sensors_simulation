import { useMemo, useState } from 'react'
import type { SensorReading } from '../types/api'
import { ExportButton } from './ExportButton'
import { getAuthSession } from '../api/client'

interface SensorReadingsPanelProps {
  readings: SensorReading[]
}

const sensorConfig: Record<string, { icon: string; color: string; label: string }> = {
  THERMAL:  { icon: '🌡️', color: '#F59E0B', label: 'Thermal' },
  SMOKE:    { icon: '💨', color: '#64748B', label: 'Smoke' },
  HUMIDITY: { icon: '💧', color: '#059669', label: 'Humidity' },
}

function statusStyle(s: string): React.CSSProperties {
  if (s === 'DANGER' || s === 'CRITICAL') return { backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }
  if (s === 'WARNING') return { backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
  return { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }
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
  const session = getAuthSession()
  const isEmployee = session?.role.toUpperCase() === 'EMPLOYEE'
  const assignedZone = session?.assignedZone

  // Group readings by sensorId to get historical trends
  const sensorTrends = useMemo(() => {
    const trends: Record<string, number[]> = {}
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
      .filter((r) => {
        if (isEmployee && assignedZone) {
          return r.zone === assignedZone
        }
        return r.zone.toLowerCase().includes(zoneQuery.trim().toLowerCase())
      })
      .slice(0, 30)
  }, [readings, sensorTypeFilter, zoneQuery, isEmployee, assignedZone])

  // Stats
  const stats = useMemo(() => {
    const danger = filtered.filter(r => r.status === 'DANGER' || r.status === 'CRITICAL').length
    const warning = filtered.filter(r => r.status === 'WARNING').length
    const safe = filtered.filter(r => r.status === 'SAFE' || r.status === 'NORMAL').length
    return { danger, warning, safe, total: filtered.length }
  }, [filtered])

  return (
    <section className="zone-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="heading-caps mb-1">Telemetry Stream</p>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0F172A' }}>Live Sensor Feed</h2>
          {isEmployee && assignedZone && (
            <p className="mt-1 text-xs font-semibold" style={{ color: '#059669' }}>
              🔒 Showing readings for <span className="font-black">{assignedZone}</span> zone only
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filtered} filename={`sensor-log-${new Date().toISOString().slice(0,10)}.csv`} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <div className="rounded-lg p-2.5 text-center" style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <p className="text-lg font-black text-mono" style={{ color: '#0F172A' }}>{stats.total}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Total</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ border: '1px solid rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.05)' }}>
          <p className="text-lg font-black text-mono" style={{ color: '#10B981' }}>{stats.safe}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(16,185,129,0.7)' }}>Safe</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ border: '1px solid rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
          <p className="text-lg font-black text-mono" style={{ color: '#F59E0B' }}>{stats.warning}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(245,158,11,0.7)' }}>Warning</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
          <p className="text-lg font-black text-mono" style={{ color: '#EF4444' }}>{stats.danger}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(239,68,68,0.7)' }}>Danger</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 p-3 rounded-xl sm:flex-row sm:items-center" style={{ border: '1px solid #E2E8F0', backgroundColor: 'rgba(248,250,252,0.5)' }}>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'THERMAL', 'SMOKE', 'HUMIDITY'] as const).map((type) => {
            const info = type === 'ALL' ? null : sensorConfig[type]
            const isActive = sensorTypeFilter === type
            return (
              <button
                key={type}
                onClick={() => setSensorTypeFilter(type)}
                className="filter-btn"
                style={isActive ? { backgroundColor: '#059669', color: '#FFFFFF', borderColor: '#059669' } : {}}
              >
                {info && <span>{info.icon}</span>}
                {type === 'ALL' ? '📊 ALL' : info?.label.toUpperCase()}
              </button>
            )
          })}
        </div>
        {!isEmployee && (
          <input
            type="search"
            placeholder="🔍 Filter zone..."
            value={zoneQuery}
            onChange={(e) => setZoneQuery(e.target.value)}
            className="field-input sm:max-w-[200px]"
          />
        )}
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto rounded-xl custom-scrollbar" style={{ border: '1px solid #E2E8F0' }}>
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(4px)' }}>
            <tr>
              <th className="px-4 py-3 heading-caps">Type</th>
              <th className="px-4 py-3 heading-caps">Zone</th>
              <th className="px-4 py-3 heading-caps">Trend</th>
              <th className="px-4 py-3 heading-caps">Value</th>
              <th className="px-4 py-3 heading-caps">Status</th>
              <th className="px-4 py-3 heading-caps hidden md:table-cell">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>
                  No sensor readings match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cfg = sensorConfig[r.sensorType]
                const fillPct = Math.min(100, (r.value / r.dangerThreshold) * 100)
                const trend = sensorTrends[r.sensorId] || []

                return (
                  <tr key={`${r.sensorId}-${r.timestamp}`} className="transition-colors hover:bg-slate-50/50" style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold" style={{ color: '#0F172A' }}>
                        <span>{cfg?.icon}</span>
                        <span>{cfg?.label || r.sensorType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#0F172A' }}>{r.zone}</td>
                    <td className="px-4 py-3">
                      <Sparkline data={trend} color={cfg?.color || '#059669'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-mono" style={{ color: '#0F172A' }}>{r.value.toFixed(1)}</span>
                          <span className="text-[10px]" style={{ color: '#94A3B8' }}>{r.unit}</span>
                        </div>
                        <div className="h-1 w-16 rounded-full overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${fillPct}%`, backgroundColor: cfg?.color || '#059669' }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={statusStyle(r.status)}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mono hidden md:table-cell" style={{ color: '#94A3B8' }}>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
