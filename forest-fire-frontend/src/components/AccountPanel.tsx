import { useEffect, useState } from 'react'
import { apiClient, updateAuthSession } from '../api/client'
import type { AccountProfile, AuthSession } from '../types/api'

interface AccountPanelProps {
  session: AuthSession
  onSessionUpdate: (nextSession: AuthSession) => void
}

export function AccountPanel({ session, onSessionUpdate }: AccountPanelProps) {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [displayName, setDisplayName] = useState(session.displayName || session.username)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const nextProfile = await apiClient.getAccountProfile()
        setProfile(nextProfile)
        setDisplayName(nextProfile.displayName)
        onSessionUpdate({ ...session, displayName: nextProfile.displayName })
        updateAuthSession({ ...session, displayName: nextProfile.displayName })
      } catch (error) {
        setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to load account profile' })
      }
    }

    void loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-clear status
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 5000)
    return () => clearTimeout(timer)
  }, [status])

  const saveProfile = async () => {
    if (!displayName.trim()) {
      setStatus({ type: 'error', message: 'Display name cannot be empty.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const nextProfile = await apiClient.updateAccountProfile({ displayName })
      const nextSession = { ...session, displayName: nextProfile.displayName }
      setProfile(nextProfile)
      onSessionUpdate(nextSession)
      updateAuthSession(nextSession)
      setStatus({ type: 'success', message: '✅ Display name updated successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update profile' })
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirmation do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await apiClient.changeAccountPassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus({ type: 'success', message: '✅ Password changed successfully. Use the new password on your next login.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to change password' })
    } finally {
      setBusy(false)
    }
  }

  const isEmployee = session.role.toUpperCase() === 'EMPLOYEE'

  return (
    <section className="space-y-6">
      {/* Status Banner */}
      {status && (
        <div 
          className="rounded-xl px-4 py-3 text-sm font-medium animate-fade-in"
          style={status.type === 'success' 
            ? { border: '1px solid rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.05)', color: '#10B981' }
            : { border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)', color: '#EF4444' }
          }
        >
          {status.message}
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="zone-card">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white grid place-items-center text-2xl font-black shrink-0 shadow-lg shadow-emerald-500/20">
            {(profile?.displayName ?? session.displayName ?? session.username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black tracking-tight truncate" style={{ color: '#0F172A' }}>
              {profile?.displayName ?? session.displayName ?? session.username}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span 
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={isEmployee 
                  ? { backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }
                  : { backgroundColor: 'rgba(245,158,11,0.1)', color: '#D97706' }
                }
              >
                {profile?.role ?? session.role}
              </span>
              {session.assignedZone && (
                <span 
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669' }}
                >
                  📍 {session.assignedZone}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#475569' }}>
              {isEmployee 
                ? `Field operator assigned to ${session.assignedZone ?? 'national grid'}. Sensor deployment and monitoring access.`
                : 'Administrative head with full access to all zones, outposts, and sensor management.'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Username" value={session.username} icon="👤" />
          <InfoTile label="Role" value={profile?.role ?? session.role} icon="🛡️" />
          <InfoTile label="Display Name" value={profile?.displayName ?? displayName} icon="📛" />
          <InfoTile label="Assigned Zone" value={session.assignedZone ?? 'All Zones'} icon="📍" />
        </div>
      </div>

      {/* Edit Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Display Name Form */}
        <div className="zone-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✏️</span>
            <h3 className="text-lg font-bold" style={{ color: '#0F172A' }}>Edit Display Name</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: '#475569' }}>Changes the visible name on your profile and sidebar.</p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">Display Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="field-input"
                placeholder="Your display name"
              />
            </label>
            <button
              type="button"
              onClick={saveProfile}
              disabled={busy || displayName.trim().length === 0}
              className="btn-primary"
            >
              {busy ? 'Saving...' : 'Update Display Name'}
            </button>
          </div>
        </div>

        {/* Password Form */}
        <div className="zone-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔒</span>
            <h3 className="text-lg font-bold" style={{ color: '#0F172A' }}>Change Password</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: '#475569' }}>Use your current password to set a new one. Takes effect on next login.</p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="field-input"
                placeholder="••••••••"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="field-input"
                placeholder="Minimum 6 characters"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field-input"
                placeholder="Re-enter new password"
              />
            </label>
            <button
              type="button"
              onClick={savePassword}
              disabled={busy || currentPassword.trim().length === 0 || newPassword.trim().length === 0 || confirmPassword.trim().length === 0}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Updating...' : '🔑 Update Password'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-canvas p-4 transition-all hover:border-border-strong">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">{label}</p>
      </div>
      <p className="text-sm font-black text-text-primary truncate">{value}</p>
    </div>
  )
}