import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState((prevState) => ({
            ...prevState,
            errorInfo,
        }))

    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200">
                        {/* Header */}
                        <div className="flex items-center gap-3 p-6 border-b border-red-200 bg-red-50">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <div>
                                <h1 className="text-lg font-semibold text-red-900">
                                    Something went wrong
                                </h1>
                                <p className="text-sm text-red-700">An unexpected error occurred</p>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="p-6">
                            {this.state.error && (
                                <div className="mb-4">
                                    <details className="text-sm">
                                        <summary className="cursor-pointer font-mono text-xs text-gray-600 hover:text-gray-900 py-2">
                                            Error Details
                                        </summary>
                                        <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-auto">
                                            <div className="font-mono text-xs text-red-700 whitespace-pre-wrap break-words">
                                                {this.state.error.message}
                                            </div>
                                            {this.state.errorInfo?.componentStack && (
                                                <div className="mt-3 text-xs text-gray-600 whitespace-pre-wrap break-words">
                                                    {this.state.errorInfo.componentStack}
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-3">
                                <Button
                                    onClick={this.resetError}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Try Again
                                </Button>
                                <Button
                                    onClick={() => (window.location.href = '/')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>

                            {/* Info Message */}
                            <p className="mt-4 text-xs text-gray-600 text-center">
                                If the problem persists, please contact support at{' '}
                                <a
                                    href="mailto:support@scora.dev"
                                    className="text-blue-600 hover:underline"
                                >
                                    support@scora.dev
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

interface ErrorBoundaryContextType {
    showError: (error: Error | string) => void
}

const ErrorBoundaryContext = React.createContext<ErrorBoundaryContextType | undefined>(undefined)

export function useErrorBoundary() {
    const context = React.useContext(ErrorBoundaryContext)
    if (!context) {
        throw new Error('useErrorBoundary must be used within ErrorBoundaryProvider')
    }
    return context
}

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
    const showError = (error: Error | string) => {
        const errorObj = typeof error === 'string' ? new Error(error) : error
        throw errorObj
    }

    return (
        <ErrorBoundaryContext.Provider value={{ showError }}>
            <ErrorBoundary>{children}</ErrorBoundary>
        </ErrorBoundaryContext.Provider>
    )
}
