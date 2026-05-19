import { useEffect, useMemo, useRef, useState } from 'react'
import { apiClient, getAuthSession, isAuthError } from '../api/client'
import { ALERT_HISTORY_LIMIT, DASHBOARD_POLL_MS, READING_HISTORY_LIMIT } from '../config/env'
import type { DashboardData, FireAlert, HealthData, MapSensor, MapSnapshot, SensorReading, ZoneData } from '../types/api'

interface DashboardState {
  loading: boolean
  refreshing: boolean
  error: string | null
  authExpired: boolean
  dashboard: DashboardData | null
  map: MapSnapshot | null
  health: HealthData | null
  alertsHistory: FireAlert[]
  readingsHistory: SensorReading[]
  lastUpdated: string | null
}

const initialState: DashboardState = {
  loading: true,
  refreshing: false,
  error: null,
  authExpired: false,
  dashboard: null,
  map: null,
  health: null,
  alertsHistory: [],
  readingsHistory: [],
  lastUpdated: null,
}

function normalizeUnit(unit: string): string {
  if (!unit) {
    return unit
  }
  return unit.replace('Â°C', '°C')
}

function normalizeReading(reading: SensorReading): SensorReading {
  return {
    ...reading,
    unit: normalizeUnit(reading.unit),
  }
}

function normalizeMapSensor(reading: MapSensor): MapSensor {
  return {
    ...normalizeReading(reading),
  } as MapSensor
}

function normalizeZone(zone: ZoneData): ZoneData {
  const sensorReadings = zone.sensorReadings?.map(normalizeReading)
  const sensors = zone.sensors?.map((sensor) => normalizeMapSensor(sensor))
  return {
    ...zone,
    sensorReadings,
    sensors,
  }
}

export function useDashboardData(enabled = true) {
  const [state, setState] = useState<DashboardState>(initialState)
  const inFlightRef = useRef(false)
  const activeControllerRef = useRef<AbortController | null>(null)
  const loadFnRef = useRef<((isInitial: boolean) => Promise<void>) | null>(null)

  async function loadCriticalData(controller: AbortController) {
    const maxAttempts = 2

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const [dashboard, map, health] = await Promise.all([
          apiClient.getDashboard(controller.signal),
          apiClient.getMap(controller.signal),
          apiClient.getHealth(controller.signal),
        ])

        return { dashboard, map, health }
      } catch (error) {
        if (isAuthError(error) || attempt === maxAttempts || controller.signal.aborted) {
          throw error
        }

        const delayMs = 100 * attempt
        await new Promise((resolve) => window.setTimeout(resolve, delayMs))
      }
    }

    throw new Error('Unable to load critical data')
  }

  async function loadHistoricalData(controller: AbortController) {
    try {
      // For EMPLOYEE role, pass their assigned zone to the API so the backend
      // only returns data scoped to their zone
      const currentSession = getAuthSession()
      const isEmployee = currentSession?.role?.toUpperCase() === 'EMPLOYEE'
      const zoneFilter = isEmployee && currentSession?.assignedZone ? currentSession.assignedZone : undefined

      const [alertsHistory, readingsHistory] = await Promise.all([
        apiClient.getAlertsHistory(ALERT_HISTORY_LIMIT, zoneFilter, controller.signal),
        apiClient.getReadingsHistory(READING_HISTORY_LIMIT, zoneFilter, controller.signal),
      ])
      return { alertsHistory, readingsHistory }
    } catch (error) {
      if (controller.signal.aborted) {
        return null
      }
      return { alertsHistory: [], readingsHistory: [] }
    }
  }

  useEffect(() => {
    if (!enabled) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        authExpired: false,
      }))
      return
    }

    let mounted = true

    const load = async (isInitialLoad: boolean) => {
      if (inFlightRef.current && !isInitialLoad) {
        return
      }

      inFlightRef.current = true
      activeControllerRef.current?.abort()
      const controller = new AbortController()
      activeControllerRef.current = controller

      if (!isInitialLoad) {
        setState((previous) => ({
          ...previous,
          refreshing: true,
        }))
      }

      try {
        // Phase 1: Load critical data (dashboard, map, health)
        const { dashboard, map, health } = await loadCriticalData(controller)

        if (!mounted) {
          return
        }

        // Show dashboard immediately with critical data
        setState((previous) => ({
          ...previous,
          loading: false,
          refreshing: false,
          error: null,
          authExpired: false,
          dashboard: {
            ...dashboard,
            zones: dashboard.zones.map(normalizeZone),
          },
          map: {
            ...map,
            zones: map.zones.map(normalizeZone),
          },
          health,
          // Historical data will be filled in when ready
          alertsHistory: previous.alertsHistory,
          readingsHistory: previous.readingsHistory,
          lastUpdated: new Date().toISOString(),
        }))

        // Phase 2: Load history only on initial load or force refresh (skip on auto-polls for speed)
        if (isInitialLoad) {
          const historicalData = await loadHistoricalData(controller)
          if (mounted && historicalData) {
            setState((previous) => ({
              ...previous,
              alertsHistory: historicalData.alertsHistory
                .slice()
                .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
              readingsHistory: historicalData.readingsHistory
                .map(normalizeReading)
                .slice()
                .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
              lastUpdated: new Date().toISOString(),
            }))
          }
        }

      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        const message = error instanceof Error ? error.message : 'Unknown error'
        setState((previous) => ({
          ...previous,
          loading: false,
          refreshing: false,
          error: message,
          authExpired: isAuthError(error),
        }))
      } finally {
        inFlightRef.current = false
      }
    }

    loadFnRef.current = load
    void load(true)
    const timerId = window.setInterval(() => {
      void load(false)
    }, DASHBOARD_POLL_MS)

    return () => {
      mounted = false
      activeControllerRef.current?.abort()
      window.clearInterval(timerId)
    }
  }, [enabled])

  // Imperative refresh — components call this instead of window.location.reload()
  const forceRefresh = () => {
    if (loadFnRef.current) {
      void loadFnRef.current(true)
    }
  }

  const activeAlerts = useMemo(() => {
    const currentSession = getAuthSession()
    const isEmployee = currentSession?.role?.toUpperCase() === 'EMPLOYEE'
    const assignedZone = currentSession?.assignedZone

    let alerts = state.dashboard?.activeAlerts.filter((alert) => !alert.resolved) ?? []

    // EMPLOYEE: only show alerts from their assigned zone
    if (isEmployee && assignedZone) {
      alerts = alerts.filter((alert) => alert.zone === assignedZone)
    }

    return alerts
  }, [state.dashboard])

  return {
    ...state,
    activeAlerts,
    forceRefresh,
  }
}
