import React from 'react';
import './BrowserView.css';

interface BrowserViewProps {
    url: string;
    content: string;
    isLoading: boolean;
    error?: string;
    onIframeError?: () => void;
    isElectron?: boolean;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
    url,
    content,
    isLoading,
    error,
    onIframeError,
    isElectron = false,
}) => {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Detect iframe loading errors
    React.useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleIframeError = () => {
            if (onIframeError) {
                onIframeError();
            }
        };

        iframe.addEventListener('error', handleIframeError);
        return () => iframe.removeEventListener('error', handleIframeError);
    }, [onIframeError]);

    if (error) {
        return (
            <div className="browser-view">
                <div className="error-page">
                    <div className="error-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="error-title">Unable to load page</h1>
                    <p className="error-message">{error}</p>
                    <p className="error-url">{url}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="browser-view">
                <div className="loading-page">
                    <div className="loading-spinner">
                        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" />
                        </svg>
                    </div>
                    <p className="loading-text">Loading {url}...</p>
                </div>
            </div>
        );
    }

    if (!url || url === 'about:blank') {
        return (
            <div className="browser-view">
                <div className="welcome-page">
                    <div className="welcome-content">
                        <div className="welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth="2" />
                                <path d="M2 12h20" strokeWidth="2" />
                            </svg>
                        </div>
                        <h1 className="welcome-title">Welcome to Browser</h1>
                        <p className="welcome-subtitle">Enter a URL or search query to get started</p>
                        {isElectron && (
                            <p className="welcome-electron-badge">
                                ⚡ Powered by Chromium Engine
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ELECTRON MODE: BrowserView is managed by main process, just show placeholder
    if (isElectron) {
        return (
            <div className="browser-view electron-mode">
                {/* The actual content is rendered by Electron's BrowserView */}
                {/* This div just reserves space for the BrowserView */}
            </div>
        );
    }

    // WEB MODE: Check if it's a "Live" URL for iframe
    const isLiveUrl = url.startsWith('http://') || url.startsWith('https://');

    if (isLiveUrl) {
        return (
            <div className="browser-view">
                <iframe
                    ref={iframeRef}
                    src={url}
                    className="browser-frame"
                    title="Content"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    onError={() => onIframeError?.()}
                />
            </div>
        );
    }

    return (
        <div className="browser-view">
            <div className="page-content">
                {content ? (
                    <div className="rendered-content" dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                    <div className="empty-content">
                        <p>No content to display</p>
                    </div>
                )}
            </div>
        </div>
    );
};
