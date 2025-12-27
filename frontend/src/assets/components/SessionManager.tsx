import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BrowserSession } from '../../types';
import './SessionManager.css';

interface SessionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentTabs: { url: string; title: string; isPinned?: boolean; groupId?: string }[];
    onRestoreSession: (session: BrowserSession) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
    isOpen,
    onClose,
    currentTabs,
    onRestoreSession,
}) => {
    const [sessions, setSessions] = useState<BrowserSession[]>(() => {
        const saved = localStorage.getItem('browser_sessions');
        return saved ? JSON.parse(saved) : [];
    });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<BrowserSession | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Save sessions to localStorage
    useEffect(() => {
        localStorage.setItem('browser_sessions', JSON.stringify(sessions));
    }, [sessions]);

    // Auto-save removed: Sessions are now strictly manual to prevent localStorage history leaks

    const saveSession = useCallback((name: string) => {
        if (currentTabs.length === 0) return;

        const newSession: BrowserSession = {
            id: `session-${Date.now()}`,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            windows: [{
                id: 1,
                tabs: currentTabs.map(tab => ({
                    url: tab.url,
                    title: tab.title,
                    isPinned: tab.isPinned || false,
                    groupId: tab.groupId,
                })),
                activeTabIndex: 0,
            }],
        };

        setSessions(prev => [newSession, ...prev.filter(s => !s.isDefault)]);
        setShowSaveModal(false);
    }, [currentTabs]);

    const deleteSession = useCallback((sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setSelectedSession(null);
    }, []);

    // Rename session - reserved for future UI
    const _renameSession = useCallback((sessionId: string, newName: string) => {
        setSessions(prev =>
            prev.map(s =>
                s.id === sessionId ? { ...s, name: newName, updatedAt: Date.now() } : s
            )
        );
    }, []);

    void _renameSession;

    const handleRestore = useCallback((session: BrowserSession) => {
        onRestoreSession(session);
        onClose();
    }, [onRestoreSession, onClose]);

    const filteredSessions = sessions.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.windows.some(w =>
            w.tabs.some(t =>
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.url.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const getTotalTabCount = (session: BrowserSession) => {
        return session.windows.reduce((acc, w) => acc + w.tabs.length, 0);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="session-manager-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="session-manager"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="session-manager-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                                <path d="M8 21h8M12 17v4" strokeWidth="2" />
                            </svg>
                            Session Manager
                        </h2>
                        <button className="close-button" onClick={onClose}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="session-actions">
                        <div className="search-container">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="save-session-btn" onClick={() => setShowSaveModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2" />
                                <polyline points="17,21 17,13 7,13 7,21" strokeWidth="2" />
                                <polyline points="7,3 7,8 15,8" strokeWidth="2" />
                            </svg>
                            Save Current Session
                        </button>
                    </div>

                    {/* Session list */}
                    <div className="session-list">
                        {filteredSessions.length === 0 ? (
                            <div className="empty-sessions">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                                    <path d="M8 21h8M12 17v4" strokeWidth="2" />
                                </svg>
                                <p>No saved sessions</p>
                                <span>Save your current tabs to restore them later</span>
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <motion.div
                                    key={session.id}
                                    className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedSession(session)}
                                    whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
                                    layout
                                >
                                    <div className="session-icon">
                                        {session.isDefault ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="session-info">
                                        <h3>{session.name}</h3>
                                        <div className="session-meta">
                                            <span>{getTotalTabCount(session)} tabs</span>
                                            <span>•</span>
                                            <span>{formatDate(session.updatedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="session-actions-inline">
                                        <button
                                            className="restore-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRestore(session);
                                            }}
                                            title="Restore session"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="1,4 1,10 7,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeWidth="2" />
                                            </svg>
                                        </button>
                                        {!session.isDefault && (
                                            <button
                                                className="delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                title="Delete session"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <polyline points="3,6 5,6 21,6" strokeWidth="2" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Session preview */}
                    <AnimatePresence>
                        {selectedSession && (
                            <motion.div
                                className="session-preview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="preview-header">
                                    <h3>{selectedSession.name}</h3>
                                    <span>{formatDate(selectedSession.updatedAt)}</span>
                                </div>
                                <div className="preview-tabs">
                                    {selectedSession.windows.map((window, windowIndex) => (
                                        <div key={window.id} className="preview-window">
                                            {selectedSession.windows.length > 1 && (
                                                <div className="window-label">Window {windowIndex + 1}</div>
                                            )}
                                            {window.tabs.map((tab, tabIndex) => (
                                                <div key={tabIndex} className="preview-tab">
                                                    {tab.isPinned && (
                                                        <svg className="pin-icon" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                                                            <rect x="8" y="2" width="8" height="4" rx="1" />
                                                        </svg>
                                                    )}
                                                    <span className="tab-title">{tab.title || tab.url}</span>
                                                    <span className="tab-url">{tab.url}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="preview-actions">
                                    <button
                                        className="restore-full-btn"
                                        onClick={() => handleRestore(selectedSession)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <polyline points="1,4 1,10 7,10" strokeWidth="2" />
                                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeWidth="2" />
                                        </svg>
                                        Restore This Session
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Save modal */}
                    <AnimatePresence>
                        {showSaveModal && (
                            <SaveSessionModal
                                onSave={saveSession}
                                onClose={() => setShowSaveModal(false)}
                                tabCount={currentTabs.length}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Save session modal
interface SaveSessionModalProps {
    onSave: (name: string) => void;
    onClose: () => void;
    tabCount: number;
}

const SaveSessionModal: React.FC<SaveSessionModalProps> = ({ onSave, onClose, tabCount }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const suggestedNames = [
        `Work Session - ${new Date().toLocaleDateString()}`,
        `Research`,
        `Project`,
        `Reading List`,
    ];

    return (
        <motion.div
            className="save-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="save-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Save Session</h3>
                <p className="save-modal-info">
                    Save {tabCount} tab{tabCount !== 1 ? 's' : ''} to restore later
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Session Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a name..."
                            autoFocus
                            required
                        />
                    </div>
                    <div className="suggested-names">
                        {suggestedNames.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                className="suggestion-btn"
                                onClick={() => setName(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={!name.trim()}>
                            Save Session
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
