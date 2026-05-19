import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiClient, getAuthSession } from '../api/client'
import type { AdminOutpostRequest, AdminSensorRequest, MapSnapshot, ZoneData } from '../types/api'

interface OperationsAdminPanelProps {
  snapshot: MapSnapshot
  userRole: string
  onRefresh?: () => void
}

type TabKey = 'sensor' | 'outpost'

const sensorTypes = ['THERMAL', 'SMOKE', 'HUMIDITY'] as const

const sensorTypeInfo: Record<string, { icon: string; color: string; label: string }> = {
  THERMAL: { icon: '🌡️', color: '#F59E0B', label: 'Thermal' },
  SMOKE: { icon: '💨', color: '#64748B', label: 'Smoke' },
  HUMIDITY: { icon: '💧', color: '#059669', label: 'Humidity' },
}

function defaultZone(zones: ZoneData[]): ZoneData | null {
  return zones.slice().sort((left, right) => right.fireChancePercent - left.fireChancePercent)[0] ?? null
}

export function OperationsAdminPanel({ snapshot, userRole, onRefresh }: OperationsAdminPanelProps) {
  const zones = snapshot.zones ?? []
  const outposts = snapshot.outposts ?? []
  const fallbackZone = useMemo(() => defaultZone(zones), [zones])
  const normalizedRole = userRole.toUpperCase()
  const isEmployee = normalizedRole === 'EMPLOYEE'
  const isHead = normalizedRole === 'HEAD'
  const initialTab: TabKey = isHead ? 'outpost' : 'sensor'
  
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  
  const [equipmentCsv, setEquipmentCsv] = useState('Fire Suit, Water Tanker, Thermal Drone')

  const session = getAuthSession()
  const employeeAssignedZone = session?.assignedZone

  const initialZone = useMemo(() => {
    if (isEmployee && employeeAssignedZone) {
      return zones.find((z) => z.zoneName === employeeAssignedZone) ?? fallbackZone
    }
    return fallbackZone
  }, [isEmployee, employeeAssignedZone, zones, fallbackZone])

  // Initialize sensor form with empty/clean values for new sensors
  const [sensorForm, setSensorForm] = useState<AdminSensorRequest>({
    zoneName: initialZone?.zoneName ?? '',
    sensorType: 'THERMAL',
    model: '',
    location: '',
    latitude: initialZone?.latitude ?? 0,
    longitude: initialZone?.longitude ?? 0,
    coverageRadiusKm: 6.5,
  })

  const [outpostForm, setOutpostForm] = useState<AdminOutpostRequest>({
    outpostName: `${fallbackZone?.zoneName ?? 'Vanrakshak'} Outpost`,
    zoneName: fallbackZone?.zoneName ?? '',
    latitude: (fallbackZone?.latitude ?? 0) + 0.018,
    longitude: (fallbackZone?.longitude ?? 0) - 0.014,
    employeeCount: 18,
    operationalRole: 'MANPOWER_AND_UAV',
    coverageRadiusKm: 18,
    equipment: ['Fire Suit', 'Water Tanker', 'Thermal Drone'],
  })

  const [editingOutpostId, setEditingOutpostId] = useState<string | null>(null)
  const editingOutpost = outposts.find((item) => item.outpostId === editingOutpostId) ?? null

  const [editingSensorId, setEditingSensorId] = useState<string | null>(null)
  const editingSensor = useMemo(() => {
    if (!editingSensorId) return null
    for (const zone of zones) {
      const found = zone.sensors?.find(s => s.sensorId === editingSensorId)
      if (found) return found
    }
    return null
  }, [editingSensorId, zones])

  useEffect(() => {
    if (!editingSensor) return
    setSensorForm({
      zoneName: editingSensor.zone,
      sensorType: editingSensor.sensorType,
      model: editingSensor.model,
      location: editingSensor.location,
      latitude: editingSensor.latitude,
      longitude: editingSensor.longitude,
      coverageRadiusKm: editingSensor.coverageRadiusKm,
    })
  }, [editingSensor])

  useEffect(() => {
    if (!editingOutpost) return
    setOutpostForm({
      outpostName: editingOutpost.outpostName,
      zoneName: editingOutpost.zone,
      latitude: parseFloat(editingOutpost.latitude.toFixed(4)),
      longitude: parseFloat(editingOutpost.longitude.toFixed(4)),
      employeeCount: editingOutpost.employeeCount,
      operationalRole: editingOutpost.operationalRole,
      coverageRadiusKm: parseFloat(editingOutpost.coverageRadiusKm.toFixed(1)),
      equipment: editingOutpost.availableEquipment,
    })
    setEquipmentCsv(editingOutpost.availableEquipment.join(', '))
  }, [editingOutpost])

  // Auto-clear status messages after 4 seconds
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  const submitSensor = async () => {
    if (!sensorForm.model.trim()) {
      setStatus({ type: 'error', message: 'Please enter a sensor model name.' })
      return
    }
    if (!sensorForm.location.trim()) {
      setStatus({ type: 'error', message: 'Please enter a location label for the sensor.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      if (editingSensorId) {
        await apiClient.updateSensor(editingSensorId, sensorForm)
        setStatus({ type: 'success', message: '✅ Sensor updated successfully. Refreshing...' })
      } else {
        await apiClient.createSensor(sensorForm)
        setStatus({ type: 'success', message: '✅ Sensor deployed successfully. Refreshing...' })
      }
      window.setTimeout(() => {
        resetSensorForm()
        setBusy(false)
        if (onRefresh) onRefresh()
      }, 300)
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save sensor' })
      setBusy(false)
    }
  }

  const deleteSensor = async (sensorId: string) => {
    if (!window.confirm('Are you sure you want to remove this sensor? This action cannot be undone.')) return
    setBusy(true)
    setStatus(null)
    try {
      await apiClient.deleteSensor(sensorId)
      setStatus({ type: 'success', message: '✅ Sensor removed. Refreshing...' })
      window.setTimeout(() => {
        setBusy(false)
        if (onRefresh) onRefresh()
      }, 300)
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete sensor' })
      setBusy(false)
    }
  }

  const submitOutpost = async () => {
    if (!outpostForm.outpostName.trim()) {
      setStatus({ type: 'error', message: 'Please enter an outpost name.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const equipment = equipmentCsv
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      if (editingOutpostId) {
        // Update existing outpost — API uses createOutpost endpoint which backend handles as upsert
        // We call delete+create via the backend's update path
        await apiClient.createOutpost({ ...outpostForm, equipment })
        setStatus({ type: 'success', message: '✅ Outpost updated successfully. Refreshing...' })
        window.setTimeout(() => {
          setEditingOutpostId(null)
          setBusy(false)
          if (onRefresh) onRefresh()
        }, 300)
      } else {
        // Create new outpost
        await apiClient.createOutpost({ ...outpostForm, equipment })
        setStatus({ type: 'success', message: '✅ Outpost deployed successfully. Refreshing...' })
        // Reset form to a clean state for the next outpost
        const firstZone = zones[0]
        setOutpostForm({
          outpostName: `${firstZone?.zoneName ?? 'Vanrakshak'} Outpost`,
          zoneName: firstZone?.zoneName ?? '',
          latitude: (firstZone?.latitude ?? 0) + 0.018,
          longitude: (firstZone?.longitude ?? 0) - 0.014,
          employeeCount: 18,
          operationalRole: 'MANPOWER_AND_UAV',
          coverageRadiusKm: 18,
          equipment: ['Fire Suit', 'Water Tanker', 'Thermal Drone'],
        })
        setEquipmentCsv('Fire Suit, Water Tanker, Thermal Drone')
        window.setTimeout(() => {
          setBusy(false)
          if (onRefresh) onRefresh()
        }, 300)
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save outpost' })
      setBusy(false)
    }
  }
  
  const deleteOutpost = async (outpostId: string) => {
    if (!window.confirm('Are you sure you want to delete this outpost? This action cannot be undone.')) return
    setBusy(true)
    setStatus(null)
    try {
      await apiClient.deleteOutpost(outpostId)
      setStatus({ type: 'success', message: '✅ Outpost deleted. Refreshing...' })
      window.setTimeout(() => {
        setBusy(false)
        if (onRefresh) onRefresh()
      }, 300)
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete outpost' })
      setBusy(false)
    }
  }

  const resetSensorForm = () => {
    setEditingSensorId(null)
    setSensorForm({
      zoneName: initialZone?.zoneName ?? '',
      sensorType: 'THERMAL',
      model: '',
      location: '',
      latitude: initialZone?.latitude ?? 0,
      longitude: initialZone?.longitude ?? 0,
      coverageRadiusKm: 6.5,
    })
  }

  // Get sensors for current selected zone
  const currentZoneSensors = useMemo(() => {
    const zone = zones.find(z => z.zoneName === sensorForm.zoneName)
    const sensors = zone?.sensors ?? []
    if (isEmployee) {
      return sensors.filter(sensor => sensor.createdByUsername === session?.username)
    }
    return sensors
  }, [zones, sensorForm.zoneName, isEmployee, session?.username])

  // Get outposts for display
  const displayOutposts = useMemo(() => {
    return outposts.filter(o => isEmployee ? o.zone === employeeAssignedZone : true)
  }, [outposts, isEmployee, employeeAssignedZone])

  return (
    <section id="admin-console" className="space-y-5 max-w-5xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-border-subtle bg-bg-canvas p-1.5">
          <TabButton active={activeTab === 'sensor'} label="🌡️ Sensors" onClick={() => setActiveTab('sensor')} />
          <TabButton active={activeTab === 'outpost'} label="⛺ Outposts" onClick={() => setActiveTab('outpost')} />
        </div>
        {activeTab === 'sensor' && !editingSensorId && (
          <p className="text-xs text-text-muted">
            {isEmployee ? `Deploying sensors in ${employeeAssignedZone}` : 'Managing sensors across all zones'}
          </p>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div 
          className="rounded-xl px-4 py-3 text-sm font-medium animate-fade-in"
          style={status.type === 'success' 
            ? { border: '1px solid rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.05)', color: '#10B981' }
            : status.type === 'error'
            ? { border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)', color: '#EF4444' }
            : { border: '1px solid #FDE68A', backgroundColor: '#FFF8EC', color: '#92400E' }
          }
        >
          {status.message}
        </div>
      )}

      <div className="mt-1">
        {activeTab === 'sensor' ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {/* Create/Edit Sensor Form */}
            <div className="zone-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="heading-caps mb-1">{editingSensorId ? 'Edit Sensor' : 'Deploy New Sensor'}</p>
                  <h3 className="text-base font-bold text-text-primary">
                    {editingSensorId ? 'Update sensor configuration' : 'Configure and place a new sensor'}
                  </h3>
                </div>
                {editingSensorId && (
                  <button
                    type="button"
                    onClick={resetSensorForm}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Zone">
                  <select
                    value={sensorForm.zoneName}
                    onChange={(event) => {
                      setSensorForm((previous) => ({ ...previous, zoneName: event.target.value }))
                      setEditingSensorId(null)
                    }}
                    className="field-input disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isEmployee}
                  >
                    {zones.map((zone) => (
                      <option key={zone.zoneName} value={zone.zoneName}>{zone.zoneName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Sensor Type">
                  <div className="flex gap-1.5">
                    {sensorTypes.map((type) => {
                      const info = sensorTypeInfo[type]
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSensorForm((prev) => ({ ...prev, sensorType: type }))}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-all border"
                          style={sensorForm.sensorType === type
                            ? { backgroundColor: '#059669', color: '#FFFFFF', borderColor: '#059669', boxShadow: '0 1px 3px rgba(5,150,105,0.2)' }
                            : { backgroundColor: '#FFFFFF', color: '#475569', borderColor: '#E2E8F0' }
                          }
                        >
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Model Name">
                  <input
                    value={sensorForm.model}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, model: event.target.value }))}
                    className="field-input"
                    placeholder="e.g., Vanrakshak Sentinel X1"
                  />
                </Field>
                <Field label="Location Label">
                  <input
                    value={sensorForm.location}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, location: event.target.value }))}
                    className="field-input"
                    placeholder="e.g., Ridge line, Valley floor"
                  />
                </Field>
                <Field label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorForm.latitude}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, latitude: Number(event.target.value) }))}
                    className="field-input text-mono"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorForm.longitude}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, longitude: Number(event.target.value) }))}
                    className="field-input text-mono"
                  />
                </Field>
                <Field label="Coverage Radius (km)">
                  <input
                    type="number"
                    step="0.1"
                    value={sensorForm.coverageRadiusKm}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
                    className="field-input text-mono"
                  />
                </Field>
              </div>
              <button
                type="button"
                disabled={busy || zones.length === 0}
                onClick={submitSensor}
                className="btn-primary mt-4"
              >
                {busy ? 'Processing...' : editingSensorId ? '🔄 Update Sensor' : '🚀 Deploy Sensor'}
              </button>
            </div>
            
            {/* Existing Sensors List */}
            <div className="zone-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="heading-caps mb-1">Deployed Sensors</p>
                  <h3 className="text-base font-bold text-text-primary">
                    {sensorForm.zoneName || 'Select a zone'}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: '#94A3B8', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {currentZoneSensors.length} sensor{currentZoneSensors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {currentZoneSensors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">📡</p>
                    <p className="text-sm text-text-muted font-medium">No sensors deployed in this zone yet.</p>
                    <p className="text-xs text-text-muted mt-1">Use the form to deploy your first sensor.</p>
                  </div>
                ) : (
                  currentZoneSensors.map((sensor) => {
                    const info = sensorTypeInfo[sensor.sensorType] || sensorTypeInfo.THERMAL
                    const isEditing = editingSensorId === sensor.sensorId
                    const isDanger = sensor.status === 'DANGER' || sensor.status === 'CRITICAL'
                    const isWarning = sensor.status === 'WARNING'
                    const thresholdPct = Math.min(100, (sensor.value / sensor.dangerThreshold) * 100)
                    const statusColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'
                    return (
                      <div key={sensor.sensorId} className={`stagger-item rounded-xl border p-4 transition-all ${
                        isEditing 
                          ? 'border-accent-primary bg-accent-primary-light shadow-sm' 
                          : isDanger
                          ? 'danger-glow border-red-200 bg-red-50/30'
                          : 'border-border-subtle bg-bg-canvas hover:border-border-strong hover:shadow-sm'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: info.color + '15', border: `1px solid ${info.color}25` }}>
                                {info.icon}
                              </div>
                              {isDanger && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white pulse-dot" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm" style={{ color: '#0F172A' }}>
                                {sensor.sensorType} <span className="font-normal" style={{ color: '#475569' }}>— {sensor.location}</span>
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                                {sensor.model} • {sensor.coverageRadiusKm}km radius
                              </p>
                              {/* Live value + threshold bar */}
                              <div className="mt-2 flex items-center gap-3">
                                <span 
                                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                  style={{ backgroundColor: statusColor + '18', color: statusColor }}
                                >
                                  {isDanger ? '⚠ ' : ''}{sensor.status}
                                </span>
                                <span className="text-sm font-bold text-mono" style={{ color: statusColor }}>
                                  {sensor.value.toFixed(1)}
                                  <span className="text-[10px] font-normal ml-0.5" style={{ color: '#94A3B8' }}>{sensor.unit}</span>
                                </span>
                              </div>
                              {/* Threshold progress bar */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                                  <div 
                                    className="h-full rounded-full transition-all duration-700" 
                                    style={{ width: `${thresholdPct}%`, backgroundColor: statusColor }}
                                  />
                                </div>
                                <span className="text-[9px] text-mono font-semibold" style={{ color: '#94A3B8', minWidth: 32, textAlign: 'right' }}>
                                  {thresholdPct.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingSensorId(sensor.sensorId)}
                              className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSensor(sensor.sensorId)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 shadow-sm border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* CREATE NEW OUTPOST FORM — HEAD only */}
            {isHead && (
              <div className="zone-card">
                <div className="mb-4">
                  <p className="heading-caps mb-1">Create Outpost</p>
                  <h3 className="text-base font-bold text-text-primary">Deploy a new field outpost</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Zone">
                    <select
                      value={outpostForm.zoneName}
                      onChange={(e) => {
                        const z = e.target.value
                        setOutpostForm(prev => ({ ...prev, zoneName: z, outpostName: z + ' Outpost' }))
                      }}
                      className="field-input"
                    >
                      {zones.map(z => <option key={z.zoneName} value={z.zoneName}>{z.zoneName}</option>)}
                    </select>
                  </Field>
                  <Field label="Outpost Name">
                    <input
                      value={outpostForm.outpostName}
                      onChange={(e) => setOutpostForm(prev => ({ ...prev, outpostName: e.target.value }))}
                      className="field-input"
                      placeholder="e.g., Central India Outpost"
                    />
                  </Field>
                  <Field label="Crew Count">
                    <input
                      type="number"
                      min="1"
                      value={outpostForm.employeeCount}
                      onChange={(e) => setOutpostForm(prev => ({ ...prev, employeeCount: Number(e.target.value) }))}
                      className="field-input text-mono"
                    />
                  </Field>
                  <Field label="Coverage Radius (km)">
                    <input
                      type="number"
                      step="0.1"
                      value={outpostForm.coverageRadiusKm}
                      onChange={(e) => setOutpostForm(prev => ({ ...prev, coverageRadiusKm: Number(e.target.value) }))}
                      className="field-input text-mono"
                    />
                  </Field>
                  <Field label="Response Role">
                    <select
                      value={outpostForm.operationalRole}
                      onChange={(e) => setOutpostForm(prev => ({ ...prev, operationalRole: e.target.value }))}
                      className="field-input"
                    >
                      <option value="MANPOWER_AND_UAV">Manpower + UAV</option>
                      <option value="MANPOWER_ONLY">Manpower Only</option>
                      <option value="UAV_ONLY">UAV Only</option>
                    </select>
                  </Field>
                  <Field label="Equipment (comma separated)">
                    <input
                      value={equipmentCsv}
                      onChange={(e) => setEquipmentCsv(e.target.value)}
                      className="field-input"
                      placeholder="Fire Suit, Water Tanker, Thermal Drone"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={busy || !outpostForm.zoneName}
                  onClick={submitOutpost}
                  className="btn-primary mt-4"
                >
                  {busy ? 'Deploying...' : '⛺ Deploy Outpost'}
                </button>
              </div>
            )}

            {/* OUTPOST LIST */}
            <div className="zone-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="heading-caps mb-1">Field Outposts</p>
                  <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>
                    {isEmployee ? 'Your Zone Outposts' : 'All Operational Outposts'}
                  </h3>
                </div>
                <span className="text-xs font-bold text-text-muted bg-bg-canvas px-2.5 py-1 rounded-full border border-border-subtle">
                  {displayOutposts.length} outpost{displayOutposts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {displayOutposts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">⛺</p>
                    <p className="text-sm text-text-muted font-medium">No outposts found.</p>
                    {isHead && <p className="text-xs text-text-muted mt-1">Use the form above to deploy your first outpost.</p>}
                  </div>
                ) : (
                  displayOutposts.map((outpost) => {
                    const isEditing = editingOutpostId === outpost.outpostId
                    const cardClass = isEditing
                      ? 'rounded-xl border overflow-hidden border-accent-secondary bg-accent-secondary-light shadow-sm transition-all'
                      : 'rounded-xl border overflow-hidden border-border-subtle bg-bg-canvas hover:border-border-strong transition-all'
                    return (
                    <div key={outpost.outpostId} className={cardClass}>
                      <div 
                        className="flex items-center justify-between gap-2 p-4 cursor-pointer select-none" 
                        onClick={() => setEditingOutpostId(prev => prev === outpost.outpostId ? null : outpost.outpostId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#1C2B22] text-white flex items-center justify-center text-lg shrink-0">⛺</div>
                          <div>
                            <h4 className="font-bold text-sm" style={{ color: '#0F172A' }}>{outpost.outpostName}</h4>
                            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{outpost.zone} • {outpost.employeeCount} crew • {outpost.coverageRadiusKm}km range</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          {outpost.availableEquipment?.length > 0 && (
                            <span className="text-[10px] hidden sm:block" style={{ color: '#94A3B8' }}>
                              {outpost.availableEquipment.length} equipment
                            </span>
                          )}
                          {!isEmployee && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); deleteOutpost(outpost.outpostId); }}
                              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 shadow-sm border border-rose-200 hover:bg-rose-100 transition"
                            >
                              🗑️ Delete
                            </button>
                          )}
                          <span 
                            className="text-slate-400 text-xs ml-1 transition-transform duration-200"
                            style={editingOutpostId === outpost.outpostId ? { transform: 'rotate(90deg)' } : { transform: 'none' }}
                          >
                            ▶
                          </span>
                        </div>
                      </div>
                      
                      {editingOutpostId === outpost.outpostId && (
                        <div className="px-4 pb-4 border-t border-border-subtle animate-fade-in" onClick={e => e.stopPropagation()}>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Field label="Zone">
                              <input disabled value={outpostForm.zoneName} className="field-input opacity-60 cursor-not-allowed" />
                            </Field>
                            <Field label="Outpost Name">
                              <input disabled value={outpostForm.outpostName} className="field-input opacity-60 cursor-not-allowed" />
                            </Field>
                            <Field label="Latitude">
                              <input disabled type="number" value={outpostForm.latitude} className="field-input opacity-60 cursor-not-allowed text-mono" />
                            </Field>
                            <Field label="Longitude">
                              <input disabled type="number" value={outpostForm.longitude} className="field-input opacity-60 cursor-not-allowed text-mono" />
                            </Field>
                            <Field label="Crew Count">
                              <input
                                type="number"
                                min="1"
                                value={outpostForm.employeeCount}
                                onChange={(event) => setOutpostForm((previous) => ({ ...previous, employeeCount: Number(event.target.value) }))}
                                className="field-input"
                              />
                            </Field>
                            <Field label="Coverage Radius (km)">
                              <input
                                type="number"
                                step="0.1"
                                value={outpostForm.coverageRadiusKm}
                                onChange={(event) => setOutpostForm((previous) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
                                className="field-input text-mono"
                              />
                            </Field>
                            <Field label="Response Role">
                              <select
                                value={outpostForm.operationalRole}
                                onChange={(event) => setOutpostForm((previous) => ({ ...previous, operationalRole: event.target.value }))}
                                className="field-input"
                              >
                                <option value="MANPOWER_AND_UAV">Manpower + UAV</option>
                                <option value="MANPOWER_ONLY">Manpower Only</option>
                                <option value="UAV_ONLY">UAV Only</option>
                              </select>
                            </Field>
                            <Field label="Equipment (comma separated)">
                              <input
                                value={equipmentCsv}
                                onChange={(event) => setEquipmentCsv(event.target.value)}
                                className="field-input"
                                placeholder="Fire Suit, Water Tanker, Thermal Drone"
                              />
                            </Field>
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={submitOutpost}
                            className="btn-primary mt-4"
                          >
                            {busy ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-5 py-2.5 text-xs font-bold tracking-wider transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-text-secondary hover:text-text-primary hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">{label}</span>
      {children}
    </label>
  )
}
