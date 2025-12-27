import React, { useState, useEffect, useCallback } from 'react';
import './BookmarksPanel.css';

export interface Download {
    id: string;
    filename: string;
    url: string;
    size: number;
    progress: number;
    received: number;
    status: 'downloading' | 'completed' | 'paused' | 'failed' | 'cancelled' | 'interrupted';
    timestamp: number;
    path?: string;
}

interface DownloadsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ isOpen, onClose, onShowToast }) => {
    const [downloads, setDownloads] = useState<Download[]>([]);

    useEffect(() => {
        // Check if we're in Electron
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI) return;

        // Listen for download started
        electronAPI.onDownloadStarted((data: any) => {
            console.log('[DownloadsPanel] Download started:', data);
            setDownloads(prev => {
                // Avoid duplicates by ID
                if (prev.some(d => d.id === data.id)) return prev;
                return [{
                    id: data.id,
                    filename: data.filename,
                    url: data.url,
                    size: data.size || 0,
                    progress: 0,
                    received: 0,
                    status: 'downloading',
                    timestamp: Date.now(),
                    path: data.path
                }, ...prev];
            });
        });

        // Listen for download progress
        electronAPI.onDownloadProgress((data: any) => {
            setDownloads(prev => prev.map(d =>
                d.id === data.id
                    ? { ...d, progress: data.progress, received: data.received, size: data.total || d.size }
                    : d
            ));
        });

        // Listen for download completed
        electronAPI.onDownloadCompleted((data: any) => {
            console.log('[DownloadsPanel] Download completed:', data);
            setDownloads(prev => prev.map(d =>
                d.id === data.id
                    ? { ...d, status: 'completed', progress: 100, path: data.path }
                    : d
            ));
        });

        // Listen for download failed
        electronAPI.onDownloadFailed((data: any) => {
            console.log('[DownloadsPanel] Download failed:', data);
            setDownloads(prev => prev.map(d =>
                d.id === data.id
                    ? { ...d, status: 'failed' }
                    : d
            ));
        });

        // Cleanup not needed as ipcRenderer.on persists
    }, []);

    const handleClearAll = () => {
        setDownloads(prev => prev.filter(d => d.status === 'downloading'));
        onShowToast?.('info', 'Cleared', 'Completed downloads cleared from list.');
    };

    const handleDelete = (id: string) => {
        setDownloads(prev => prev.filter((d) => d.id !== id));
    };

    const handleCancel = async (id: string) => {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI) {
            const success = await electronAPI.cancelDownload(id);
            if (success) {
                setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'cancelled' } : d));
            }
        }
    };

    const handleOpen = async (path?: string) => {
        if (!path) {
            alert('File path missing.');
            return;
        }
        const electronAPI = (window as any).electronAPI;
        if (electronAPI) {
            const result = await electronAPI.openDownload(path);
            if (!result.success) alert(`Error: ${result.error}`);
        }
    };

    const handleShowInFolder = async (path?: string) => {
        if (!path) {
            alert('File path missing.');
            return;
        }
        const electronAPI = (window as any).electronAPI;
        if (electronAPI) {
            const result = await electronAPI.showInFolder(path);
            if (!result.success) alert(`Error: ${result.error}`);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusIcon = (status: Download['status']) => {
        switch (status) {
            case 'downloading':
                return (
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" />
                    </svg>
                );
            case 'completed':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 4L12 14.01l-3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'cancelled':
            case 'failed':
            case 'interrupted':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className="downloads-panel glass-morphism animate-slideDown">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Downloads
                    </h2>
                    <div className="panel-actions">
                        {downloads.length > 0 && (
                            <button className="clear-button" onClick={handleClearAll}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Clear All</span>
                            </button>
                        )}
                        <button className="panel-close" onClick={onClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="panel-content">
                    {downloads.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>No downloads yet</p>
                            <span>Files you download will appear here</span>
                        </div>
                    ) : (
                        <div className="downloads-list">
                            {downloads.map((download) => (
                                <div key={download.id} className="download-item-premium">
                                    <div className="download-icon-box" data-status={download.status}>
                                        {getStatusIcon(download.status)}
                                    </div>
                                    <div className="download-details">
                                        <div className="download-header-row">
                                            <span className="download-name" title={download.filename}>
                                                {download.filename}
                                            </span>
                                            <button
                                                className="download-remove-btn"
                                                onClick={() => handleDelete(download.id)}
                                                aria-label="Remove"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="download-sub-meta">
                                            <span className="download-size-label">
                                                {formatFileSize(download.received)} / {formatFileSize(download.size)}
                                            </span>
                                            <span className="dot-separator">•</span>
                                            <span className={`status-tag status-${download.status}`}>
                                                {download.status === 'downloading' ? `${download.progress}%` : download.status}
                                            </span>
                                        </div>

                                        {download.status === 'downloading' && (
                                            <>
                                                <div className="premium-progress-container">
                                                    <div
                                                        className="premium-progress-bar"
                                                        style={{ width: `${download.progress}%` }}
                                                    />
                                                </div>
                                                <div className="download-actions-row">
                                                    <button className="action-link-btn cancel-btn" onClick={() => handleCancel(String(download.id))}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {download.status === 'completed' && download.path && (
                                            <div className="download-actions-row">
                                                <button className="action-link-btn" onClick={() => handleOpen(download.path)}>
                                                    Open File
                                                </button>
                                                <button className="action-link-btn" onClick={() => handleShowInFolder(download.path)}>
                                                    Show in Folder
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
