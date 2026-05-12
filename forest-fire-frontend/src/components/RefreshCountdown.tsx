import { useEffect, useRef, useState } from 'react'
import { DASHBOARD_POLL_MS } from '../config/env'

interface RefreshCountdownProps {
  refreshing: boolean
}

/**
 * SVG circle countdown ring that depletes from full → empty each poll cycle,
 * then snaps back when a refresh completes.
 */
export function RefreshCountdown({ refreshing }: RefreshCountdownProps) {
  const totalSeconds = DASHBOARD_POLL_MS / 1000
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset + restart countdown whenever refreshing flips false→true→false
  useEffect(() => {
    if (refreshing) return
    setSecondsLeft(totalSeconds)

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refreshing, totalSeconds])

  const size = 28
  const stroke = 3
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const progress = secondsLeft / totalSeconds
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center" title={`Next refresh in ${secondsLeft}s`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={refreshing ? '#fbbf24' : '#86efac'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-emerald-100 rotate-90">
        {refreshing ? '↻' : secondsLeft}
      </span>
    </div>
  )
}
