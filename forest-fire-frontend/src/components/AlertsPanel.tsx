import { useMemo, useState } from 'react'
import type { FireAlert } from '../types/api'
import type { ZoneData } from '../types/api'
import { getAuthSession } from '../api/client'

interface AlertsPanelProps {
  activeAlerts: FireAlert[]
  alertsHistory: FireAlert[]
  zones?: ZoneData[]
}

/* ── Severity styling map ──────────────────────────── */
function alertLevelStyles(level: string) {
  if (level === 'CRITICAL') {
    return {
      bg: 'linear-gradient(135deg, #FFF1F1 0%, #FFE4E4 100%)',
      border: '#FCA5A5',
      accent: '#DC2626',
      text: '#991B1B',
      badge: '#DC2626',
      badgeBg: 'rgba(220,38,38,0.12)',
      icon: '🔴',
      pulseColor: '#EF4444',
    }
  }
  if (level === 'HIGH') {
    return {
      bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      border: '#FDBA74',
      accent: '#EA580C',
      text: '#9A3412',
      badge: '#EA580C',
      badgeBg: 'rgba(234,88,12,0.12)',
      icon: '🟠',
      pulseColor: '#F97316',
    }
  }
  if (level === 'MEDIUM' || level === 'WARNING') {
    return {
      bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '#FDE68A',
      accent: '#D97706',
      text: '#92400E',
      badge: '#D97706',
      badgeBg: 'rgba(217,119,6,0.12)',
      icon: '🟡',
      pulseColor: '#F59E0B',
    }
  }
  return {
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    border: '#BBF7D0',
    accent: '#16A34A',
    text: '#166534',
    badge: '#16A34A',
    badgeBg: 'rgba(22,163,74,0.12)',
    icon: '🟢',
    pulseColor: '#10B981',
  }
}

/* ── Title-case zone name ──────────────────────────── */
function titleCase(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/* ── Human-friendly relative timestamp ─────────────── */
function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'yesterday'
  return `${diffDay}d ago`
}

/* ── Format full timestamp ─────────────────────────── */
function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return timestamp
  }
}

