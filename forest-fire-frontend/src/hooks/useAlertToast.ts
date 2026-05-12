import { useCallback, useRef, useState } from 'react'
import type { FireAlert } from '../types/api'

export interface Toast {
  id: string
  alertId: string
  zone: string
  level: string
  message: string
  fireChancePercent: number
}

/**
 * Detects newly arrived alerts on each poll cycle and surfaces them as toasts.
 */
export function useAlertToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  const processAlerts = useCallback((activeAlerts: FireAlert[]) => {
    const newToasts: Toast[] = []

    for (const alert of activeAlerts) {
      if (!seenIds.current.has(alert.alertId)) {
        seenIds.current.add(alert.alertId)
        newToasts.push({
          id: `toast-${alert.alertId}-${Date.now()}`,
          alertId: alert.alertId,
          zone: alert.zone,
          level: alert.alertLevel,
          message: alert.message,
          fireChancePercent: alert.fireChancePercent,
        })
      }
    }

    if (newToasts.length > 0) {
      setToasts((prev) => [...prev, ...newToasts].slice(-5)) // max 5 toasts
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, processAlerts, dismiss }
}
