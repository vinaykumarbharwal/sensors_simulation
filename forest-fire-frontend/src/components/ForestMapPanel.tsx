import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { Circle, MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { divIcon, icon, latLngBounds, type LatLngBoundsExpression, type LatLngExpression } from 'leaflet'
import { apiClient, getAuthSession } from '../api/client'
import type { AdminOutpostRequest, AdminSensorRequest, MapSensor, MapSnapshot, ZoneData } from '../types/api'

interface ForestMapPanelProps {
  snapshot: MapSnapshot
  onZoneSelect: (zone: ZoneData) => void
  role: string
  onSensorCreated?: (s: MapSensor) => void
}


type LayerKey = 'sensors' | 'outposts' | 'coverage' | 'impact'
type MapPoint = [number, number]

const statusPalette: Record<string, { fill: string; border: string; label: string }> = {
  SAFE: { fill: '#27AE60', border: '#EAF5EE', label: 'Safe' },
  WARNING: { fill: '#E67E22', border: '#FFF3E2', label: 'Warning' },
  DANGER: { fill: '#E53E3E', border: '#FEF2F2', label: 'Danger' },
  CRITICAL: { fill: '#E53E3E', border: '#FEF2F2', label: 'Critical' },
}

function statusTone(status: string) {
  return statusPalette[status] ?? statusPalette.SAFE
}

function point(lat: number, lon: number): LatLngExpression {
  return [lat, lon]
}

function squaredDistance(a: MapPoint, b: MapPoint): number {
  const dLat = a[0] - b[0]
  const dLng = a[1] - b[1]
  return dLat * dLat + dLng * dLng
}

function getAutoZone(lat: number, lng: number): string {
  const zone = getZoneForPoint([lat, lng])
  return zone ?? 'Central India'
}

const ZONE_BOUNDARIES: Record<string, MapPoint[]> = {
  'North India': [
    [26.0, 67.5],
    [30.0, 68.2],
    [34.8, 71.0],
    [37.0, 77.0],
    [36.8, 84.5],
    [35.5, 91.5],
    [32.8, 96.0],
    [28.2, 93.0],
    [25.4, 88.5],
    [24.5, 80.5],
    [24.8, 72.5],
  ],
  'West India': [
    [8.0, 68.0],
    [8.4, 74.0],
    [11.5, 76.0],
    [16.5, 76.5],
    [21.5, 75.5],
    [26.0, 73.5],
    [30.5, 71.0],
    [31.8, 68.5],
    [24.0, 67.8],
  ],
  'Central India': [
    [18.0, 73.5],
    [21.0, 74.5],
    [24.5, 76.0],
    [27.0, 79.5],
    [28.2, 83.0],
    [26.8, 85.5],
    [23.0, 84.0],
    [19.5, 80.5],
    [17.8, 76.8],
  ],
  'East India': [
    [20.0, 83.5],
    [22.5, 85.0],
    [25.5, 87.0],
    [28.5, 90.0],
    [31.8, 94.5],
    [29.5, 97.0],
    [24.5, 96.5],
    [20.0, 93.0],
    [18.5, 88.0],
  ],
  'South India': [
    [6.0, 68.5],
    [6.0, 89.0],
    [8.5, 92.5],
    [12.5, 91.5],
    [16.5, 89.0],
    [19.0, 84.0],
    [19.5, 77.5],
    [17.0, 71.0],
    [10.5, 67.8],
  ],
}

const INDIA_LAND_POLYGON: MapPoint[] = [
  [6.0, 68.0],
  [8.0, 67.5],
  [11.0, 68.0],
  [14.5, 69.0],
  [19.0, 68.5],
  [21.5, 69.5],
  [24.5, 70.5],
  [27.5, 69.5],
  [30.5, 70.0],
  [33.5, 72.5],
  [35.5, 76.5],
  [36.5, 80.5],
  [35.5, 85.5],
  [33.5, 90.0],
  [30.0, 93.0],
  [26.0, 95.0],
  [22.0, 93.5],
  [18.5, 91.5],
  [14.5, 92.5],
  [10.5, 92.0],
  [8.0, 89.5],
  [6.0, 86.5],
  [5.5, 79.5],
  [6.0, 72.0],
]

function getZoneBoundaryPolygon(zoneName: string): LatLngExpression[] {
  return ZONE_BOUNDARIES[zoneName] ?? ZONE_BOUNDARIES['Central India']
}

function isPointInsidePolygon(pointToCheck: MapPoint, polygon: MapPoint[]) {
  const [lat, lng] = pointToCheck
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [currentLat, currentLng] = polygon[i]
    const [previousLat, previousLng] = polygon[j]
    const crossesEdge = (currentLng > lng) !== (previousLng > lng)
      && lat < ((previousLat - currentLat) * (lng - currentLng)) / ((previousLng - currentLng) || 1e-9) + currentLat

    if (crossesEdge) {
      inside = !inside
    }
  }

  return inside
}

