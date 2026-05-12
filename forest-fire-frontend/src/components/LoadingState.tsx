export function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {/* Animated rings */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-200/40 dark:border-emerald-700/30" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-amber-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <span className="text-2xl">🌲</span>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">
          Initializing Forest Watch
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Connecting to sensor network and loading telemetry data…
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="mt-4 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card rounded-2xl p-5" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="skeleton h-3 w-20 rounded-md" />
            <div className="skeleton mt-4 h-8 w-16 rounded-md" />
            <div className="skeleton mt-3 h-2.5 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Skeleton map + sidebar */}
      <div className="grid w-full max-w-4xl gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="card rounded-2xl p-6">
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="skeleton mt-4 h-48 w-full rounded-xl" />
        </div>
        <div className="card rounded-2xl p-6">
          <div className="skeleton h-4 w-24 rounded-md" />
          <div className="skeleton mt-4 h-12 w-full rounded-xl" />
          <div className="skeleton mt-3 h-12 w-full rounded-xl" />
          <div className="skeleton mt-3 h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
