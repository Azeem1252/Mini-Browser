import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../../services/ApiClient';
import './BookmarksPanel.css';

export interface HistoryEntry {
    id: number;
    title: string;
    url: string;
    timestamp: number;
    favicon?: string;
}

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (url: string) => void;
    onShowToast?: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
    isBackendOnline: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onShowToast,
    isBackendOnline,
}) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Fetch history EXCLUSIVELY from C++ Backend
    const loadHistory = useCallback(async () => {
        try {
            const backendHistory = await ApiClient.getHistory();

            const mapped: HistoryEntry[] = backendHistory.map((url: string) => ({
                id: Math.random(),
                title: url, // Backend only returns URLs
                url: url,
                timestamp: Date.now()
            }));

            setHistory(mapped);
        } catch (error) {
            console.error('Failed to load history from backend (is browser_server.exe running?):', error);
            setHistory([]); // Explicitly clear state on backend error
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, loadHistory]);

    const handleClearAll = async () => {
        const success = await ApiClient.clearHistory();
        if (success) {
            setHistory([]);
            onShowToast?.('success', 'History Cleared', 'Removed from C++ Backend.');
        } else {
            onShowToast?.('error', 'Clear Failed', 'Could not sync with backend.');
        }
        setShowClearConfirm(false);
    };

    const handleDelete = (id: number) => {
        setHistory(prev => prev.filter((h) => h.id !== id));
        onShowToast?.('info', 'Entry Removed', 'UI updated.');
    };

    const handleNavigate = (url: string) => {
        // Sync with backend
        ApiClient.navigate(url);
        onNavigate(url);
        onClose();
    };

    const filteredHistory = history.filter(
        (entry) =>
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedHistory = filteredHistory.reduce((groups, entry) => {
        const date = new Date(entry.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (date.toDateString() === today.toDateString()) {
            label = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = 'Yesterday';
        } else {
            label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(entry);
        return groups;
    }, {} as Record<string, HistoryEntry[]>);

    if (!isOpen) return null;

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className="history-panel animate-slideDown">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        History
                    </h2>
                    <div className="panel-actions">
                        {history.length > 0 && (
                            <button className="clear-button" onClick={() => setShowClearConfirm(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Clear All
                            </button>
                        )}
                        <button className="panel-close" onClick={onClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="panel-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {!isBackendOnline && (
                    <div className="offline-notice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Backend Offline: History results may be incomplete.</span>
                    </div>
                )}

                <div className="panel-content">
                    {Object.keys(groupedHistory).length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>{searchQuery ? 'No history found' : 'No browsing history'}</p>
                            <span>Your browsing history will appear here</span>
                        </div>
                    ) : (
                        <div className="history-groups">
                            {Object.entries(groupedHistory).map(([label, entries]) => (
                                <div key={label} className="history-group">
                                    <h3 className="history-group-label">{label}</h3>
                                    <div className="history-list">
                                        {entries.map((entry) => (
                                            <div key={entry.id} className="history-item">
                                                <button
                                                    className="history-link"
                                                    onClick={() => handleNavigate(entry.url)}
                                                >
                                                    {entry.favicon ? (
                                                        <img src={entry.favicon} alt="" className="history-favicon" />
                                                    ) : (
                                                        <svg className="history-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                        </svg>
                                                    )}
                                                    <div className="history-info">
                                                        <span className="history-title">{entry.title}</span>
                                                        <span className="history-url">{entry.url}</span>
                                                    </div>
                                                    <span className="history-time">
                                                        {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </button>
                                                <button
                                                    className="history-delete"
                                                    onClick={() => handleDelete(entry.id)}
                                                    aria-label="Delete from history"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear confirmation modal */}
                {showClearConfirm && (
                    <div className="confirm-overlay" onClick={() => setShowClearConfirm(false)}>
                        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="confirm-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3>Clear all browsing history?</h3>
                            <p>This action cannot be undone. All your browsing history will be permanently deleted.</p>
                            <div className="confirm-actions">
                                <button className="btn-cancel" onClick={() => setShowClearConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="btn-confirm" onClick={handleClearAll}>
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
