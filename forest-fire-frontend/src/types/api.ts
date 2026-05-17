export type SensorType = 'THERMAL' | 'SMOKE' | 'HUMIDITY' | string

export interface SensorReading {
  sensorId: string
  sensorType: SensorType
  zone: string
  location: string
  value: number
  unit: string
  status: string
  timestamp: string
  dangerThreshold: number
  latitude?: number
  longitude?: number
}

export interface MapSensor extends SensorReading {
  model: string
  latitude: number
  longitude: number
  coverageRadiusKm: number
  createdByRole: string
}

export interface MapOutpost {
  outpostId: string
  outpostName: string
  zone: string
  latitude: number
  longitude: number
  employeeCount: number
  createdByRole: string
  operationalRole: string
  coverageRadiusKm: number
  availableEquipment: string[]
}

export interface AccountProfile {
  username: string
  displayName: string
  role: 'EMPLOYEE' | 'HEAD' | string
  assignedZone?: string
}

export interface MapResponsePlan {
  nearestOutpostName: string
  nearestOutpostZone: string
  distanceKm: number
  predictedImpactRadiusKm: number
  predictedImpactAreaSqKm: number
  responseMode: string
  manpowerRequired: number
  uavCount: number
  etaMinutes: number
  summary: string
}

export interface AdminSensorRequest {
  zoneName: string
  sensorType: 'THERMAL' | 'SMOKE' | 'HUMIDITY' | string
  model: string
  location: string
  latitude: number
  longitude: number
  coverageRadiusKm: number
  createdByRole?: string
}

export interface AdminOutpostRequest {
  outpostName: string
  zoneName: string
  latitude: number
  longitude: number
  employeeCount: number
  createdByRole?: string
  operationalRole: string
  coverageRadiusKm: number
  equipment: string[]
  employeeUsername?: string
  employeePassword?: string
}

export interface EquipmentUsageRequest {
  equipmentName: string
  employeeId: string
  purpose: string
}

export interface EquipmentUsageResponse {
  outpostId: string
  equipmentName: string
  employeeId: string
  purpose: string
  status: string
  usedAt: string
}

export interface AuthLoginRequest {
  username: string
  password: string
}

export interface AuthLoginResponse {
  token: string
  tokenType: string
  username: string
  displayName: string
  role: 'EMPLOYEE' | 'HEAD' | string
  expiresInMs: number
  assignedZone?: string
}

export interface AuthSession {
  token: string
  username: string
  displayName: string
  role: 'EMPLOYEE' | 'HEAD' | string
  assignedZone?: string
}

export interface ZoneData {
  zoneName: string
  state: string
  description: string
  latitude: number
  longitude: number
  sensorReadings?: SensorReading[]
  sensors?: MapSensor[]
  outpost?: MapOutpost
  responsePlan?: MapResponsePlan
  overallStatus: string
  fireChancePercent: number
  hasActiveAlert: boolean
}

export interface FireAlert {
  alertId: string
  zone: string
  alertLevel: string
  message: string
  fireChancePercent: number
  triggeredSensors: string[]
  timestamp: string
  resolved: boolean
}

export interface MapSnapshot {
  generatedAt: string
  zones: ZoneData[]
  outposts: MapOutpost[]
  totalSensors: number
  safeSensors: number
  warningSensors: number
  dangerSensors: number
}

export interface DashboardData {
  zones: ZoneData[]
  activeAlerts: FireAlert[]
  totalAlerts: number
  timestamp: string
  criticalZones: number
}

export interface HealthData {
  service: string
  timestamp: string
  port: number
  status: string
  database: string
  zoneCount: number
}

export interface AccountProfileUpdateRequest {
  displayName: string
}

export interface AccountPasswordChangeRequest {
  currentPassword: string
  newPassword: string
}
