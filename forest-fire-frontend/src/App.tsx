import { useEffect, useState } from 'react'
import { clearAuthSession, getAuthSession } from './api/client'
import { AlertsPanel } from './components/AlertsPanel'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AccountPanel } from './components/AccountPanel'
import { ForestMapPanel } from './components/ForestMapPanel'
import { Header } from './components/Header'
import { HealthPanel } from './components/HealthPanel'
import { LoginPanel } from './components/LoginPanel'
import { LoadingState } from './components/LoadingState'
import { OperationsAdminPanel } from './components/OperationsAdminPanel'
import { SensorReadingsPanel } from './components/SensorReadingsPanel'
import { ToastContainer } from './components/ToastContainer'
import { useAlertToast } from './hooks/useAlertToast'
import { useDashboardData } from './hooks/useDashboardData'
import type { AuthSession, ZoneData } from './types/api'

type DashboardPage = 'overview' | 'alerts' | 'operations' | 'health' | 'account'

interface PageDefinition {
  id: DashboardPage
  label: string
  mobileLabel: string
}

const adminPages: PageDefinition[] = [
  { id: 'overview', label: 'Map Overview', mobileLabel: 'Map' },
  { id: 'alerts', label: 'Alerts Control', mobileLabel: 'Alerts' },
  { id: 'operations', label: 'Admin Console', mobileLabel: 'Admin' },
  { id: 'health', label: 'System Health', mobileLabel: 'Health' },
  { id: 'account', label: 'Profile & Settings', mobileLabel: 'Account' },
]

const employeePages: PageDefinition[] = [
  { id: 'overview', label: 'Map Overview', mobileLabel: 'Map' },
  { id: 'alerts', label: 'Alerts Control', mobileLabel: 'Alerts' },
  { id: 'operations', label: 'Outpost Management', mobileLabel: 'Ops' },
  { id: 'health', label: 'Sensor Health', mobileLabel: 'Health' },
  { id: 'account', label: 'Profile & Settings', mobileLabel: 'Account' },
]

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession())

  if (!session) {
    return (
      <LoginPanel
        onLoggedIn={(nextSession) => {
          setSession(nextSession)
        }}
      />
    )
  }

  return (
    <AppErrorBoundary onReset={() => {}}>
      <Dashboard session={session} onSessionUpdate={setSession} onLogout={() => {
        clearAuthSession()
        setSession(null)
      }} />
    </AppErrorBoundary>
  )
}

interface DashboardProps {
  session: AuthSession
  onSessionUpdate: (nextSession: AuthSession) => void
  onLogout: () => void
}

