interface HeaderProps {
  timestamp: string | null
  status: string
  database: string
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const isUp = value === 'UP'
  const isUnknown = value === 'UNKNOWN'
  const statusColor = isUp ? 'var(--status-safe)' : isUnknown ? 'var(--status-inactive)' : 'var(--status-critical)'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-canvas px-4 py-2.5 transition-all hover:border-border-strong">
      <span className="relative flex h-2 w-2 shrink-0">
        {isUp && <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ backgroundColor: statusColor }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
      </span>
      <div>
        <p className="heading-caps mb-0.5">{label}</p>
        <p className="text-xs font-bold text-text-primary text-mono">{value}</p>
      </div>
    </div>
  )
}

export function Header({ timestamp, status, database }: HeaderProps) {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'

  return (
    <header className="zone-card flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded bg-accent-primary grid place-items-center text-xs">🌲</div>
          <p className="heading-caps text-accent-primary">System Overview</p>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Operational Intelligence Dashboard</h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Unified telemetry node for forest rangers. Monitoring real-time sensor streams and automated fire risk assessment across all active belts.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 shrink-0">
        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-canvas px-4 py-2.5">
          <span className="text-base">🕒</span>
          <div>
            <p className="heading-caps mb-0.5">Last Sync</p>
            <p className="text-xs font-bold text-text-primary text-mono">{formattedTime}</p>
          </div>
        </div>
        <StatusPill label="API" value={status} />
        <StatusPill label="Cloud DB" value={database} />
      </div>
    </header>
  )
}
