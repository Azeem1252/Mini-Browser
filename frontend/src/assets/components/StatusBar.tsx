import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StatusBar.css';

interface StatusBarProps {
    url: string;
    isLoading: boolean;
    loadProgress?: number;
    zoomLevel: number;
    isSecure: boolean;
    connectionInfo?: {
        protocol: string;
        responseTime?: number;
    };
    pageInfo?: {
        title: string;
        charset?: string;
        contentType?: string;
    };
}

export const StatusBar: React.FC<StatusBarProps> = ({
    url,
    isLoading,
    loadProgress = 0,
    zoomLevel,
    isSecure: _isSecure,
    connectionInfo,
    pageInfo,
}) => {
    const getSecurityStatus = () => {
        if (!url || url === 'about:blank') return { icon: 'home', text: 'Home', color: 'neutral' };
        if (url.startsWith('https://')) return { icon: 'secure', text: 'Secure', color: 'success' };
        if (url.startsWith('http://')) return { icon: 'insecure', text: 'Not Secure', color: 'warning' };
        return { icon: 'info', text: 'Local', color: 'neutral' };
    };

    const security = getSecurityStatus();

    const formatUrl = (inputUrl: string) => {
        try {
            const urlObj = new URL(inputUrl);
            return urlObj.hostname + urlObj.pathname;
        } catch {
            return inputUrl;
        }
    };

    return (
        <div className="status-bar">
            <div className="status-bar-left">
                {/* Security indicator */}
                <div className={`status-item security-status ${security.color}`}>
                    {security.icon === 'secure' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                        </svg>
                    )}
                    {security.icon === 'insecure' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 018 0" strokeWidth="2" />
                        </svg>
                    )}
                    {security.icon === 'home' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2" />
                        </svg>
                    )}
                    {security.icon === 'info' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                    <span className="status-text">{security.text}</span>
                </div>

                {/* Loading status */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            className="status-item loading-status"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" />
                            </svg>
                            <span className="status-text">
                                Loading... {loadProgress > 0 && `${Math.round(loadProgress)}%`}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* URL display on hover */}
                {url && url !== 'about:blank' && (
                    <div className="status-item url-display">
                        <span className="url-text">{formatUrl(url)}</span>
                    </div>
                )}
            </div>

            <div className="status-bar-center">
                {/* Connection info */}
                {connectionInfo && connectionInfo.responseTime && (
                    <div className="status-item connection-info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="status-text">{connectionInfo.responseTime}ms</span>
                    </div>
                )}
            </div>

            <div className="status-bar-right">
                {/* Zoom level */}
                {zoomLevel !== 100 && (
                    <motion.div
                        className="status-item zoom-indicator"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                            {zoomLevel > 100 ? (
                                <path d="M11 8v6M8 11h6" strokeWidth="2" strokeLinecap="round" />
                            ) : (
                                <path d="M8 11h6" strokeWidth="2" strokeLinecap="round" />
                            )}
                        </svg>
                        <span className="status-text">{zoomLevel}%</span>
                    </motion.div>
                )}

                {/* Page charset */}
                {pageInfo?.charset && (
                    <div className="status-item charset-info">
                        <span className="status-text">{pageInfo.charset}</span>
                    </div>
                )}

                {/* Line ending indicator */}
                <div className="status-item line-ending">
                    <span className="status-text">UTF-8</span>
                </div>
            </div>
        </div>
    );
};
