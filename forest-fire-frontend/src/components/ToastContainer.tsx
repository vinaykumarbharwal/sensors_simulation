import { useEffect, useRef } from 'react'
import type { Toast } from '../hooks/useAlertToast'

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const TOAST_DURATION = 6000

const levelConfig: Record<string, { icon: string; bg: string; border: string; text: string; bar: string }> = {
  CRITICAL: {
    icon: '🔴',
    bg: 'bg-rose-950/95',
    border: 'border-rose-500',
    text: 'text-rose-50',
    bar: 'bg-rose-500',
  },
  HIGH: {
    icon: '🟠',
    bg: 'bg-orange-950/95',
    border: 'border-orange-500',
    text: 'text-orange-50',
    bar: 'bg-orange-500',
  },
  MEDIUM: {
    icon: '🟡',
    bg: 'bg-amber-950/95',
    border: 'border-amber-400',
    text: 'text-amber-50',
    bar: 'bg-amber-400',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const progressRef = useRef<HTMLDivElement>(null)
  const config = levelConfig[toast.level] ?? levelConfig.MEDIUM

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  // Animate progress bar
  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    el.style.width = '100%'
    el.style.transition = 'none'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `width ${TOAST_DURATION}ms linear`
        el.style.width = '0%'
      })
    })
  }, [])

  return (
    <div
      className={`animate-slide-in relative w-80 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md
        ${config.bg} ${config.border} ${config.text}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{config.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">{toast.level} Alert</p>
            <p className="text-sm font-black">{toast.zone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-full p-0.5 opacity-60 hover:opacity-100 transition text-current"
          aria-label="Dismiss alert"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Fire chance */}
      <div className="px-4 pb-3">
        <p className="text-xs opacity-80 leading-snug line-clamp-2">
          Fire probability: <strong>{toast.fireChancePercent}%</strong>
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/10">
        <div ref={progressRef} className={`h-full ${config.bar}`} style={{ width: '100%' }} />
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
      aria-label="Alert notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
