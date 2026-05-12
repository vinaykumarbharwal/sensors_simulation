interface FooterBarProps {
  zoneCount: number
  totalAlerts: number
}

export function FooterBar({ zoneCount, totalAlerts }: FooterBarProps) {
  return (
    <footer className="mt-10 border-t border-white/5 bg-gradient-to-b from-emerald-950 to-emerald-950/95 text-emerald-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌲</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">Vanrakshak</p>
              <p className="text-base font-black text-white">Monitoring & Early Warning</p>
            </div>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100/70">
            Vanrakshak provides monitoring and early warning for tracked zones.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-300">Live monitoring active</span>
          </div>
        </div>

        {/* Operational stats */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">Operations</h2>
          <ul className="mt-4 space-y-2.5">
            <li className="flex items-center justify-between text-sm text-emerald-100/80">
              <span>Monitored Zones</span>
              <span className="font-black text-white">{zoneCount}</span>
            </li>
            <li className="flex items-center justify-between text-sm text-emerald-100/80">
              <span>Total Alerts</span>
              <span className="font-black text-white">{totalAlerts}</span>
            </li>
            <li className="flex items-center justify-between text-sm text-emerald-100/80">
              <span>Refresh Cycle</span>
              <span className="font-black text-white">20 sec</span>
            </li>
            <li className="flex items-center justify-between text-sm text-emerald-100/80">
              <span>Data Retention</span>
              <span className="font-black text-white">7 days</span>
            </li>
          </ul>
        </div>

        {/* Emergency contacts */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">Emergency</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-emerald-100/80">
              <li>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Support</p>
                <p className="font-semibold text-white">support@vanrakshak.example</p>
              </li>
            </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4 text-center text-[11px] font-medium text-emerald-200/50 sm:px-6 lg:px-8">
        Vanrakshak • For authorized monitoring and operational use only.
      </div>
    </footer>
  )
}
