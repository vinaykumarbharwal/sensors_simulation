import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env'
import type {
  AccountPasswordChangeRequest,
  AccountProfile,
  AccountProfileUpdateRequest,
  AdminOutpostRequest,
  AdminSensorRequest,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSession,
  DashboardData,
  EquipmentUsageRequest,
  EquipmentUsageResponse,
  FireAlert,
  HealthData,
  MapOutpost,
  MapSensor,
  MapSnapshot,
  SensorReading,
} from '../types/api'

const AUTH_TOKEN_KEY = 'ff.auth.token'
const AUTH_USER_KEY = 'ff.auth.user'

export class ApiError extends Error {
  status: number
  path: string

  constructor(path: string, status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.path = path
    this.status = status
  }
}

export function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getAuthSession(): AuthSession | null {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
  const userJson = window.localStorage.getItem(AUTH_USER_KEY)
  if (!token || !userJson) {
    return null
  }

  try {
    const parsed = JSON.parse(userJson) as { username: string; displayName?: string; role: string; assignedZone?: string }
    return {
      token,
      username: parsed.username,
      displayName: parsed.displayName ?? parsed.username,
      role: parsed.role,
      assignedZone: parsed.assignedZone,
    }
  } catch {
    return null
  }
}

export function saveAuthSession(response: AuthLoginResponse): AuthSession {
  window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username: response.username, displayName: response.displayName, role: response.role, assignedZone: response.assignedZone }))
  return {
    token: response.token,
    username: response.username,
    displayName: response.displayName,
    role: response.role,
    assignedZone: response.assignedZone,
  }
}

export function updateAuthSession(session: AuthSession) {
  window.localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({ username: session.username, displayName: session.displayName, role: session.role, assignedZone: session.assignedZone }),
  )
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

function withParams(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) {
    return path
  }

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query.length > 0 ? `${path}?${query}` : path
}

async function fetchJson<T>(
  path: string,
  options?: {
    signal?: AbortSignal
    params?: Record<string, string | number | undefined>
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
  },
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  const externalSignal = options?.signal
  const onAbort = () => controller.abort()
  externalSignal?.addEventListener('abort', onAbort, { once: true })

  const token = getAuthToken()
  const mergedHeaders: Record<string, string> = {
    ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${withParams(path, options?.params)}`, {
      method: options?.method ?? 'GET',
      headers: mergedHeaders,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', onAbort)
  }

  const responseText = await response.text()

  if (!response.ok) {
    const detail = responseText.trim()
    throw new ApiError(
      path,
      response.status,
      detail
        ? `Request failed for ${path}: ${response.status} ${response.statusText} - ${detail}`
        : `Request failed for ${path}: ${response.status} ${response.statusText}`,
    )
  }

  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}

export const apiClient = {
  login: (body: AuthLoginRequest, signal?: AbortSignal) =>
    fetchJson<AuthLoginResponse>('/auth/login', { signal, method: 'POST', body }),
  getMap: (signal?: AbortSignal) => fetchJson<MapSnapshot>('/map', { signal }),
  getDashboard: (signal?: AbortSignal) => fetchJson<DashboardData>('/dashboard', { signal }),
  getHealth: (signal?: AbortSignal) => fetchJson<HealthData>('/health', { signal }),
  createSensor: (body: AdminSensorRequest, signal?: AbortSignal) =>
    fetchJson<MapSensor>('/admin/sensors', { signal, method: 'POST', body }),
  createOutpost: (body: AdminOutpostRequest, signal?: AbortSignal) =>
    fetchJson<MapOutpost>('/admin/outposts', { signal, method: 'POST', body }),
  useOutpostEquipment: (outpostId: string, body: EquipmentUsageRequest, signal?: AbortSignal) =>
    fetchJson<EquipmentUsageResponse>(`/admin/outposts/${encodeURIComponent(outpostId)}/equipment/use`, {
      signal,
      method: 'POST',
      body,
    }),
  getAlertsHistory: (limit = 24, zone?: string, signal?: AbortSignal) =>
    fetchJson<FireAlert[]>('/alerts/history', {
      signal,
      params: { limit, zone },
    }),
  getReadingsHistory: (limit = 80, zone?: string, signal?: AbortSignal) =>
    fetchJson<SensorReading[]>('/readings/history', {
      signal,
      params: { limit, zone },
    }),
  getAccountProfile: (signal?: AbortSignal) => fetchJson<AccountProfile>('/account', { signal }),
  updateAccountProfile: (body: AccountProfileUpdateRequest, signal?: AbortSignal) =>
    fetchJson<AccountProfile>('/account/profile', { signal, method: 'PUT', body }),
  changeAccountPassword: (body: AccountPasswordChangeRequest, signal?: AbortSignal) =>
    fetchJson<AccountProfile>('/account/password', { signal, method: 'PUT', body }),
  deleteOutpost: (outpostId: string, signal?: AbortSignal) =>
    fetchJson<void>(`/admin/outposts/${encodeURIComponent(outpostId)}`, { signal, method: 'DELETE' }),
}
