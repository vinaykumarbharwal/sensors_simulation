import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiClient, getAuthSession } from '../api/client'
import type { AdminOutpostRequest, AdminSensorRequest, EquipmentUsageRequest, MapSnapshot, ZoneData } from '../types/api'

interface OperationsAdminPanelProps {
  snapshot: MapSnapshot
  userRole: string
}

type TabKey = 'sensor' | 'outpost' | 'equipment'

const sensorTypes = ['THERMAL', 'SMOKE', 'HUMIDITY'] as const

function defaultZone(zones: ZoneData[]): ZoneData | null {
  return zones.slice().sort((left, right) => right.fireChancePercent - left.fireChancePercent)[0] ?? null
}

export function OperationsAdminPanel({ snapshot, userRole }: OperationsAdminPanelProps) {
  const zones = snapshot.zones ?? []
  const fallbackZone = useMemo(() => defaultZone(zones), [zones])
  const normalizedRole = userRole.toUpperCase()
  const isEmployee = normalizedRole === 'EMPLOYEE'
  const isHead = normalizedRole === 'HEAD'
  const initialTab: TabKey = isHead ? 'outpost' : 'sensor'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const outposts = snapshot.outposts ?? []
  const [equipmentCsv, setEquipmentCsv] = useState('Fire Suit, Water Tanker, Thermal Drone')
  const [editingOutpostId, setEditingOutpostId] = useState<string | null>(null)

  const session = getAuthSession()
  const employeeAssignedZone = session?.assignedZone

  const initialZone = useMemo(() => {
    if (isEmployee && employeeAssignedZone) {
      return zones.find((z) => z.zoneName === employeeAssignedZone) ?? fallbackZone
    }
    return fallbackZone
  }, [isEmployee, employeeAssignedZone, zones, fallbackZone])

  const [sensorForm, setSensorForm] = useState<AdminSensorRequest>({
    zoneName: initialZone?.zoneName ?? '',
    sensorType: 'THERMAL',
    model: 'Vanrakshak Sentinel X1',
    location: 'ridge line',
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

  const [equipmentUseForm, setEquipmentUseForm] = useState<EquipmentUsageRequest>({
    equipmentName: '',
    employeeId: 'EMP-001',
    purpose: 'Operational response',
  })
  const [selectedOutpostId, setSelectedOutpostId] = useState(outposts[0]?.outpostId ?? '')

  const selectedOutpost = outposts.find((item) => item.outpostId === selectedOutpostId) ?? null
  const editingOutpost = outposts.find((item) => item.outpostId === editingOutpostId) ?? null

  useEffect(() => {
    if (!editingOutpost) {
      return
    }

    setActiveTab('outpost')
    setOutpostForm({
      outpostName: editingOutpost.outpostName,
      zoneName: editingOutpost.zone,
      latitude: editingOutpost.latitude,
      longitude: editingOutpost.longitude,
      employeeCount: editingOutpost.employeeCount,
      operationalRole: editingOutpost.operationalRole,
      coverageRadiusKm: editingOutpost.coverageRadiusKm,
      equipment: editingOutpost.availableEquipment,
    })
    setEquipmentCsv(editingOutpost.availableEquipment.join(', '))
  }, [editingOutpost])

  const submitSensor = async () => {
    setBusy(true)
    setStatus(null)
    try {
      await apiClient.createSensor(sensorForm)
      setStatus('Sensor created. Refreshing map...')
      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create sensor')
      setBusy(false)
    }
  }

  const submitOutpost = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const equipment = equipmentCsv
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      await apiClient.createOutpost({
        ...outpostForm,
        equipment,
      })
      setEditingOutpostId(null)
      setStatus(editingOutpostId ? 'Outpost updated. Refreshing map...' : 'Outpost created. Refreshing map...')
      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create outpost')
      setBusy(false)
    }
  }

  const deleteOutpost = async (outpostId: string) => {
    if (!window.confirm('Delete this outpost?')) {
      return
    }

    setBusy(true)
    setStatus(null)
    try {
      await apiClient.deleteOutpost(outpostId)
      setStatus('Outpost deleted. Refreshing map...')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to delete outpost')
      setBusy(false)
    }
  }

  const submitEquipmentUse = async () => {
    setBusy(true)
    setStatus(null)
    try {
      if (!selectedOutpostId) {
        throw new Error('Select an outpost first')
      }

      await apiClient.useOutpostEquipment(selectedOutpostId, equipmentUseForm)
      setStatus(`Equipment approved for ${equipmentUseForm.employeeId} from ${selectedOutpostId}`)
      setBusy(false)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to use equipment')
      setBusy(false)
    }
  }

  return (
    <section id="admin-console" className="card rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border-subtle/70 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
            Operations admin
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-text-primary dark:text-white">
            Sensor and outpost setup
          </h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-slate-400">
            Create map pins, coverage circles, and response bases for the operational dashboard.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-border-subtle bg-bg-canvas p-1 dark:border-slate-700 dark:bg-slate-900">
          {isEmployee && <TabButton active={activeTab === 'sensor'} label="Add sensor" onClick={() => setActiveTab('sensor')} />}
          {isHead && <TabButton active={activeTab === 'outpost'} label="Add outpost" onClick={() => setActiveTab('outpost')} />}
          {isEmployee && <TabButton active={activeTab === 'equipment'} label="Use equipment" onClick={() => setActiveTab('equipment')} />}
        </div>
      </div>

      {status && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
          {status}
        </div>
      )}

      <div className="mt-5 grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary dark:text-slate-400">Zone Directory</p>
            <h3 className="text-base font-bold text-text-primary dark:text-white">All zones and outposts</h3>
          </div>
          {isHead && (
            <button
              type="button"
              onClick={() => setEditingOutpostId(null)}
              className="rounded-full border border-border-subtle bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-bg-canvas dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              New outpost
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {zones.map((zone) => {
            const outpost = zone.outpost
            const sensors = zone.sensors ?? []

            return (
              <article key={zone.zoneName} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-text-primary dark:text-white">{zone.zoneName}</h4>
                    {outpost ? (
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        Outpost: {outpost.outpostName} ({outpost.outpostId})
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400">No outpost created yet</p>
                    )}
                  </div>
                  {outpost && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {outpost.employeeCount} crew
                    </span>
                  )}
                </div>

                {outpost && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <MiniStat label="Coverage" value={`${outpost.coverageRadiusKm.toFixed(1)} km`} />
                    <MiniStat label="Role" value={outpost.operationalRole} />
                  </div>
                )}

                <div className="mt-4 border-t border-border-subtle pt-3 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary dark:text-slate-400 mb-2">
                    Sensors ({sensors.length})
                  </p>
                  {sensors.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {sensors.map((sensor, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-bg-canvas px-3 py-2 text-xs dark:bg-slate-950/40">
                          <div>
                            <p className="font-bold text-text-primary dark:text-white">{sensor.sensorType}</p>
                            <p className="text-text-secondary dark:text-slate-400">{sensor.model}</p>
                          </div>
                          <div className="text-right">
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                              {sensor.createdByRole}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No sensors placed.</p>
                  )}
                </div>

                {isHead && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {outpost ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingOutpostId(outpost.outpostId)}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          Manage Outpost
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOutpost(outpost.outpostId)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOutpostForm(prev => ({ ...prev, zoneName: zone.zoneName }))
                          setEditingOutpostId(null)
                          setActiveTab('outpost')
                        }}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                      >
                        Create Outpost Here
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {activeTab === 'sensor' && isEmployee ? (
            <div className="space-y-4 rounded-2xl border border-border-subtle/70 bg-bg-canvas/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <FormHeader title="Create sensor" subtitle="A forest employee can place a new sensor and set its model and range." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Zone">
                  <select
                    value={sensorForm.zoneName}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, zoneName: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isEmployee}
                  >
                    {zones.map((zone) => (
                      <option key={zone.zoneName} value={zone.zoneName}>{zone.zoneName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Type">
                  <select
                    value={sensorForm.sensorType}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, sensorType: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {sensorTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Model">
                  <input
                    value={sensorForm.model}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, model: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Forest Sentinel X1"
                  />
                </Field>
                <Field label="Location label">
                  <input
                    value={sensorForm.location}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, location: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="ridge line"
                  />
                </Field>
                <Field label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorForm.latitude}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, latitude: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorForm.longitude}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, longitude: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Coverage radius (km)">
                  <input
                    type="number"
                    step="0.1"
                    value={sensorForm.coverageRadiusKm}
                    onChange={(event) => setSensorForm((previous) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
              </div>
              <p className="text-xs font-semibold text-text-secondary dark:text-slate-400">Permission: Employee only.</p>
              <button
                type="button"
                disabled={busy || zones.length === 0}
                onClick={submitSensor}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save sensor
              </button>
            </div>
          ) : activeTab === 'outpost' && isHead ? (
            <div className="space-y-4 rounded-2xl border border-border-subtle/70 bg-bg-canvas/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <FormHeader title="Create outpost" subtitle="Head can place an outpost, assign crew size, role, and equipment." />
              {editingOutpost && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Editing {editingOutpost.outpostName}. Location stays fixed to the current outpost coordinates.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Outpost name">
                  <input
                    value={outpostForm.outpostName}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, outpostName: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Kullu North Outpost"
                  />
                </Field>
                <Field label="Zone">
                  <select
                    value={outpostForm.zoneName}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, zoneName: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {zones.map((zone) => (
                      <option key={zone.zoneName} value={zone.zoneName}>{zone.zoneName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={outpostForm.latitude}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, latitude: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={outpostForm.longitude}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, longitude: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Employees">
                  <input
                    type="number"
                    min="1"
                    value={outpostForm.employeeCount}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, employeeCount: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Coverage radius (km)">
                  <input
                    type="number"
                    step="0.1"
                    value={outpostForm.coverageRadiusKm}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, coverageRadiusKm: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </Field>
                <Field label="Response role">
                  <input
                    value={outpostForm.operationalRole}
                    onChange={(event) => setOutpostForm((previous) => ({ ...previous, operationalRole: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="MANPOWER_AND_UAV"
                  />
                </Field>
                <Field label="Equipment list (comma separated)">
                  <input
                    value={equipmentCsv}
                    onChange={(event) => setEquipmentCsv(event.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Fire Suit, Water Tanker, Thermal Drone"
                  />
                </Field>
              </div>
              <p className="text-xs font-semibold text-text-secondary dark:text-slate-400">Permission: Head only.</p>
              <button
                type="button"
                disabled={busy || zones.length === 0}
                onClick={submitOutpost}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingOutpost ? 'Update outpost' : 'Save outpost'}
              </button>
            </div>
          ) : isEmployee ? (
            <div className="space-y-4 rounded-2xl border border-border-subtle/70 bg-bg-canvas/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <FormHeader title="Use outpost equipment" subtitle="Employee can use only equipment assigned to the selected outpost." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Outpost">
                  <select
                    value={selectedOutpostId}
                    onChange={(event) => {
                      const nextOutpostId = event.target.value
                      setSelectedOutpostId(nextOutpostId)
                      const nextOutpost = outposts.find((item) => item.outpostId === nextOutpostId)
                      if (nextOutpost?.availableEquipment?.[0]) {
                        setEquipmentUseForm((previous) => ({ ...previous, equipmentName: nextOutpost.availableEquipment[0] }))
                      }
                    }}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Select outpost</option>
                    {outposts.map((outpost) => (
                      <option key={outpost.outpostId} value={outpost.outpostId}>{outpost.outpostName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Equipment">
                  <select
                    value={equipmentUseForm.equipmentName}
                    onChange={(event) => setEquipmentUseForm((previous) => ({ ...previous, equipmentName: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Select equipment</option>
                    {(selectedOutpost?.availableEquipment ?? []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Employee ID">
                  <input
                    value={equipmentUseForm.employeeId}
                    onChange={(event) => setEquipmentUseForm((previous) => ({ ...previous, employeeId: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="EMP-001"
                  />
                </Field>
                <Field label="Purpose">
                  <input
                    value={equipmentUseForm.purpose}
                    onChange={(event) => setEquipmentUseForm((previous) => ({ ...previous, purpose: event.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Wildfire containment support"
                  />
                </Field>
              </div>
              <p className="text-xs text-text-secondary dark:text-slate-400">
                Allowed equipment: {(selectedOutpost?.availableEquipment ?? []).join(', ') || 'None assigned yet'}
              </p>
              <button
                type="button"
                disabled={busy || outposts.length === 0}
                onClick={submitEquipmentUse}
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use equipment
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border-subtle/70 bg-bg-canvas/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300">
              Logged in as <span className="font-bold">{normalizedRole}</span>. No additional actions are available for this role.
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-border-subtle/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <FormHeader title="Deployment notes" subtitle="What changes when you create a sensor or an outpost." />
          <ChecklistItem title="Sensor placement" text="The new sensor is added to the live simulation, map overlay, and alert engine immediately." />
          <ChecklistItem title="Coverage" text="The coverage radius is drawn on the map so you can see which zones the device protects." />
          <ChecklistItem title="Outpost routing" text="Outposts are saved in the database and used as the nearest-response target for alerts." />
          <ChecklistItem title="Role control" text="Employees can add sensors and use assigned outpost equipment. Heads can create outposts and assign equipment." />
          <ChecklistItem title="Map refresh" text="After saving, the page reloads so the latest snapshot reflects the new layout." />
          <div className="rounded-xl border border-dashed border-slate-300 bg-bg-canvas p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Google Maps can be added later with a provider key. This build currently uses live OpenStreetMap tiles so the map and overlays remain interactive without extra credentials.
          </div>
        </aside>
      </div>
    </section>
  )
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
        active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function FormHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-base font-bold text-text-primary dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary dark:text-slate-400">{subtitle}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function ChecklistItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-canvas px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-sm font-bold text-text-primary dark:text-white">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary dark:text-slate-400">{text}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-canvas px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-text-primary dark:text-white">{value}</p>
    </div>
  )
}
