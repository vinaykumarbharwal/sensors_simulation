import { useMemo, useState } from 'react'
import type { FireAlert } from '../types/api'
import type { ZoneData } from '../types/api'

interface AlertsPanelProps {
  activeAlerts: FireAlert[]
  alertsHistory: FireAlert[]
  zones?: ZoneData[]
}

function alertLevelStyles(level: string) {
  if (level === 'CRITICAL' || level === 'HIGH') {
    return { bg: '#FFF1F1', border: '#FECACA', accent: 'var(--status-critical)', text: 'var(--status-critical)' }
  }
  if (level === 'MEDIUM' || level === 'WARNING') {
    return { bg: '#FFF8EC', border: '#FDE68A', accent: 'var(--status-warning)', text: '#92400E' }
  }
  return { bg: 'var(--bg-canvas)', border: 'var(--border-subtle)', accent: 'var(--status-inactive)', text: 'var(--text-secondary)' }
}

export function AlertsPanel({ activeAlerts, alertsHistory, zones = [] }: AlertsPanelProps) {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const recent = alertsHistory.slice(0, 12)
  const zoneLookup = useMemo(() => new Map(zones.map((zone) => [zone.zoneName, zone])), [zones])

  return (
    <section className="zone-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="heading-caps mb-1">Signal Intelligence</p>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Alert Control Center</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-critical/10 text-status-critical text-[10px] font-bold uppercase tracking-wider">
          <span className="pulse-dot bg-status-critical" />
          {activeAlerts.length} Active
        </div>
      </div>

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="p-4 rounded-xl border border-status-safe/20 bg-status-safe/5 text-xs font-medium text-status-safe">
            Perimeter clear. No active forest fire threats detected.
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const styles = alertLevelStyles(alert.alertLevel)
            const zone = zoneLookup.get(alert.zone)
            const responsePlan = zone?.responsePlan
            const isExpanded = expandedAlertId === alert.alertId

            return (
              <article 
                key={alert.alertId} 
                className="alert-banner flex-col items-stretch"
                style={{ 
                  backgroundColor: styles.bg, 
                  borderColor: styles.border, 
                  borderLeft: `4px solid ${styles.accent}` 
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {alert.alertLevel === 'CRITICAL' && <div className="pulse-dot bg-status-critical" />}
                    <div>
                      <p className="text-xs font-bold" style={{ color: styles.text }}>
                        {alert.zone} • {alert.alertLevel}
                      </p>
                      <p className="text-xs opacity-80" style={{ color: styles.text }}>
                        {normalizeAlertMessage(alert.message)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-mono" style={{ color: styles.text }}>{alert.fireChancePercent}%</span>
                    <button
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.alertId)}
                      className="px-2 py-1 rounded bg-black/5 hover:bg-black/10 text-[10px] font-bold uppercase transition"
                    >
                      {isExpanded ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-black/5 grid gap-4 sm:grid-cols-2">
                    <AlertDetail label="Impact Radius" value={responsePlan ? `${responsePlan.predictedImpactRadiusKm.toFixed(1)} km` : 'N/A'} />
                    <AlertDetail label="Response ETA" value={responsePlan ? `${responsePlan.etaMinutes} min` : 'Pending'} />
                    <AlertDetail label="Sensors Triggered" value={alert.triggeredSensors.join(', ') || 'Internal System'} />
                    <AlertDetail label="Mitigation Summary" value={responsePlan ? responsePlan.summary : 'Deploy perimeter scouts.'} />
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      <div className="mt-8">
        <p className="heading-caps mb-4">Historical Log</p>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {recent.map((alert) => (
            <div key={`${alert.alertId}-${alert.timestamp}`} className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-canvas/50">
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{alert.zone}</p>
                <p className="text-[10px] text-text-muted text-mono">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${alert.resolved ? 'bg-status-safe/10 text-status-safe' : 'bg-status-critical/10 text-status-critical'}`}>
                  {alert.resolved ? 'Resolved' : 'Active'}
                </span>
                <span className="text-xs font-bold text-text-secondary text-mono">{alert.fireChancePercent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AlertDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="heading-caps mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-text-primary leading-tight">{value}</p>
    </div>
  )
}

function normalizeAlertMessage(msg: string) {
  if (!msg) return 'System anomaly detected.'
  if (msg.length > 80) return msg.slice(0, 77) + '...'
  return msg
}
