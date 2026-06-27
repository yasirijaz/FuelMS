import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@shared/lib/logger'

interface Props {
  children: ReactNode
  /** Optional custom fallback UI. */
  fallback?: ReactNode
  /** Called when an error is caught — use for telemetry. */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Human-readable name used in logs. */
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary.
 *
 * Catches render-time errors in the subtree, prevents the whole UI from
 * crashing, logs the error, and renders a recovery UI.
 *
 * Usage:
 *   <ErrorBoundary name="AccountingModule">
 *     <AccountingPage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const ctx = this.props.name ?? 'ErrorBoundary'
    logger.error(ctx, error.message, {
      stack: error.stack,
      componentStack: info.componentStack,
    })
    this.props.onError?.(error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <div>
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
            <p className="mt-1 text-sm text-red-600">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