/* ── Fire risk severity bar ────────────────────────── */
function RiskBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-mono tabular-nums" style={{ color, minWidth: '28px', textAlign: 'right' }}>
        {percent}%
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export function AlertsPanel({ activeAlerts, alertsHistory, zones = [] }: AlertsPanelProps) {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'resolved' | 'active'>('all')
  const zoneLookup = useMemo(() => new Map(zones.map((zone) => [zone.zoneName, zone])), [zones])
  const session = getAuthSession()
  const isEmployee = session?.role?.toUpperCase() === 'EMPLOYEE'
  const assignedZone = session?.assignedZone

  // Sort active alerts: CRITICAL first, then HIGH, MEDIUM, LOW
  const sortedActiveAlerts = useMemo(() => {
    const priority: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, LOW: 4 }
    return [...activeAlerts].sort((a, b) => (priority[a.alertLevel] ?? 5) - (priority[b.alertLevel] ?? 5))
  }, [activeAlerts])

  // Filter and deduplicate history
  const filteredHistory = useMemo(() => {
    let recent = alertsHistory.slice(0, 50)
    if (historyFilter === 'resolved') recent = recent.filter((a) => a.resolved)
    if (historyFilter === 'active') recent = recent.filter((a) => !a.resolved)
    return recent
  }, [alertsHistory, historyFilter])

  // Summary stats
  const stats = useMemo(() => {
    const critical = sortedActiveAlerts.filter((a) => a.alertLevel === 'CRITICAL').length
    const high = sortedActiveAlerts.filter((a) => a.alertLevel === 'HIGH').length
    const medium = sortedActiveAlerts.filter((a) => a.alertLevel === 'MEDIUM' || a.alertLevel === 'WARNING').length
    const resolvedToday = alertsHistory.filter((a) => {
      if (!a.resolved) return false
      const alertDate = new Date(a.timestamp)
      const today = new Date()
      return alertDate.toDateString() === today.toDateString()
    }).length
    return { critical, high, medium, total: sortedActiveAlerts.length, resolvedToday }
  }, [sortedActiveAlerts, alertsHistory])

  return (
    <section className="space-y-6">
      {/* ─── Quick Stats Bar ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Active Threats"
          value={stats.total}
          color={stats.total > 0 ? '#DC2626' : '#10B981'}
          icon={stats.total > 0 ? '⚠️' : '✅'}
          pulse={stats.total > 0}
        />
        <StatCard label="Critical" value={stats.critical} color="#DC2626" icon="🔴" />
        <StatCard label="High / Medium" value={stats.high + stats.medium} color="#EA580C" icon="🟠" />
        <StatCard label="Resolved Today" value={stats.resolvedToday} color="#10B981" icon="✓" />
      </div>

      {/* ─── Active Alerts Section ────────────────── */}
      <div className="zone-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="heading-caps mb-1" style={{ color: '#059669' }}>Live Threat Monitor</p>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0F172A' }}>Active Fire Alerts</h2>
            {isEmployee && assignedZone && (
              <p className="mt-1 text-xs font-semibold" style={{ color: '#059669' }}>
                🔒 Showing alerts for <span className="font-black">{assignedZone}</span> zone only
              </p>
            )}
          </div>
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: stats.total > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: stats.total > 0 ? '#EF4444' : '#10B981',
            }}
          >
            <span className="pulse-dot" style={{ backgroundColor: stats.total > 0 ? '#EF4444' : '#10B981' }} />
            {stats.total > 0 ? `${stats.total} Active` : 'All Clear'}
          </div>
        </div>

        <div className="space-y-3">
          {sortedActiveAlerts.length === 0 ? (
            <div
              className="flex items-center gap-4 p-5 rounded-xl"
              style={{ border: '1px solid rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.05)' }}
            >
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
              >
                ✅
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                  Perimeter Clear
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  No active forest fire threats detected across monitored zones.
                </p>
              </div>
            </div>
          ) : (
            sortedActiveAlerts.map((alert) => {
              const styles = alertLevelStyles(alert.alertLevel)
              const zone = zoneLookup.get(alert.zone)
              const responsePlan = zone?.responsePlan
              const outpostName = zone?.outpost?.outpostName
              const isExpanded = expandedAlertId === alert.alertId

              return (
                <article
                  key={alert.alertId}
                  className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: styles.bg,
                    border: `1px solid ${styles.border}`,
                    borderLeft: `4px solid ${styles.accent}`,
                    boxShadow: alert.alertLevel === 'CRITICAL' ? `0 0 20px rgba(220,38,38,0.08)` : 'none',
                  }}
                >
                  <div
                    className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.alertId)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Severity indicator */}
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: styles.badgeBg }}
                      >
                        {styles.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                            style={{ backgroundColor: styles.badgeBg, color: styles.badge }}
                          >
                            {alert.alertLevel}
                          </span>
                          <span className="text-sm font-bold" style={{ color: styles.text }}>
                            {titleCase(alert.zone)}
                          </span>
                          {outpostName && (
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: styles.text }}
                            >
                              📍 {outpostName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: styles.text, opacity: 0.85 }}>
                          {alert.message || 'System anomaly detected.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <RiskBar percent={alert.fireChancePercent} color={styles.accent} />
                        <p className="text-[9px] mt-1 text-right" style={{ color: '#94A3B8' }}>
                          {relativeTime(alert.timestamp)}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: styles.text }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Response Plan */}
                  {isExpanded && (
                    <div className="px-5 pb-5 animate-fade-in">
                      <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        {/* Triggered Sensors */}
                        {alert.triggeredSensors.length > 0 && (
                          <div className="mb-3">
                            <p className="heading-caps mb-1.5">Triggered Sensors</p>
                            <div className="flex flex-wrap gap-1.5">
                              {alert.triggeredSensors.map((sensor) => (
                                <span
                                  key={sensor}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold"
                                  style={{ backgroundColor: styles.badgeBg, color: styles.badge }}
                                >
                                  📡 {sensor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response Plan Grid */}
                        <div className="grid gap-2.5 sm:grid-cols-3 mt-3">
                          <ResponseCard
                            icon="🎯"
                            label="Impact Radius"
                            value={responsePlan ? `${responsePlan.predictedImpactRadiusKm.toFixed(1)} km²` : 'Calculating...'}
                            accent={styles.accent}
                          />
                          <ResponseCard
                            icon="⏱️"
                            label="Response ETA"
                            value={responsePlan ? `${responsePlan.etaMinutes} min` : 'Pending'}
                            accent={styles.accent}
                          />
                          <ResponseCard
                            icon="🏕️"
                            label="Nearest Outpost"
                            value={responsePlan?.nearestOutpostName ?? 'Not assigned'}
                            accent={styles.accent}
                          />
                          <ResponseCard
                            icon="👥"
                            label="Manpower"
                            value={responsePlan ? `${responsePlan.manpowerRequired} personnel` : 'TBD'}
                            accent={styles.accent}
                          />
                          <ResponseCard
                            icon="🚁"
                            label="Deployment"
                            value={responsePlan?.responseType === 'MANPOWER_AND_UAV' ? 'Ground + UAV' : 'Ground Teams'}
                            accent={styles.accent}
                          />
                          <ResponseCard
                            icon="📋"
                            label="Action Plan"
                            value={responsePlan?.summary ?? 'Deploy perimeter scouts.'}
                            accent={styles.accent}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Historical Log Section ───────────────── */}
      <div className="zone-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="heading-caps mb-1" style={{ color: '#059669' }}>Alert Archive</p>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: '#0F172A' }}>
              Historical Log
              <span className="text-xs font-normal ml-2" style={{ color: '#94A3B8' }}>
                ({filteredHistory.length} entries)
              </span>
            </h3>
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            {(['all', 'active', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
                style={
                  historyFilter === filter
                    ? { backgroundColor: '#059669', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(5,150,105,0.3)' }
                    : { backgroundColor: 'transparent', color: '#64748B' }
                }
              >
                {filter === 'all' ? '📋 All' : filter === 'active' ? '🔴 Active' : '✅ Resolved'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center py-10 opacity-60">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                No alerts match the current filter.
              </p>
            </div>
          ) : (
            filteredHistory.map((alert, index) => {
              const styles = alertLevelStyles(alert.alertLevel)
              const isHistoryExpanded = expandedHistoryId === `${alert.alertId}-${index}`

              return (
                <div
                  key={`${alert.alertId}-${alert.timestamp}-${index}`}
                  className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-sm cursor-pointer"
                  style={{
                    border: `1px solid ${alert.resolved ? '#E2E8F0' : styles.border}`,
                    borderLeft: `3px solid ${alert.resolved ? '#10B981' : styles.accent}`,
                    backgroundColor: alert.resolved ? '#FAFFFE' : styles.bg.includes('linear') ? '#FFFBF5' : '#F8FAFC',
                  }}
                  onClick={() => setExpandedHistoryId(isHistoryExpanded ? null : `${alert.alertId}-${index}`)}
                >
                  <div className="flex items-center justify-between p-3 gap-3">
                    <div className="min-w-0 flex items-center gap-3 flex-1">
                      {/* Severity dot with pulse for active */}
                      <div className="relative shrink-0">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                          style={{ backgroundColor: alert.resolved ? 'rgba(16,185,129,0.1)' : styles.badgeBg }}
                        >
                          {alert.resolved ? '✓' : styles.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold" style={{ color: '#0F172A' }}>
                            {titleCase(alert.zone)}
                          </p>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={{ backgroundColor: styles.badgeBg, color: styles.badge }}
                          >
                            {alert.alertLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                            {relativeTime(alert.timestamp)}
                          </span>
                          <span className="text-[10px]" style={{ color: '#CBD5E1' }}>•</span>
                          <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={
                          alert.resolved
                            ? { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }
                            : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }
                        }
                      >
                        {alert.resolved ? '✓ Resolved' : '● Active'}
                      </span>
                      <span className="text-xs font-bold text-mono" style={{ color: styles.badge }}>
                        {alert.fireChancePercent}%
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isHistoryExpanded ? 'rotate-180' : ''}`}
                        style={{ color: '#94A3B8' }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded history detail */}
                  {isHistoryExpanded && (
                    <div className="px-4 pb-3 animate-fade-in" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <p className="text-xs leading-relaxed mt-2 mb-2" style={{ color: '#475569' }}>
                        {alert.message || 'Alert details not available.'}
                      </p>
                      {alert.triggeredSensors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-medium" style={{ color: '#94A3B8' }}>Sensors:</span>
                          {alert.triggeredSensors.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                              style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#475569' }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Stat Card Component ─────────────────────────── */
function StatCard({
  label,
  value,
  color,
  icon,
  pulse,
}: {
  label: string
  value: number
  color: string
  icon: string
  pulse?: boolean
}) {
  return (
    <div
      className="relative rounded-xl p-4 transition-all"
      style={{
        border: `1px solid ${color}20`,
        backgroundColor: `${color}08`,
      }}
    >
      {pulse && value > 0 && (
        <div className="absolute top-3 right-3">
          <span className="pulse-dot" style={{ backgroundColor: color }} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-mono" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

/* ── Response Plan Card ──────────────────────────── */
function ResponseCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className="rounded-lg p-3 transition-all"
      style={{ border: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.6)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
          {label}
        </p>
      </div>
      <p className="text-xs font-semibold leading-tight" style={{ color: accent }}>
        {value}
      </p>
    </div>
  )
}
