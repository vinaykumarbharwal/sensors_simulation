import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
  onReset: () => void
}

interface AppErrorBoundaryState {
  hasError: boolean
  message: string | null
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: null,
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, message: null })
    this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center px-4 py-10 bg-slate-50 dark:bg-slate-950">
          <article className="card w-full max-w-lg rounded-2xl p-8 text-center">
            <span className="text-5xl">💥</span>
            <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Application crash detected</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {this.state.message ?? 'Something went wrong while rendering the dashboard.'}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Recover dashboard
            </button>
          </article>
        </main>
      )
    }

    return this.props.children
  }
}