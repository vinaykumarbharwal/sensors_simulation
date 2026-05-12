import type { HealthData } from '../types/api'

interface HealthPanelProps {
  health: HealthData | null
}


function StatusCard({
  label, value, isUp,
}: { label: string; value: string; isUp: boolean }) {
  const color = isUp ? 'var(--status-safe)' : 'var(--status-critical)'
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-canvas p-5 text-center transition-all hover:border-border-strong">
      <div className="relative flex h-3 w-3">
        {isUp && <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: color }} />}
        <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div>
        <p className="heading-caps mb-0.5">{label}</p>
        <p className="text-sm font-bold text-text-primary text-mono">{value}</p>
      </div>
    </div>
  )
}

export function HealthPanel({ health }: HealthPanelProps) {
  if (!health) return null

  const serviceUp  = health.status === 'UP'
  const databaseUp = health.database === 'UP'
  const allUp      = serviceUp && databaseUp

  return (
    <section className="zone-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="heading-caps mb-1">Service Core</p>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">System Integrity</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          allUp ? 'bg-status-safe/10 text-status-safe' : 'bg-status-critical/10 text-status-critical'
        }`}>
          {allUp ? 'Operational' : 'Degraded'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatusCard label="API Engine" value={health.status} isUp={serviceUp} />
        <StatusCard label="Persistence" value={health.database} isUp={databaseUp} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border-subtle bg-bg-canvas/50">
          <p className="heading-caps mb-1">Network Port</p>
          <p className="text-xl font-bold text-text-primary text-mono">{health.port}</p>
        </div>
        <div className="p-4 rounded-xl border border-border-subtle bg-bg-canvas/50">
          <p className="heading-caps mb-1">Index Count</p>
          <p className="text-xl font-bold text-text-primary text-mono">{health.zoneCount}</p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-bg-canvas/50">
        <p className="heading-caps mb-1">Instance Identifier</p>
        <p className="text-xs font-bold text-text-primary">{health.service}</p>
        <p className="mt-2 text-[10px] text-text-muted text-mono">
          Last health ping: {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </section>
  )
}