function Dashboard({ session, onSessionUpdate, onLogout }: DashboardProps) {
  const isHead = session.role.toUpperCase() === 'HEAD'
  const pageDefinitions = isHead ? adminPages : employeePages
  const [activePage, setActivePage] = useState<DashboardPage>('overview')
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null)

  const { loading, refreshing, error, authExpired, dashboard, map, health, alertsHistory, readingsHistory, lastUpdated, activeAlerts } =
    useDashboardData(true)
  const { toasts, processAlerts, dismiss } = useAlertToast()

  useEffect(() => {
    if (authExpired) {
      onLogout()
    }
  }, [authExpired, onLogout])

  useEffect(() => {
    processAlerts(activeAlerts)
  }, [activeAlerts, processAlerts])

  useEffect(() => {
    if (!map?.zones?.length) return
    
    const isEmployee = session.role.toUpperCase() === 'EMPLOYEE'
    const assignedZoneName = session.assignedZone

    setSelectedZone((previous) => {
      // If we already have a valid selection, keep it
      if (previous && map.zones.some((z) => z.zoneName === previous.zoneName)) {
        // Enforce employee restriction even if they somehow got another zone selected
        if (isEmployee && assignedZoneName && previous.zoneName !== assignedZoneName) {
           return map.zones.find((z) => z.zoneName === assignedZoneName) ?? previous
        }
        return previous
      }
      
      // Default selection logic
      if (isEmployee && assignedZoneName) {
        return map.zones.find((z) => z.zoneName === assignedZoneName) ?? null
      }
      return map.zones.find((z) => z.hasActiveAlert) ?? map.zones[0] ?? null
    })
  }, [map, session])

  const syncTimestamp = lastUpdated ?? dashboard?.timestamp ?? map?.generatedAt ?? null
  const employeeAssignedZone = session.role.toUpperCase() === 'EMPLOYEE' ? session.assignedZone : null
  const selectedZoneSummary = selectedZone ?? (
    employeeAssignedZone 
      ? map?.zones?.find((zone) => zone.zoneName === employeeAssignedZone) 
      : (map?.zones?.find((zone) => zone.hasActiveAlert) ?? map?.zones?.[0])
  ) ?? null
  const activePageMeta = pageDefinitions.find((page) => page.id === activePage) ?? pageDefinitions[0]

  if (loading || authExpired) return <LoadingState />
  if (!dashboard || !map) {
    return <ConnectionErrorState message={error || 'Unable to load data'} onRetry={() => window.location.reload()} onLogout={onLogout} />
  }

  function renderOperationsPage() {
    return (
      <div className="space-y-6">
        <div className="zone-card">
          <p className="heading-caps text-accent-primary mb-1">
            {isHead ? 'Admin console' : 'Outpost management'}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {isHead ? 'Manage outposts and equipment' : 'View outpost coverage'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Grouped controls for outpost sensors, satellite coverage, and maintenance logs.
          </p>
        </div>
        <OperationsAdminPanel snapshot={map!} userRole={session.role} />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas font-ui">
      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <aside className="sidebar-nav flex flex-col shrink-0">
        <div className="relative flex flex-col justify-center gap-1 px-6 py-5 border-b border-white/10 bg-gradient-to-b from-[#1C2B22] to-[#121c16]">
          {/* Subtle Tricolor Ribbon on top of the sidebar */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <span className="flex-1 bg-[#FF9933]"></span>
            <span className="flex-1 bg-[#FFFFFF]"></span>
            <span className="flex-1 bg-[#138808]"></span>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5">
            <div className="h-10 w-10 rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center text-xl shadow-inner shadow-amber-500/10">
              🇮🇳
            </div>
            <div>
              <p className="text-xs font-black text-amber-500 tracking-widest leading-none">GOVT GRID</p>
              <h1 className="text-sm font-extrabold tracking-tight text-white mt-0.5 leading-none">VANRAKSHAK</h1>
            </div>
          </div>
          <p className="text-[8.5px] font-semibold text-white/50 tracking-wider uppercase mt-1 leading-normal">
            National Wildfire Telemetry Grid
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Dashboard</p>
          {pageDefinitions.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`flex w-full items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                activePage === page.id
                  ? 'bg-accent-primary text-white shadow-lg shadow-black/20'
                  : 'text-white/60 hover:bg-bg-sidebar-hover hover:text-white'
              }`}
            >
              <span className="text-xl shrink-0">
                {page.id === 'overview' && '🗺️'}
                {page.id === 'alerts' && '🔔'}
                {page.id === 'operations' && '⚙️'}
                {page.id === 'health' && '📡'}
                {page.id === 'account' && '👤'}
              </span>
              <span className="text-left leading-tight">{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
            <div className="h-9 w-9 rounded-full bg-accent-primary-light text-accent-primary grid place-items-center font-bold text-xs shrink-0">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{session.displayName || session.username}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{session.role}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-status-critical/10 text-status-critical text-xs font-bold hover:bg-status-critical/20 transition-all border border-status-critical/20"
          >
            <span>🚪</span>
            Log out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="relative h-20 flex flex-col justify-center px-8 bg-white border-b border-border-subtle shrink-0 shadow-sm">
          {/* Subtle Tricolor Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <span className="flex-1 bg-[#FF9933]"></span>
            <span className="flex-1 bg-[#FFFFFF]"></span>
            <span className="flex-1 bg-[#138808]"></span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold tracking-widest text-[#FF9933] uppercase leading-none">
                Govt. of India • National Security Grid
              </p>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-text-muted">Dashboard</span>
                <span className="text-text-muted">/</span>
                <span className="font-bold text-text-primary">{activePageMeta.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-text-secondary shadow-sm">
                <span className={`pulse-dot ${refreshing ? 'bg-[#FF9933]' : 'bg-[#138808]'}`} />
                <span className="text-mono tracking-wider">{refreshing ? 'REFRESHING' : 'SECURE CONNECTED'}</span>
                {syncTimestamp && <span className="opacity-20">|</span>}
                {syncTimestamp && <span className="text-mono">{new Date(syncTimestamp).toLocaleTimeString()}</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto animate-fade-in">
            {error && (
              <div className="alert-banner critical">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-status-critical">Connection Error</p>
                  <p className="text-xs text-status-critical/80">{error}</p>
                </div>
                <button onClick={() => window.location.reload()} className="px-3 py-1 rounded bg-status-critical text-white text-xs font-bold">
                  Retry
                </button>
              </div>
            )}

            {activePage === 'overview' && (
              <div className="space-y-8">
                <Header timestamp={syncTimestamp} status={health?.status || 'UNKNOWN'} database={health?.database || 'UNKNOWN'} />
                <ForestMapPanel 
                  snapshot={map} 
                  onZoneSelect={(zone) => {
                    setSelectedZone(zone)
                    setActivePage('alerts')
                  }} 
                  role={session.role} 
                />
              </div>
            )}

            {activePage === 'alerts' && (
              <div className="w-full">
                <AlertsPanel activeAlerts={activeAlerts} alertsHistory={alertsHistory} zones={map?.zones ?? []} />
              </div>
            )}

            {activePage === 'operations' && renderOperationsPage()}

            {activePage === 'health' && (
              <div className="grid gap-8 xl:grid-cols-[1fr_1fr] items-start">
                <div className="space-y-8">
                  <HealthPanel health={health} />
                  <SensorReadingsPanel readings={readingsHistory} />
                </div>
                <div className="flex flex-col gap-6 h-full max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                  {session.role.toUpperCase() === 'HEAD' ? (
                    (map?.zones ?? []).map((zone) => (
                      <ZoneSummaryCard key={zone.zoneName} zone={zone} />
                    ))
                  ) : (
                    selectedZoneSummary && <ZoneSummaryCard zone={selectedZoneSummary} />
                  )}
                </div>
              </div>
            )}

            {activePage === 'account' && <AccountPanel session={session} onSessionUpdate={onSessionUpdate} />}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

interface ConnectionErrorStateProps {
  message: string
  onRetry: () => void
  onLogout: () => void
}


function ConnectionErrorState({ message, onLogout }: ConnectionErrorStateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <span className="text-5xl">🌲</span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Unable to Load</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log Out
          </button>
        </div>
      </div>
    </main>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-canvas p-4 transition-colors hover:border-border-strong">
      <p className="heading-caps mb-1">{label}</p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
  )
}

function ZoneSummaryCard({ zone }: { zone: ZoneData }) {
  const statusClass = zone.overallStatus?.toLowerCase() || 'safe'
  
  return (
    <section className={`zone-card status-${statusClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="heading-caps mb-1">Zone Overview</p>
          <h3 className="text-xl font-bold tracking-tight text-text-primary">{zone.zoneName}</h3>
        </div>
        <div className={`status-badge ${statusClass} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
          {zone.overallStatus}
        </div>
      </div>
      
      <p className="text-sm text-text-secondary leading-relaxed mb-6">{zone.description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile label="Current Status" value={zone.overallStatus} />
        <InfoTile label="Fire Risk" value={`${zone.fireChancePercent}%`} />
        <InfoTile label="Primary Outpost" value={zone.outpost?.outpostName ?? 'None assigned'} />
        <InfoTile label="Active Sensors" value={`${zone.sensors?.length ?? 0}`} />
      </div>

      <div className="mt-6 p-4 rounded-xl bg-accent-primary-light border border-accent-primary/10">
        <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-1">Response Protocol</p>
        <p className="text-xs text-text-primary leading-relaxed">
          {zone.responsePlan?.summary ?? 'No specialized response protocol assigned. Follow standard wildfire mitigation procedures.'}
        </p>
      </div>
    </section>
  )
}

export default App