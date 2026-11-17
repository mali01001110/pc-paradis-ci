import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * Error boundary that catches render crashes in child components and
 * displays a fallback instead of a blank page. Without this, any
 * unhandled error during React rendering unmounts the entire tree,
 * leaving the user with a white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Avoid crashing logging in production; surface in dev via console.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] caught error:', error, errorInfo)
    }
    this.setState({ errorInfo })
  }

  clearError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message ?? 'Erreur inconnue'}
            </p>
            <button
              onClick={this.clearError}
              className="btn-primary text-sm"
            >
              Réessayer
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
