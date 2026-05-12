import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
      const dark = saved ? saved === 'dark' : prefersDark
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    } catch {
      // ignore
    }
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-base transition hover:bg-white/10"
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  )
}
