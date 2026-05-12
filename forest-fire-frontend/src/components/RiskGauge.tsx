interface RiskGaugeProps {
  percent: number       // 0–100
  size?: number         // SVG size in px, default 120
  strokeWidth?: number  // default 10
  label?: string
}

function riskColor(p: number): string {
  if (p >= 70) return '#e11d48'  // rose-600
  if (p >= 40) return '#f59e0b'  // amber-500
  return '#10b981'               // emerald-500
}

/**
 * Semi-circle SVG arc gauge showing fire risk percentage.
 * Arc sweeps from 7 o'clock (bottom-left) to 5 o'clock (bottom-right).
 */
export function RiskGauge({ percent, size = 120, strokeWidth = 10, label }: RiskGaugeProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))
  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2

  // Arc: sweep 180° (half circle) at top
  const startAngle = 180
  const endAngle = 0
  const range = 180
  const sweepAngle = (clampedPercent / 100) * range

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const startX = cx + r * Math.cos(toRad(startAngle))
  const startY = cy - r * Math.sin(toRad(startAngle))
  const endX = cx + r * Math.cos(toRad(startAngle - sweepAngle))
  const endY = cy - r * Math.sin(toRad(startAngle - sweepAngle))

  const trackEndX = cx + r * Math.cos(toRad(endAngle))
  const trackEndY = cy - r * Math.sin(toRad(endAngle))

  const largeArc = sweepAngle > 180 ? 1 : 0
  const trackLargeArc = range > 180 ? 1 : 0

  const color = riskColor(clampedPercent)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        aria-label={`Risk gauge: ${clampedPercent}%`}
      >
        {/* Track arc */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 ${trackLargeArc} 1 ${trackEndX} ${trackEndY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Value arc */}
        {clampedPercent > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease, d 0.6s ease' }}
          />
        )}
        {/* Center text */}
        <text
          x={cx}
          y={size / 2 + strokeWidth - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={size * 0.22}
          fontWeight="900"
          fill={color}
        >
          {clampedPercent}%
        </text>
      </svg>
      {label && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  )
}
