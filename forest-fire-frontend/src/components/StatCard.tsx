import { useCountUp } from '../hooks/useCountUp'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'danger' | 'warning' | 'success'
  icon?: string
}

const toneConfig: Record<NonNullable<StatCardProps['tone']>, {
  card: string
  dot: string
  iconBg: string
}> = {
  default: {
    card: 'border-slate-200/60 dark:border-slate-700',
    dot: 'bg-slate-300 dark:bg-slate-600',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
  },
  danger: {
    card: 'border-rose-200/60 dark:border-rose-900/50',
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
  },
  warning: {
    card: 'border-amber-200/60 dark:border-amber-900/50',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  success: {
    card: 'border-emerald-200/60 dark:border-emerald-900/50',
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
}

const defaultIcons: Record<string, string> = {
  'Tracked Zones': '🗺️',
  'Active Alerts': '🔔',
  'Critical Zones': '⚠️',
  'Total Alerts': '📋',
}

export function StatCard({ label, value, hint, tone = 'default', icon }: StatCardProps) {
  const config = toneConfig[tone]
  const displayIcon = icon ?? defaultIcons[label] ?? '📊'

  const numericValue = typeof value === 'number' ? value : parseInt(value, 10)
  const isNumeric = !isNaN(numericValue)
  const animatedValue = useCountUp(isNumeric ? numericValue : 0)

  return (
    <article
      className={`card group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        ${config.card}`}
      role="group"
    >
      {/* Background glow on hover */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-current/5 to-transparent opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${config.iconBg}`}>
          {displayIcon}
        </div>
      </div>

      <p className="relative mt-3 text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
        {isNumeric ? animatedValue : value}
      </p>

      {hint && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} aria-hidden />
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
      )}
    </article>
  )
}
