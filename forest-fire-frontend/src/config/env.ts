const localApiBaseUrl = 'http://localhost:8081/api/v1'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = configuredApiBaseUrl && configuredApiBaseUrl.length > 0
  ? configuredApiBaseUrl
  : import.meta.env.DEV
    ? localApiBaseUrl
    : 'https://sensors-simulation.onrender.com/api/v1'

export const DASHBOARD_POLL_MS = 12_000
export const ALERT_HISTORY_LIMIT = 24
export const READING_HISTORY_LIMIT = 80
export const API_TIMEOUT_MS = 10_000
