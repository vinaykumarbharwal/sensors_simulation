import { useEffect, useRef } from 'react'
import type { ZoneData } from '../types/api'
import { RiskGauge } from './RiskGauge'

interface ZoneDetailDrawerProps {
  zone: ZoneData | null
  onClose: () => void
}

const sensorIcons: Record<string, string> = {
  THERMAL: '🌡️',
  SMOKE: '💨',
  HUMIDITY: '💧',
}

const statusColors: Record<string, string> = {
  SAFE: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800',
  WARNING: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800',
  DANGER: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950 dark:border-rose-800',
  CRITICAL: 'text-rose-800 bg-rose-100 border-rose-300 dark:text-rose-200 dark:bg-rose-950 dark:border-rose-700',
}

const overallStatusLabel: Record<string, { emoji: string; label: string; color: string }> = {
  SAFE:     { emoji: '✅', label: 'All Clear', color: 'text-emerald-600 dark:text-emerald-400' },
  WARNING:  { emoji: '⚠️', label: 'Warning',   color: 'text-amber-600 dark:text-amber-400' },
  DANGER:   { emoji: '🔥', label: 'Danger',    color: 'text-rose-600 dark:text-rose-400' },
  CRITICAL: { emoji: '🚨', label: 'Critical',  color: 'text-rose-700 dark:text-rose-300' },
}

export function ZoneDetailDrawer({ zone, onClose }: ZoneDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Trap focus inside drawer
  useEffect(() => {
    if (zone) drawerRef.current?.focus()
  }, [zone])

  if (!zone) return null

  const sensors = zone.sensors ?? zone.sensorReadings ?? []
  const status = overallStatusLabel[zone.overallStatus] ?? overallStatusLabel.SAFE
  const responsePlan = zone.responsePlan
  const outpost = zone.outpost

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label={`Zone detail: ${zone.zoneName}`}
        className="animate-drawer-in fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto
          bg-white shadow-2xl outline-none
          dark:bg-slate-900"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Zone Detail
            </p>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{zone.zoneName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{zone.state}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close drawer"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Risk Gauge */}
          <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 py-6 dark:border-slate-700 dark:bg-slate-800">
            <RiskGauge percent={zone.fireChancePercent} size={160} strokeWidth={14} label="Fire Risk" />
            <div className={`mt-3 flex items-center gap-2 text-lg font-black ${status.color}`}>
              <span>{status.emoji}</span>
              <span>{status.label}</span>
            </div>
            {zone.hasActiveAlert && (
              <span className="mt-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                🚨 Active Alert in Progress
              </span>
            )}
          </div>

          {/* Zone Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoPill label="Latitude" value={zone.latitude.toFixed(4)} />
            <InfoPill label="Longitude" value={zone.longitude.toFixed(4)} />
            <InfoPill label="Overall Status" value={zone.overallStatus} />
            <InfoPill label="Alert Active" value={zone.hasActiveAlert ? 'Yes' : 'No'} />
          </div>

          {/* Description */}
          {zone.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {zone.description}
            </p>
          )}

          {/* Outpost + response plan */}
          {(outpost || responsePlan) && (
            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Forest Response
                  </p>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Nearest outpost & action plan</h3>
                </div>
                {responsePlan && (
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                    {responsePlan.responseMode}
                  </span>
                )}
              </div>

              {outpost && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoPill label="Outpost" value={outpost.outpostName} />
                    <InfoPill label="Employees" value={String(outpost.employeeCount)} />
                    <InfoPill label="Coverage" value={`${outpost.coverageRadiusKm.toFixed(1)} km`} />
                    <InfoPill label="Created by" value={outpost.createdByRole} />
                  </div>
                  <InfoPill label="Equipment" value={outpost.availableEquipment?.join(', ') || 'Not assigned'} />
                </>
              )}

              {responsePlan && (
                <div className="grid grid-cols-2 gap-3">
                  <InfoPill label="Distance" value={`${responsePlan.distanceKm.toFixed(1)} km`} />
                  <InfoPill label="Impact radius" value={`${responsePlan.predictedImpactRadiusKm.toFixed(1)} km`} />
                  <InfoPill label="Crew" value={`${responsePlan.manpowerRequired}`} />
                  <InfoPill label="UAVs" value={`${responsePlan.uavCount}`} />
                  <InfoPill label="ETA" value={`${responsePlan.etaMinutes} min`} />
                  <InfoPill label="Impact area" value={`${responsePlan.predictedImpactAreaSqKm.toFixed(1)} km²`} />
                </div>
              )}
            </div>
          )}

          {/* Sensors */}
          {sensors.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Live Sensor Readings
              </h3>
              <div className="flex flex-col gap-3">
                {sensors.map((sensor) => {
                  const fillPct = Math.min(100, (sensor.value / sensor.dangerThreshold) * 100)
                  const isBelowThreshold = sensor.sensorType === 'HUMIDITY'
                  const adjustedFill = isBelowThreshold ? 100 - fillPct : fillPct
                  const barColor =
                    adjustedFill >= 70 ? 'bg-rose-500' :
                    adjustedFill >= 40 ? 'bg-amber-400' : 'bg-emerald-500'

                  return (
                    <div
                      key={sensor.sensorId}
                      className={`rounded-xl border p-3 ${statusColors[sensor.status] ?? statusColors.SAFE}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{sensorIcons[sensor.sensorType] ?? '📡'}</span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide">{sensor.sensorType}</p>
                            <p className="text-[11px] opacity-70">{sensor.location}</p>
                            {'model' in sensor && (
                              <p className="text-[11px] opacity-70">{(sensor as { model?: string }).model ?? 'Standard model'}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black leading-none">
                            {sensor.value.toFixed(1)}
                            <span className="ml-1 text-xs font-semibold opacity-70">{sensor.unit}</span>
                          </p>
                          <p className="text-[11px] opacity-70">
                            Threshold: {sensor.dangerThreshold}
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${adjustedFill}%` }}
                        />
                      </div>
                      {'coverageRadiusKm' in sensor && (
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                          <span>Coverage</span>
                          <span className="font-bold">{(sensor as { coverageRadiusKm?: number }).coverageRadiusKm?.toFixed(1) ?? '0.0'} km</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}
