import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { RefreshCountdown } from './RefreshCountdown'

interface TopNavProps {
  activeAlerts: number
  lastUpdated: string | null
  refreshing: boolean
  activeView: string
  onNavigate: (view: string) => void
  currentUser: string
  currentRole: string
  onLogout: () => void
}

const navItems = [
  { label: 'Overview', view: 'overview', icon: '📊' },
  { label: 'Map Intelligence', view: 'map-intelligence', icon: '🗺️' },
  { label: 'Admin Console', view: 'admin-console', icon: '🛠️' },
  { label: 'Alert Center', view: 'alert-center', icon: '🚨' },
  { label: 'Sensor Feed', view: 'sensor-feed', icon: '📡' },
  { label: 'System Health', view: 'system-health', icon: '💚' },
]

export function TopNav({ activeAlerts, lastUpdated, refreshing, activeView, onNavigate, currentUser, currentRole, onLogout }: TopNavProps) {
  const [showMenu, setShowMenu] = useState(false)
  const syncLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Syncing'

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-emerald-50 shadow-xl shadow-emerald-950/20">
      {/* App title bar */}
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 py-2 text-sm font-bold sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">🌲</span>
          <div>
            <div className="text-base font-black text-white sm:text-lg">Vanrakshak</div>
            <div className="text-[11px] text-emerald-200/70 sm:text-xs">Forest monitoring & early fire detection</div>
          </div>
        </div>
        <div className="text-[11px] text-emerald-300/80 sm:text-xs">Operational Dashboard</div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">
            Vanrakshak
          </p>
          <h1 className="text-base font-black tracking-tight text-white sm:text-lg lg:text-xl">
            Operational Dashboard
          </h1>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 text-xs font-semibold sm:w-auto">
          <RefreshCountdown refreshing={refreshing} />

          <span className="rounded-full border border-white/[0.06] bg-white/[0.08] px-3 py-1 backdrop-blur-sm">
            Last sync {syncLabel}
          </span>

          {/* Live indicator */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
            refreshing
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {!refreshing && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            )}
            {refreshing ? '↻ Syncing' : 'Live'}
          </span>

          {/* Alert badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all ${
            activeAlerts > 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-white/[0.08] text-emerald-200 border border-white/[0.06]'
          }`}>
            {activeAlerts > 0 && <span className="text-sm leading-none">🔔</span>}
            {activeAlerts > 0 ? `${activeAlerts} Active` : 'No Alerts'}
          </span>

          <ThemeToggle />

          <span className="hidden rounded-full border border-white/[0.06] bg-white/[0.08] px-3 py-1 text-emerald-100 md:inline-flex">
            {currentUser} • {currentRole}
          </span>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-emerald-50 transition hover:bg-white/15"
          >
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-emerald-200 transition hover:bg-white/10 sm:hidden"
            onClick={() => setShowMenu((v) => !v)}
            aria-expanded={showMenu}
            aria-label="Toggle navigation"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              {showMenu ? (
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`mx-auto w-full max-w-7xl flex-wrap items-center gap-1 border-t border-white/[0.06] px-4 py-2 sm:flex sm:px-6 lg:px-8 ${
          showMenu ? 'flex' : 'hidden'
        }`}
      >
        {navItems.map((item) => (
          <button
            key={item.view}
            type="button"
            className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:w-auto sm:text-sm ${
              activeView === item.view
                ? 'bg-white/15 text-white shadow-inner shadow-white/5'
                : 'text-emerald-200/80 hover:bg-white/[0.06] hover:text-white'
            }`}
            onClick={() => {
              setShowMenu(false)
              onNavigate(item.view)
            }}
          >
            <span className="text-sm leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
