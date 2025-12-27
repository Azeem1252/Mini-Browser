import React from 'react';
import './NavigationControls.css';

interface NavigationControlsProps {
    canGoBack: boolean;
    canGoForward: boolean;
    isLoading: boolean;
    onBack: () => void;
    onForward: () => void;
    onRefresh: () => void;
    onHome: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
    canGoBack,
    canGoForward,
    isLoading,
    onBack,
    onForward,
    onRefresh,
    onHome,
}) => {
    return (
        <div className="navigation-controls">
            <button
                className="nav-button"
                onClick={onBack}
                disabled={!canGoBack}
                aria-label="Go back"
                title="Back"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <button
                className="nav-button"
                onClick={onForward}
                disabled={!canGoForward}
                aria-label="Go forward"
                title="Forward"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <button
                className="nav-button"
                onClick={onRefresh}
                aria-label="Refresh"
                title="Refresh"
            >
                {isLoading ? (
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            <button
                className="nav-button"
                onClick={onHome}
                aria-label="Home"
                title="Home"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 22V12h6v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};
