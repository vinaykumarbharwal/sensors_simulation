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
    <main className="grid min-h-screen place-items-center px-4 py-10 bg-gradient-to-br from-[#1C2B22] via-[#0E1712] to-[#121c16]">
      <article className="relative w-full max-w-[450px] bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Elegant Tricolor Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <span className="flex-1 bg-[#FF9933]"></span>
          <span className="flex-1 bg-[#FFFFFF]"></span>
          <span className="flex-1 bg-[#138808]"></span>
        </div>

        <div className="flex flex-col items-center mb-8 mt-2">
          {/* Official Indian Seal / Emblem placeholder */}
          <div className="h-16 w-16 rounded-full border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 flex items-center justify-center text-3xl shadow-md">
            🇮🇳
          </div>
          <p className="mt-4 text-xs font-black text-amber-600 tracking-[0.2em] uppercase leading-none">GOVT. OF INDIA</p>
          <p className="mt-1.5 text-[10px] font-bold text-slate-500 tracking-wider uppercase leading-none">Ministry of Environment, Forest & Climate Change</p>
          
          <div className="w-full border-b border-slate-200/80 my-4"></div>
          
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight">VANRAKSHAK</h1>
          <p className="mt-2 text-xs text-center text-slate-600 max-w-[300px]">
            National Forest Surveillance & Telemetry Grid (NFSTG). Authorized access gateway.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="heading-caps mb-1.5 block text-slate-500 font-bold">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
              placeholder="Enter your government login ID"
            />
          </label>

          <label className="block">
            <span className="heading-caps mb-1.5 block text-slate-500 font-bold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
              placeholder="••••••••"
            />
          </label>

          <button
            type="button"
            disabled={busy || username.trim().length === 0 || password.trim().length === 0}
            onClick={submit}
            className="w-full rounded-xl bg-[#FF9933] hover:bg-[#e68220] active:scale-[0.98] py-3.5 text-sm font-black tracking-wider text-white shadow-lg shadow-[#FF9933]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'VERIFYING SECURITY CREDENTIALS...' : 'SECURE SIGN IN'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-[10px] text-center text-slate-500 leading-relaxed font-medium">
            This is a protected National Grid. Access to unauthorized personnel is strictly prohibited and subject to legal action under the Information Technology Act.
          </p>
        </div>
      </article>
    </main>
  )
}

