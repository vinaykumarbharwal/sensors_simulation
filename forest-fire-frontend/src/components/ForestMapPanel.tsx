import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { Circle, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { divIcon, latLngBounds, type LatLngBoundsExpression, type LatLngExpression } from 'leaflet'
import { apiClient, getAuthSession } from '../api/client'
import type { AdminOutpostRequest, AdminSensorRequest, MapSensor, MapSnapshot, ZoneData } from '../types/api'

interface ForestMapPanelProps {
  snapshot: MapSnapshot
  onZoneSelect: (zone: ZoneData) => void
  role: string
}


type LayerKey = 'sensors' | 'outposts' | 'coverage' | 'impact'
type MapPoint = [number, number]

const statusPalette: Record<string, { fill: string; border: string; label: string }> = {
  SAFE: { fill: '#27AE60', border: '#EAF5EE', label: 'Safe' },
  WARNING: { fill: '#E67E22', border: '#FFF3E2', label: 'Warning' },
  DANGER: { fill: '#E53E3E', border: '#FEF2F2', label: 'Danger' },
  CRITICAL: { fill: '#E53E3E', border: '#FEF2F2', label: 'Critical' },
}

const sensorIcons: Record<string, string> = {
  THERMAL: '🌡️',
  SMOKE: '💨',
  HUMIDITY: '💧',
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
  if (lat > 27.5) return 'North India';
  if (lat < 16.5) return 'South India';
  if (lng > 83.5) return 'East India';
  if (lng < 74.5) return 'West India';
  return 'Central India';
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
      ">
        ${zone.hasActiveAlert ? `<div class="animate-pulse-ring" style="color: ${tone.fill}"></div>` : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  })
}

function createSensorIcon(sensor: MapSensor) {
  const tone = statusTone(sensor.status)
  return divIcon({
    className: 'forest-marker forest-marker-sensor',
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:16px;
        height:16px;
        border-radius:50%;
        border:3px solid ${tone.fill};
        background:#FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        position: relative;
      ">
        ${sensor.status !== 'SAFE' ? `<div class="animate-pulse-ring" style="color: ${tone.fill}"></div>` : ''}
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -6],
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

export function ForestMapPanel({ snapshot, onZoneSelect, role }: ForestMapPanelProps) {
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

  const alertZones = useMemo(() => {
    return displayZones
      .filter((zone) => {
        if (isEmployee && employeeAssignedZoneName && zone.zoneName !== employeeAssignedZoneName) {
          return false
        }
        return zone.hasActiveAlert || (zone.sensors ?? []).some((sensor) => sensor.status === 'DANGER' || sensor.status === 'CRITICAL')
      })
      .sort((left, right) => right.fireChancePercent - left.fireChancePercent)
  }, [displayZones, isEmployee, employeeAssignedZoneName])

  const primaryAlertZone = alertZones[0]

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

    setSelectedZoneName(initialZone.zoneName)
    setOutpostForm((previous) => ({
      ...previous,
      outpostName: previous.outpostName || `${initialZone.zoneName} Outpost`,
      zoneName: initialZone.zoneName,
      latitude: placementPoint ? placementPoint[0] : initialZone.outpost?.latitude ?? initialZone.latitude,
      longitude: placementPoint ? placementPoint[1] : initialZone.outpost?.longitude ?? initialZone.longitude,
    }))
    setSensorForm((previous) => ({
      ...previous,
      zoneName: initialZone.zoneName,
      latitude: placementPoint ? placementPoint[0] : initialZone.latitude,
      longitude: placementPoint ? placementPoint[1] : initialZone.longitude,
    }))
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

    if (!sensorForm.zoneName) {
      setStatusMessage('Select a zone before adding a sensor.')
      return
    }

    setSavingSensor(true)
    setStatusMessage(null)
    try {
      await apiClient.createSensor(sensorForm)
      setStatusMessage(`Sensor added for ${sensorForm.zoneName}. Refreshing map...`)
      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create sensor')
      setSavingSensor(false)
    }
  }

  if (zones.length === 0) {
    return (
      <section className="card rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operations Map</h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No zone telemetry available yet.</p>
      </section>
    )
  }

  const showSidebar = isEmployee || addOutpostMode || statusMessage !== null

  return (
    <section className="card overflow-hidden rounded-2xl">
      <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800/80 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
          Live map intelligence
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Operations Map</h2>
      </div>

      <div className={showSidebar ? "grid gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]" : "block"}>
        <div className="relative min-h-[430px] bg-slate-100 dark:bg-slate-950 sm:min-h-[520px]">
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
                  setPlacementPoint(nextPoint)
                  if (isHead) {
                    setAddOutpostMode(true)
                    const autoZone = getAutoZone(nextPoint[0], nextPoint[1]);
                    setSelectedZoneName(autoZone);
                    setOutpostForm((previous) => ({
                      ...previous,
                      latitude: nextPoint[0],
                      longitude: nextPoint[1],
                      zoneName: autoZone,
                    }))
                    setStatusMessage(`Outpost position marked in ${autoZone}. Fill details in the right sidebar and save.`)
                  } else {
                    const sessionZone = getAuthSession()?.assignedZone;
                    if (sessionZone) {
                      const autoZone = getAutoZone(nextPoint[0], nextPoint[1]);
                      if (autoZone !== sessionZone) {
                        setStatusMessage(`⚠️ Action Denied: You are only authorized to deploy sensors in ${sessionZone}. You clicked ${autoZone}.`);
                        return;
                      }
                    }
                    setSensorForm((previous) => ({
                      ...previous,
                      latitude: nextPoint[0],
                      longitude: nextPoint[1],
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
              const sensors = zone.sensors ?? []

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

        {showSidebar && (
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
                  setSelectedZoneName={setSelectedZoneName}
                  outpostForm={outpostForm}
                  setOutpostForm={setOutpostForm}
                  placementPoint={placementPoint}
                  savingOutpost={savingOutpost}
                  saveOutpost={saveOutpost}
                  onCancel={() => {
                    setAddOutpostMode(false)
                    setPlacementPoint(null)
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
  setSelectedZoneName,
  outpostForm,
  setOutpostForm,
  placementPoint,
  employees,
  setEmployees,
  showEmployeeForm,
  setShowEmployeeForm,
  newEmployee,
  setNewEmployee,
  sensors,
  setSensors,
  showSensorForm,
  setShowSensorForm,
  newSensor,
  setNewSensor,
  savingOutpost,
  saveOutpost,
  onCancel,
}: {
  zones: ZoneData[]
  selectedZoneName: string
  setSelectedZoneName: React.Dispatch<React.SetStateAction<string>>
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
        disabled={savingSensor || !sensorForm.zoneName}
        onClick={saveSensor}
        className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save sensor
      </button>
    </div>
  )
}
