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
  const [status, setStatus] = useState<string | null>(null)
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
        setStatus(error instanceof Error ? error.message : 'Unable to load account profile')
      }
    }

    void loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProfile = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const nextProfile = await apiClient.updateAccountProfile({ displayName })
      const nextSession = { ...session, displayName: nextProfile.displayName }
      setProfile(nextProfile)
      onSessionUpdate(nextSession)
      updateAuthSession(nextSession)
      setStatus('Profile updated')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async () => {
    setBusy(true)
    setStatus(null)
    try {
      await apiClient.changeAccountPassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setStatus('Password changed')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="card rounded-2xl p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Account</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {profile?.displayName ?? session.displayName ?? session.username}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Standard profile management for the current role.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Username" value={session.username} />
          <InfoTile label="Role" value={profile?.role ?? session.role} />
          <InfoTile label="Display name" value={profile?.displayName ?? displayName} />
          <InfoTile label="Token user" value={session.displayName ?? session.username} />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
          Rename the visible profile name here. Password changes are pushed to the in-memory auth store and take effect on the next login.
        </div>
      </div>

      <div className="space-y-4">
        <div className="card rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit profile name</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Changes the signed-in display name.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Forest Operator"
              />
            </label>
            <button
              type="button"
              onClick={saveProfile}
              disabled={busy || displayName.trim().length === 0}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save profile
            </button>
          </div>
        </div>

        <div className="card rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Change password</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your current password to set a new one.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={savePassword}
              disabled={busy || currentPassword.trim().length === 0 || newPassword.trim().length === 0}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Update password
            </button>
          </div>
        </div>

        {status && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {status}
          </div>
        )}
      </div>
    </section>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}