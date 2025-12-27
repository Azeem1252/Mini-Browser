import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary, #0f0f0f)',
                    color: 'var(--text-primary, white)',
                    fontFamily: 'var(--font-family, sans-serif)',
                    padding: '20px',
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: '24px',
                        marginBottom: '16px',
                        color: 'var(--error, #ef4444)'
                    }}>
                        Something went wrong
                    </h1>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary, #a1a1aa)',
                        marginBottom: '8px',
                        maxWidth: '500px',
                    }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--accent-primary, #6366f1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--bg-secondary, #1a1a1a)',
                                border: '1px solid var(--border-color, #3f3f46)',
                                borderRadius: '8px',
                                color: 'var(--text-primary, white)',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
