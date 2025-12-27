import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { QuickLink } from '../../types';
import './SpeedDial.css';

interface SpeedDialProps {
    onNavigate: (url: string) => void;
}

const DEFAULT_QUICK_LINKS: QuickLink[] = [
    { id: '1', title: 'Google', url: 'https://www.google.com', favicon: '', color: '#4285F4', isPinned: true, visitCount: 0, lastVisited: 0 },
    { id: '2', title: 'YouTube', url: 'https://www.youtube.com', favicon: '', color: '#FF0000', isPinned: true, visitCount: 0, lastVisited: 0 },
    { id: '3', title: 'GitHub', url: 'https://www.github.com', favicon: '', color: '#24292E', isPinned: true, visitCount: 0, lastVisited: 0 },
    { id: '4', title: 'Twitter', url: 'https://www.twitter.com', favicon: '', color: '#1DA1F2', isPinned: true, visitCount: 0, lastVisited: 0 },
    { id: '5', title: 'Reddit', url: 'https://www.reddit.com', favicon: '', color: '#FF4500', isPinned: false, visitCount: 0, lastVisited: 0 },
    { id: '6', title: 'Wikipedia', url: 'https://www.wikipedia.org', favicon: '', color: '#636466', isPinned: false, visitCount: 0, lastVisited: 0 },
];

export const SpeedDial: React.FC<SpeedDialProps> = ({ onNavigate }) => {
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>(() => {
        const saved = localStorage.getItem('quick_links');
        return saved ? JSON.parse(saved) : DEFAULT_QUICK_LINKS;
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Save quick links to localStorage
    useEffect(() => {
        localStorage.setItem('quick_links', JSON.stringify(quickLinks));
    }, [quickLinks]);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const addQuickLink = useCallback((link: Omit<QuickLink, 'id' | 'visitCount' | 'lastVisited'>) => {
        const newLink: QuickLink = {
            ...link,
            id: `link-${Date.now()}`,
            visitCount: 0,
            lastVisited: 0,
        };
        setQuickLinks(prev => [...prev, newLink]);
        setShowAddModal(false);
    }, []);

    const updateQuickLink = useCallback((id: string, updates: Partial<QuickLink>) => {
        setQuickLinks(prev =>
            prev.map(link => (link.id === id ? { ...link, ...updates } : link))
        );
        setEditingLink(null);
    }, []);

    const deleteQuickLink = useCallback((id: string) => {
        setQuickLinks(prev => prev.filter(link => link.id !== id));
    }, []);

    const handleLinkClick = useCallback((link: QuickLink) => {
        // Update visit count and timestamp
        setQuickLinks(prev =>
            prev.map(l =>
                l.id === link.id
                    ? { ...l, visitCount: l.visitCount + 1, lastVisited: Date.now() }
                    : l
            )
        );
        onNavigate(link.url);
    }, [onNavigate]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Check if it's a URL
            if (searchQuery.includes('.') && !searchQuery.includes(' ')) {
                onNavigate(searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`);
            } else {
                onNavigate(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
            }
        }
    }, [searchQuery, onNavigate]);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = () => {
        return currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const getInitials = (title: string) => {
        return title
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="speed-dial">
            {/* Header with time and greeting */}
            <motion.div
                className="speed-dial-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="time-display">{formatTime()}</div>
                <div className="greeting">{getGreeting()}</div>
                <div className="date-display">{formatDate()}</div>
            </motion.div>

            {/* Search bar */}
            <motion.form
                className="speed-dial-search"
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="search-container">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="search-icon">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search or enter URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.form>

            {/* Quick links grid */}
            <motion.div
                className="quick-links-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="quick-links-header">
                    <h2>Quick Links</h2>
                    <button className="add-link-button" onClick={() => setShowAddModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add Link
                    </button>
                </div>

                <Reorder.Group
                    axis="x"
                    values={quickLinks}
                    onReorder={setQuickLinks}
                    className="quick-links-grid"
                >
                    <AnimatePresence>
                        {quickLinks.map((link, index) => (
                            <Reorder.Item
                                key={link.id}
                                value={link}
                                className="quick-link-item"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div
                                    className="quick-link-card"
                                    onClick={() => handleLinkClick(link)}
                                >
                                    <div
                                        className="quick-link-icon"
                                        style={{ backgroundColor: link.color || 'var(--accent-primary)' }}
                                    >
                                        {link.favicon ? (
                                            <img src={link.favicon} alt="" />
                                        ) : (
                                            <span>{getInitials(link.title)}</span>
                                        )}
                                    </div>
                                    <span className="quick-link-title">{link.title}</span>
                                    {link.isPinned && (
                                        <div className="quick-link-pinned">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                                                <rect x="8" y="2" width="8" height="4" rx="1" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="quick-link-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLink(link);
                                            }}
                                            title="Edit"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" />
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteQuickLink(link.id);
                                            }}
                                            title="Delete"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </motion.div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {(showAddModal || editingLink) && (
                    <QuickLinkModal
                        link={editingLink}
                        onSave={(link) => {
                            if (editingLink) {
                                updateQuickLink(editingLink.id, link);
                            } else {
                                addQuickLink(link);
                            }
                        }}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingLink(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Modal component for adding/editing quick links
interface QuickLinkModalProps {
    link: QuickLink | null;
    onSave: (link: Omit<QuickLink, 'id' | 'visitCount' | 'lastVisited'>) => void;
    onClose: () => void;
}

const QuickLinkModal: React.FC<QuickLinkModalProps> = ({ link, onSave, onClose }) => {
    const [title, setTitle] = useState(link?.title || '');
    const [url, setUrl] = useState(link?.url || '');
    const [color, setColor] = useState(link?.color || '#6366f1');
    const [isPinned, setIsPinned] = useState(link?.isPinned || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && url) {
            onSave({ title, url, color, isPinned });
        }
    };

    const colorOptions = [
        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
        '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
        '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
    ];

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="quick-link-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>{link ? 'Edit Quick Link' : 'Add Quick Link'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Google"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-picker">
                            {colorOptions.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                            />
                            Pin to start
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save">
                            {link ? 'Save Changes' : 'Add Link'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
