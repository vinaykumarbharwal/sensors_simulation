import { useState } from 'react'
import { apiClient, saveAuthSession } from '../api/client'
import type { AuthSession } from '../types/api'

interface LoginPanelProps {
  onLoggedIn: (session: AuthSession) => void
}

export function LoginPanel({ onLoggedIn }: LoginPanelProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await apiClient.login({ username, password })
      const session = saveAuthSession(response)
      onLoggedIn(session)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed')
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10 bg-bg-canvas">
      <article className="w-full max-w-[400px] bg-bg-surface p-10 rounded-2xl border border-border-subtle shadow-card">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent-primary grid place-items-center text-2xl shadow-lg shadow-accent-primary/20">🌲</div>
          <p className="mt-4 heading-caps text-accent-primary">Vanrakshak</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            Secure access to the national forest monitoring network.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-status-critical/10 border border-status-critical/20 px-4 py-3 text-xs font-medium text-status-critical">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="heading-caps mb-1.5 block">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-canvas px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-secondary)] focus:outline-none transition-all"
              placeholder="Enter your username"
            />
          </label>

          <label className="block">
            <span className="heading-caps mb-1.5 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-canvas px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-secondary)] focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </label>

          <button
            type="button"
            disabled={busy || username.trim().length === 0 || password.trim().length === 0}
            onClick={submit}
            className="w-full rounded-lg bg-[var(--accent-secondary)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Verifying...' : 'Sign in to Dashboard'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle">
          <p className="text-[11px] text-center text-text-muted">
            Authorized Personnel Only. System activity is logged for security auditing.
          </p>
        </div>
      </article>
    </main>
  )
}