function getZoneForPoint(pointToCheck: MapPoint) {
  if (!isPointInsidePolygon(pointToCheck, INDIA_LAND_POLYGON)) {
    return null
  }

  for (const zoneName of Object.keys(ZONE_BOUNDARIES)) {
    if (isPointInsidePolygon(pointToCheck, ZONE_BOUNDARIES[zoneName])) {
      return zoneName
    }
  }

  return null
}

function createZoneIcon(zone: ZoneData) {
  const tone = statusTone(zone.overallStatus)
  return divIcon({
    className: 'forest-marker forest-marker-zone',
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:24px;
        height:24px;
        border-radius:50%;
        border:2px solid #FFFFFF;
        background:${tone.fill};
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        position: relative;
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  })
}

function createSensorIcon(sensor: MapSensor) {
  const tone = statusTone(sensor.status)
  const type = (sensor.sensorType || '').toUpperCase()
  let iconUrl = ''
  if (type === 'THERMAL') {
    iconUrl = '/assets/thermal.png' // user-provided thermometer PNG
  } else if (type === 'SMOKE') {
    iconUrl = '/assets/smoke.png' // user-provided smoke PNG (CO2 cloud)
  } else if (type === 'HUMIDITY') {
    iconUrl = '/assets/humidity.png' // user-provided humidity PNG
  } else {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'>
      <circle cx='12' cy='12' r='6' fill='%23ffffff' stroke='${tone.fill}' stroke-width='1.6' />
      <circle cx='12' cy='12' r='2' fill='${tone.fill}' />
    </svg>`
    iconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  return icon({
    iconUrl,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
    className: 'forest-marker-graphic',
  })
}

function createOutpostIcon() {
  return divIcon({
    className: 'forest-marker forest-marker-outpost',
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:32px;
        height:32px;
        border-radius:8px;
        border:2px solid #FFFFFF;
        background:#1C2B22;
        color:white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size:14px;
      ">
        ⛺
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12],
  })
}

function MapViewportController({ points }: { points: LatLngExpression[] }) {
  const map = useMap()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    if (points.length === 0) {
      map.setView([22.5, 79.5], 5)
      initializedRef.current = true
      return
    }

    if (points.length === 1) {
      map.setView(points[0], 7)
      initializedRef.current = true
      return
    }

    map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 8 })
    initializedRef.current = true
  }, [map, points])

  useEffect(() => {
    if (points.length < 2) {
      map.setMinZoom(4)
      return
    }

    const bounds = latLngBounds(points)
    const minZoom = map.getBoundsZoom(bounds, false)
    map.setMinZoom(Math.max(4, minZoom))
  }, [map, points])

  return null
}

function MapPlacementController({ enabled, onPick }: { enabled: boolean; onPick: (point: MapPoint) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleContextMenu = (event: any) => {
      if (event.originalEvent?.preventDefault) {
        event.originalEvent.preventDefault()
      }
      onPick([event.latlng.lat, event.latlng.lng])
    }

    map.on('contextmenu', handleContextMenu)
    return () => {
      map.off('contextmenu', handleContextMenu)
    }
  }, [enabled, map, onPick])

  return null
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-canvas px-2 py-2 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary dark:text-slate-400">{label}</p>
      <p className="truncate text-[11px] font-bold text-text-primary dark:text-white">{value}</p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

export function ForestMapPanel({ snapshot, onZoneSelect, role, onSensorCreated }: ForestMapPanelProps) {
  const normalizedRole = role.toUpperCase()
  const isEmployee = normalizedRole === 'EMPLOYEE'
  const isHead = normalizedRole === 'HEAD'
  const session = getAuthSession()
  const employeeAssignedZoneName = session?.assignedZone

  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    sensors: true,
    outposts: true,
    coverage: true,
    impact: true,
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [savingOutpost, setSavingOutpost] = useState(false)
  const [savingSensor, setSavingSensor] = useState(false)
  const [localSensors, setLocalSensors] = useState<MapSensor[]>([])
  const [placementPoint, setPlacementPoint] = useState<MapPoint | null>(null)
  const [selectedZoneName, setSelectedZoneName] = useState('')
  const [addOutpostMode, setAddOutpostMode] = useState(false)
  const [outpostForm, setOutpostForm] = useState<AdminOutpostRequest>({
    outpostName: '',
    zoneName: '',
    latitude: 0,
    longitude: 0,
    employeeCount: 15,
    operationalRole: 'MANPOWER_AND_UAV',
    coverageRadiusKm: 18,
    equipment: ['Fire Suit', 'Water Tanker', 'Thermal Drone'],
  })
  const [sensorForm, setSensorForm] = useState<AdminSensorRequest>({
    zoneName: '',
    sensorType: 'THERMAL',
    model: 'Vanrakshak Sentinel X1',
    location: 'field node',
    latitude: 0,
    longitude: 0,
    coverageRadiusKm: 6.5,
  })

  const zones = snapshot.zones ?? []
  const outposts = snapshot.outposts ?? []
  const headMapMode = isHead && addOutpostMode ? 'full' : 'focused'
  const activeZone = zones.find((zone) => zone.hasActiveAlert)
    ?? zones.slice().sort((left, right) => right.fireChancePercent - left.fireChancePercent)[0]
  const focusedZone = activeZone ?? zones[0] ?? null

  const employeeAssignedZone = useMemo(() => {
    return zones.find(z => z.zoneName === employeeAssignedZoneName) ?? null
  }, [zones, employeeAssignedZoneName])

  const employeePrimaryOutpost = employeeAssignedZone?.outpost ?? outposts[0] ?? null
  const employeeNearbyOutposts = useMemo(() => {
    if (!employeePrimaryOutpost) {
      return []
    }

    const origin: MapPoint = [employeePrimaryOutpost.latitude, employeePrimaryOutpost.longitude]
    return outposts
      .slice()
      .sort((left, right) => squaredDistance([left.latitude, left.longitude], origin) - squaredDistance([right.latitude, right.longitude], origin))
      .slice(0, 3)
  }, [employeePrimaryOutpost, outposts])

  const headFocusedZones = useMemo(() => {
    if (!focusedZone) {
      return zones
    }

    const origin: MapPoint = [focusedZone.latitude, focusedZone.longitude]
    return zones
      .slice()
      .sort((left, right) => squaredDistance([left.latitude, left.longitude], origin) - squaredDistance([right.latitude, right.longitude], origin))
      .slice(0, 5)
  }, [focusedZone, zones])

  const displayZones = useMemo(() => {
    if (isEmployee) {
      return employeeAssignedZone ? [employeeAssignedZone] : []
    }

    if (isHead && headMapMode === 'focused') {
      return headFocusedZones
    }

    return zones
  }, [employeeAssignedZone, headFocusedZones, headMapMode, isEmployee, isHead, zones])

  const displayOutposts = useMemo(() => {
    if (isEmployee) {
      if (employeeNearbyOutposts.length > 0) {
        return employeeNearbyOutposts
      }
      return employeePrimaryOutpost ? [employeePrimaryOutpost] : []
    }

    if (isHead && headMapMode === 'focused') {
      const zoneOutpostIds = new Set(headFocusedZones.map((zone) => zone.outpost?.outpostId).filter(Boolean))
      return outposts.filter((outpost) => zoneOutpostIds.has(outpost.outpostId))
    }

    return outposts
  }, [employeeNearbyOutposts, employeePrimaryOutpost, headFocusedZones, headMapMode, isEmployee, isHead, outposts])

  const mapPoints = useMemo(() => {
    const points: LatLngExpression[] = []
    displayZones.forEach((zone) => points.push(point(zone.latitude, zone.longitude)))
    displayOutposts.forEach((outpost) => points.push(point(outpost.latitude, outpost.longitude)))
    return points
  }, [displayOutposts, displayZones])


  useEffect(() => {
    const isEmployee = session?.role?.toUpperCase() === 'EMPLOYEE'
    const assignedZoneName = session?.assignedZone

    let initialZone = selectedZoneName ? zones.find((zone) => zone.zoneName === selectedZoneName) : null

    if (!initialZone) {
      if (isEmployee && assignedZoneName) {
        initialZone = zones.find((z) => z.zoneName === assignedZoneName)
      } else {
        initialZone = activeZone ?? zones[0]
      }
    }

    if (!initialZone) {
      return
    }

    if (selectedZoneName !== initialZone.zoneName) {
      setSelectedZoneName(initialZone.zoneName)
    }

    setOutpostForm((previous) => {
      const next = {
        ...previous,
        outpostName: previous.outpostName || `${initialZone.zoneName} Outpost`,
        zoneName: initialZone.zoneName,
        latitude: placementPoint ? placementPoint[0] : initialZone.outpost?.latitude ?? initialZone.latitude,
        longitude: placementPoint ? placementPoint[1] : initialZone.outpost?.longitude ?? initialZone.longitude,
      }
      // Only update if something actually changed
      const same = next.outpostName === previous.outpostName && next.zoneName === previous.zoneName && next.latitude === previous.latitude && next.longitude === previous.longitude
      return same ? previous : next
    })

    setSensorForm((previous) => {
      const next = {
        ...previous,
        zoneName: initialZone.zoneName,
        latitude: placementPoint ? placementPoint[0] : initialZone.latitude,
        longitude: placementPoint ? placementPoint[1] : initialZone.longitude,
      }
      const same = next.zoneName === previous.zoneName && next.latitude === previous.latitude && next.longitude === previous.longitude
      return same ? previous : next
    })
  }, [zones, activeZone, selectedZoneName, session, placementPoint])

  const selectedZone = zones.find((zone) => zone.zoneName === selectedZoneName) ?? activeZone ?? null

  const saveOutpost = async () => {
    if (!isHead) {
      return
    }

    if (!selectedZone) {
      setStatusMessage('Select a zone first.')
      return
    }

    setSavingOutpost(true)
    setStatusMessage(null)
    try {
      await apiClient.createOutpost({
        ...outpostForm,
        zoneName: selectedZone.zoneName,
      })
      setStatusMessage(`Outpost added for ${selectedZone.zoneName}. Refreshing map...`)
      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create outpost')
      setSavingOutpost(false)
    }
  }

  const saveSensor = async () => {
    if (!isEmployee) {
      return
    }

    const assignedZone = getAuthSession()?.assignedZone
    const assignedZonePolygon = employeeAssignedZone ? getZoneBoundaryPolygon(employeeAssignedZone.zoneName) : null
    const sensorPoint: MapPoint = [sensorForm.latitude, sensorForm.longitude]
    if (!sensorForm.zoneName) {
      setStatusMessage('Select a zone before adding a sensor.')
      return
    }

    if (assignedZone && sensorForm.zoneName !== assignedZone) {
      setStatusMessage(`Action Denied: You can only add sensors to ${assignedZone}.`) 
      return
    }

    if (!isPointInsidePolygon(sensorPoint, INDIA_LAND_POLYGON)) {
      setStatusMessage('Action Denied: Sensor coordinates must stay on land inside India, not in water.')
      return
    }

    if (assignedZonePolygon && !isPointInsidePolygon(sensorPoint, assignedZonePolygon as MapPoint[])) {
      setStatusMessage(`Action Denied: Sensor coordinates must stay inside ${assignedZone ?? sensorForm.zoneName}.`)
      return
    }

    // Validate coverage radius
    if (!sensorForm.coverageRadiusKm || sensorForm.coverageRadiusKm <= 0) {
      setStatusMessage('Please provide a valid coverage radius (km) for the sensor.')
      return
    }

    setSavingSensor(true)
    setStatusMessage(null)
    try {
      const created = await apiClient.createSensor(sensorForm)
      setLocalSensors((prev) => [...prev, created])
      onSensorCreated?.(created)
      setStatusMessage(`Sensor added for ${sensorForm.zoneName}.`)
      setSavingSensor(false)
      setPlacementPoint(null)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create sensor')
      setSavingSensor(false)
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => isEmployee)
  const sidebarForcedOpen = addOutpostMode || statusMessage !== null
  const sidebarEffectiveOpen = sidebarOpen || sidebarForcedOpen
  const [actionMenuOpen, setActionMenuOpen] = useState(false)

  if (zones.length === 0) {
    return (
      <section className="card rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operations Map</h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No zone telemetry available yet.</p>
      </section>
    )
  }

  return (
    <section className="card overflow-hidden rounded-2xl">
      <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800/80 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
          Live map intelligence
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Operations Map</h2>
      </div>

      <div className={(sidebarOpen || sidebarForcedOpen) ? "grid gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]" : "block"}>
        <div className="relative min-h-[430px] bg-slate-100 dark:bg-slate-950 sm:min-h-[520px]">
          {/* ─── Action Menu Button (top-right of map) ─── */}
          <div className="absolute top-3 right-3 z-[600]">
            {sidebarEffectiveOpen ? (
              /* When sidebar is open, show a simple collapse button */
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false)
                  setAddOutpostMode(false)
                  setPlacementPoint(null)
                  setStatusMessage(null)
                  setActionMenuOpen(false)
                }}
                title="Collapse sidebar"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/30 bg-white/95 text-slate-700 shadow-lg hover:bg-white transition-all backdrop-blur"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : (
              /* When sidebar is collapsed, show the + button with dropdown */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  title="Add outpost, sensor, or expand panel"
                  className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border text-white shadow-lg transition-all backdrop-blur ${
                    actionMenuOpen
                      ? 'bg-emerald-600 border-emerald-500 rotate-45 scale-95'
                      : 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500/50 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-500/30 hover:shadow-xl'
                  }`}
                >
                  <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>

                {/* Dropdown Action Menu */}
                {actionMenuOpen && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <div className="fixed inset-0 z-[-1]" onClick={() => setActionMenuOpen(false)} />
                    <div className="absolute top-12 right-0 w-56 rounded-xl border border-slate-200/80 bg-white shadow-2xl shadow-black/15 overflow-hidden animate-fade-in backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900"
                         style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Quick Actions</p>
                      </div>

                      {/* Add Outpost — HEAD only */}
                      {isHead && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionMenuOpen(false)
                            setAddOutpostMode(true)
                            setSidebarOpen(true)
                            setStatusMessage('Right-click anywhere on the map to place your outpost, or fill details in the sidebar.')
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50 transition-colors group dark:text-white dark:hover:bg-emerald-950/40"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 text-base group-hover:bg-emerald-200 transition dark:bg-emerald-900/50 dark:text-emerald-300">⛺</span>
                          <div>
                            <p className="leading-tight">Add Outpost</p>
                            <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500">Deploy a new field outpost</p>
                          </div>
                        </button>
                      )}

                      {/* Add Sensor — EMPLOYEE only */}
                      {isEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionMenuOpen(false)
                            setSidebarOpen(true)
                            setStatusMessage('Right-click on the map inside your assigned zone to place a sensor.')
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-blue-50 transition-colors group dark:text-white dark:hover:bg-blue-950/40"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-700 text-base group-hover:bg-blue-200 transition dark:bg-blue-900/50 dark:text-blue-300">🌡️</span>
                          <div>
                            <p className="leading-tight">Add Sensor</p>
                            <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500">Deploy sensor in your zone</p>
                          </div>
                        </button>
                      )}

                      {/* Expand Panel — always visible */}
                      <button
                        type="button"
                        onClick={() => {
                          setActionMenuOpen(false)
                          setSidebarOpen(true)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors group border-t border-slate-100 dark:text-white dark:hover:bg-slate-800/50 dark:border-slate-800"
                      >
                        <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 text-base group-hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                        </span>
                        <div>
                          <p className="leading-tight">Expand Panel</p>
                          <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500">View zone details sidebar</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <MapContainer
            center={displayZones[0] ? [displayZones[0].latitude, displayZones[0].longitude] : [22.5, 79.5]}
            zoom={isEmployee ? 8 : 5}
            minZoom={4}
            className="h-[430px] w-full sm:h-[520px]"
            scrollWheelZoom
            preferCanvas
          >
            <MapViewportController points={mapPoints} />
            {(isEmployee || isHead) && (
              <MapPlacementController
                enabled
                onPick={(nextPoint) => {
                  if (isHead) {
                    const autoZone = getZoneForPoint(nextPoint)
                    if (!autoZone) {
                      setStatusMessage('Outpost position must be on land inside India and inside a zone boundary.')
                      return
                    }

                    setPlacementPoint(nextPoint)
                    setAddOutpostMode(true)
                    setSelectedZoneName(autoZone)
                    setOutpostForm((previous) => ({
                      ...previous,
                      latitude: nextPoint[0],
                      longitude: nextPoint[1],
                      zoneName: autoZone,
                    }))
                    setStatusMessage(`Outpost position marked in ${autoZone}. Fill details in the right sidebar and save.`)
                  } else {
                    const sessionZone = getAuthSession()?.assignedZone;
                    if (!isPointInsidePolygon(nextPoint, INDIA_LAND_POLYGON)) {
                      setStatusMessage('⚠️ Action Denied: You cannot place a sensor in water.')
                      return
                    }

                    const assignedZonePolygon = employeeAssignedZone ? getZoneBoundaryPolygon(employeeAssignedZone.zoneName) : null
                    if (sessionZone && assignedZonePolygon && !isPointInsidePolygon(nextPoint, assignedZonePolygon as MapPoint[])) {
                      setStatusMessage(`⚠️ Action Denied: You are only authorized to deploy sensors inside ${sessionZone}.`)
                      return
                    }

                    setPlacementPoint(nextPoint)
                    setSensorForm((previous) => ({
                      ...previous,
                      zoneName: sessionZone ?? getAutoZone(nextPoint[0], nextPoint[1]),
                      latitude: nextPoint[0],
                      longitude: nextPoint[1],
                      coverageRadiusKm: previous.coverageRadiusKm || 6.5,
                    }))
                    setStatusMessage('Map point selected. Fill details in the right sidebar and save the sensor.')
                  }
                }}
              />
            )}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {displayZones.map((zone) => {
              const tone = statusTone(zone.overallStatus)
              const sensors = (zone.sensors ?? []).concat(localSensors.filter((s) => s.zone === zone.zoneName))

              return (
                <div key={zone.zoneName}>
                  <Marker
                    position={point(zone.latitude, zone.longitude)}
                    icon={createZoneIcon(zone)}
                    eventHandlers={{
                      click: () => {
                        onZoneSelect(zone)
                        if (isHead && addOutpostMode) {
                          setSelectedZoneName(zone.zoneName)
                          setPlacementPoint([zone.outpost?.latitude ?? zone.latitude, zone.outpost?.longitude ?? zone.longitude])
                          setOutpostForm((previous) => ({
                            ...previous,
                            zoneName: zone.zoneName,
                            outpostName: previous.outpostName || `${zone.zoneName} Outpost`,
                          }))
                        }
                        if (isEmployee) {
                          setSelectedZoneName(zone.zoneName)
                          setSensorForm((previous) => ({
                            ...previous,
                            zoneName: zone.zoneName,
                            latitude: zone.latitude,
                            longitude: zone.longitude,
                          }))
                        }
                      },
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px] space-y-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Forest Area</p>
                          <h3 className="text-base font-bold text-text-primary">{zone.zoneName}</h3>
                          <p className="text-sm text-text-secondary">{zone.state}</p>
                        </div>
                        <p className="text-sm text-text-secondary">{zone.description}</p>
                        <button
                          type="button"
                          className="w-full rounded-lg bg-[var(--accent-secondary)] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/10"
                          onClick={() => onZoneSelect(zone)}
                        >
                          View area details
                        </button>
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -12]} permanent sticky={false}>
                      <span className="text-xs font-bold">
                        {zone.zoneName} • {tone.label}
                      </span>
                    </Tooltip>
                  </Marker>

                  <Polygon
                    positions={getZoneBoundaryPolygon(zone.zoneName)}
                    pathOptions={{
                      color: tone.fill,
                      fillColor: tone.fill,
                      fillOpacity: 0.03,
                      weight: 2,
                      dashArray: '8 10',
                    }}
                  />

                  {visibleLayers.coverage && zone.outpost && (
                    <Circle
                      center={point(zone.outpost.latitude, zone.outpost.longitude)}
                      radius={zone.outpost.coverageRadiusKm * 1000}
                      pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.08, weight: 1.5, dashArray: '6 8' }}
                    />
                  )}

                  {visibleLayers.impact && zone.responsePlan && (zone.hasActiveAlert || zone.fireChancePercent >= 45) && (
                    <Circle
                      center={point(zone.latitude, zone.longitude)}
                      radius={zone.responsePlan.predictedImpactRadiusKm * 1000}
                      pathOptions={{ color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.12, weight: 2.5, dashArray: '8 10' }}
                    />
                  )}

                  {visibleLayers.sensors &&
                    sensors.map((sensor) => {
                      const coverageCenter = point(sensor.latitude, sensor.longitude)

                      return (
                        <div key={sensor.sensorId}>
                          {visibleLayers.coverage && (
                            <Circle
                              center={coverageCenter}
                              radius={sensor.coverageRadiusKm * 1000}
                              pathOptions={{ color: tone.fill, fillColor: tone.fill, fillOpacity: 0.06, weight: 1 }}
                            />
                          )}
                          <Marker
                            position={coverageCenter}
                            icon={createSensorIcon(sensor)}
                            eventHandlers={{ click: () => onZoneSelect(zone) }}
                          >
                            <Popup>
                              <div className="min-w-[230px] space-y-2">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sensor</p>
                                  <h3 className="text-base font-black text-slate-900">{sensor.sensorId}</h3>
                                  <p className="text-sm text-slate-500">
                                    {sensor.sensorType} • {sensor.model}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <InfoCard label="Condition" value={sensor.status} />
                                  <InfoCard label="Area" value={`${sensor.coverageRadiusKm.toFixed(1)} km`} />
                                  <InfoCard label="Reading" value={`${sensor.value.toFixed(1)} ${sensor.unit}`} />
                                  <InfoCard label="Managed By" value={sensor.createdByRole} />
                                </div>
                                <button
                                  type="button"
                                  className="w-full rounded-lg bg-[var(--accent-secondary)] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/10"
                                  onClick={() => onZoneSelect(zone)}
                                >
                                  View full details
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        </div>
                      )
                    })}

                  {visibleLayers.outposts && zone.outpost && (
                    <Marker
                      position={point(zone.outpost.latitude, zone.outpost.longitude)}
                      icon={createOutpostIcon()}
                      eventHandlers={{ click: () => onZoneSelect(zone) }}
                    >
                      <Popup>
                        <div className="min-w-[230px] space-y-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Outpost</p>
                            <h3 className="text-base font-black text-slate-900">{zone.outpost.outpostName}</h3>
                            <p className="text-sm text-slate-500">{zone.outpost.zone}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <InfoCard label="Employees" value={`${zone.outpost.employeeCount}`} />
                            <InfoCard label="Radius" value={`${zone.outpost.coverageRadiusKm.toFixed(1)} km`} />
                            <InfoCard label="Created by" value={zone.outpost.createdByRole} />
                            <InfoCard label="Role" value={zone.outpost.operationalRole} />
                          </div>
                          <p className="text-xs text-slate-600">
                            Equipment: {zone.outpost.availableEquipment?.join(', ') || 'Not assigned'}
                          </p>
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white"
                            onClick={() => onZoneSelect(zone)}
                          >
                            Inspect response plan
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </div>
              )
            })}

            {isHead && addOutpostMode && placementPoint && (
              <Marker position={point(placementPoint[0], placementPoint[1])} icon={createOutpostIcon()}>
                <Popup>
                  <div className="min-w-[200px] space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending outpost position</p>
                    <p className="text-sm text-slate-700">Lat: {placementPoint[0].toFixed(4)}</p>
                    <p className="text-sm text-slate-700">Lng: {placementPoint[1].toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Layer Controls - Bottom Left Vertical Stack */}
          <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/85">
            <button
              type="button"
              onClick={() => setVisibleLayers((previous) => ({ ...previous, sensors: !previous.sensors }))}
              title="Toggle Sensors"
              className={`rounded-lg border p-2.5 text-lg transition ${
                visibleLayers.sensors
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500'
              }`}
            >
              🌡️
            </button>
            <button
              type="button"
              onClick={() => setVisibleLayers((previous) => ({ ...previous, outposts: !previous.outposts }))}
              title="Toggle Outposts"
              className={`rounded-lg border p-2.5 text-lg transition ${
                visibleLayers.outposts
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500'
              }`}
            >
              ⛺
            </button>
            <button
              type="button"
              onClick={() => setVisibleLayers((previous) => ({ ...previous, coverage: !previous.coverage }))}
              title="Toggle Coverage"
              className={`rounded-lg border p-2.5 text-lg transition ${
                visibleLayers.coverage
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500'
              }`}
            >
              🎯
            </button>
          </div>


          <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl border border-white/50 bg-white/90 px-4 py-3 text-xs text-slate-700 shadow-xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90 dark:text-slate-200">
            <p className="font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Map Layers</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <LegendDot color="#10b981" label="Safe" />
              <LegendDot color="#f59e0b" label="Warning" />
              <LegendDot color="#ef4444" label="Danger" />
              <LegendDot color="#1d4ed8" label="Outpost" />
            </div>
          </div>
        </div>

        {(sidebarOpen || sidebarForcedOpen) && (
          <aside className="border-t border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/60 lg:border-l lg:border-t-0 lg:p-5 overflow-y-auto max-h-[520px]">
            <div className="space-y-4">
              {statusMessage && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  {statusMessage}
                </div>
              )}

              {isEmployee && employeeAssignedZone && (
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/25">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Employee coverage scope</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{employeeAssignedZone.zoneName}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {employeeAssignedZone.responsePlan?.summary ??
                      'Operational map includes your outpost and nearest 2-3 outposts for field coordination.'}
                  </p>
                </div>
              )}

              {isHead && addOutpostMode && (
                <AddOutpostForm
                  zones={zones}
                  selectedZoneName={selectedZoneName}
                  outpostForm={outpostForm}
                  setOutpostForm={setOutpostForm}
                  placementPoint={placementPoint}
                  savingOutpost={savingOutpost}
                  saveOutpost={saveOutpost}
                  onCancel={() => {
                    setAddOutpostMode(false)
                    setPlacementPoint(null)
                    setStatusMessage(null)
                    setSidebarOpen(false)
                  }}
                />
              )}

              {isEmployee && (
                <AddSensorForm
                  displayZones={displayZones}
                  sensorForm={sensorForm}
                  setSensorForm={setSensorForm}
                  savingSensor={savingSensor}
                  saveSensor={saveSensor}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}

function AddOutpostForm({
  zones,
  selectedZoneName,
  outpostForm,
  setOutpostForm,
  placementPoint,
  savingOutpost,
  saveOutpost,
  onCancel,
}: {
  zones: ZoneData[]
  selectedZoneName: string
  outpostForm: AdminOutpostRequest
  setOutpostForm: React.Dispatch<React.SetStateAction<AdminOutpostRequest>>
  placementPoint: MapPoint | null
  savingOutpost: boolean
  saveOutpost: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Add outpost</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Right-click map to mark location, then complete details.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          title="Collapse sidebar"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        {/* Zone Selection */}
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Zone (Auto-Detected)</span>
          <select
            value={selectedZoneName}
            disabled
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="" disabled>
              Select zone
            </option>
            {zones.map((zone) => (
              <option key={zone.zoneName} value={zone.zoneName}>
                {zone.zoneName}
              </option>
            ))}
          </select>
        </label>

        {/* Outpost Name */}
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Outpost name</span>
          <input
            value={outpostForm.outpostName}
            onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, outpostName: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="e.g., Kullu North Base"
          />
        </label>

        {/* Location Fields - Read-Only */}
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="block uppercase tracking-wider">Latitude</span>
            <input
              type="text"
              value={placementPoint ? placementPoint[0].toFixed(4) : outpostForm.latitude.toFixed(4)}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="block uppercase tracking-wider">Longitude</span>
            <input
              type="text"
              value={placementPoint ? placementPoint[1].toFixed(4) : outpostForm.longitude.toFixed(4)}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </label>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-3 dark:border-slate-700" />

        {/* Employee Credentials Section */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Employee Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="block uppercase tracking-wider">Username</span>
              <input
                type="text"
                value={outpostForm.employeeUsername || ''}
                onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, employeeUsername: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="EMP-001"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="block uppercase tracking-wider">Password</span>
              <input
                type="password"
                value={outpostForm.employeePassword || ''}
                onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, employeePassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </label>
          </div>
        </div>


        {/* Other Details */}
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="block uppercase tracking-wider">Employees</span>
            <input
              type="number"
              min={1}
              value={outpostForm.employeeCount}
              onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, employeeCount: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="block uppercase tracking-wider">Coverage (km)</span>
            <input
              type="number"
              min={1}
              step="0.1"
              value={outpostForm.coverageRadiusKm}
              onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Operational role</span>
          <select
            value={outpostForm.operationalRole}
            onChange={(event) => setOutpostForm((previous: AdminOutpostRequest) => ({ ...previous, operationalRole: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="MANPOWER_AND_UAV">Manpower + UAV</option>
            <option value="MANPOWER_ONLY">Manpower Only</option>
            <option value="UAV_ONLY">UAV Only</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Equipment (comma separated)</span>
          <input
            value={outpostForm.equipment.join(', ')}
            onChange={(event) =>
              setOutpostForm((previous) => ({
                ...previous,
                equipment: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Fire Suit, Thermal Drone, Medical Kit"
          />
        </label>

        <button
          type="button"
          disabled={savingOutpost || !selectedZoneName}
          onClick={saveOutpost}
          className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          💾 Save Outpost
        </button>
      </div>
    </div>
  )
}

function AddSensorForm({
  displayZones,
  sensorForm,
  setSensorForm,
  savingSensor,
  saveSensor,
}: {
  displayZones: ZoneData[]
  sensorForm: AdminSensorRequest
  setSensorForm: React.Dispatch<React.SetStateAction<AdminSensorRequest>>
  savingSensor: boolean
  saveSensor: () => void
}) {
  const session = getAuthSession();
  const isEmployee = session?.role === 'EMPLOYEE';
  const assignedZone = session?.assignedZone;

  useEffect(() => {
    if (isEmployee && assignedZone && sensorForm.zoneName !== assignedZone) {
      setSensorForm((prev) => ({ ...prev, zoneName: assignedZone }));
    }
  }, [isEmployee, assignedZone, sensorForm.zoneName, setSensorForm]);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Add sensor from map</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use the map pin-point location and complete the sensor details.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:col-span-2 xl:col-span-2">
          <span className="block uppercase tracking-wider">Zone</span>
          <select
            value={sensorForm.zoneName}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, zoneName: event.target.value }))}
            disabled={isEmployee && !!assignedZone}
            className={`w-full rounded-xl border px-3 py-2 text-sm ${isEmployee ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-900'} dark:border-slate-700 dark:bg-slate-900 dark:text-white`}
          >
            <option value="">Select zone</option>
            {displayZones.map((zone) => (
              <option key={zone.zoneName} value={zone.zoneName}>
                {zone.zoneName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Sensor type</span>
          <select
            value={sensorForm.sensorType}
            onChange={(event) =>
              setSensorForm((previous: AdminSensorRequest) => ({ ...previous, sensorType: event.target.value as 'THERMAL' | 'SMOKE' | 'HUMIDITY' }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="THERMAL">THERMAL</option>
            <option value="SMOKE">SMOKE</option>
            <option value="HUMIDITY">HUMIDITY</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Model</span>
          <input
            value={sensorForm.model}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, model: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:col-span-2 xl:col-span-2">
          <span className="block uppercase tracking-wider">Location label</span>
          <input
            value={sensorForm.location}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, location: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Latitude</span>
          <input
            type="number"
            step="0.0001"
            value={sensorForm.latitude}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, latitude: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="block uppercase tracking-wider">Longitude</span>
          <input
            type="number"
            step="0.0001"
            value={sensorForm.longitude}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, longitude: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:col-span-2 xl:col-span-2">
          <span className="block uppercase tracking-wider">Coverage radius (km)</span>
          <input
            type="number"
            min={0.5}
            step="0.1"
            value={sensorForm.coverageRadiusKm}
            onChange={(event) => setSensorForm((previous: AdminSensorRequest) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={
          savingSensor || !sensorForm.zoneName || (isEmployee && !!assignedZone && sensorForm.zoneName !== assignedZone)
        }
        onClick={saveSensor}
        className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save sensor
      </button>
    </div>
  )
}
