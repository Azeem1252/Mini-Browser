import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient, type BackendBookmark } from '../../services/ApiClient';
import './BookmarksPanel.css';

export interface Bookmark {
    id: number;
    title: string;
    url: string;
    favicon?: string;
    folder?: string;
    timestamp: number;
}

interface BookmarksPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (url: string) => void;
    onShowToast?: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onShowToast,
}) => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch bookmarks EXCLUSIVELY from C++ Backend
    const loadBookmarks = useCallback(async () => {
        try {
            const backendBookmarks = await ApiClient.getBookmarks();

            // Map backend data to local Bookmark type
            const mapped: Bookmark[] = backendBookmarks.map((bb: BackendBookmark) => ({
                id: Math.random(),
                title: bb.title,
                url: bb.url,
                timestamp: Date.now()
            }));

            setBookmarks(mapped);
        } catch (error) {
            console.error('Failed to load bookmarks from backend:', error);
            setBookmarks([]); // Ensure empty state on error (no localStorage leakage)
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadBookmarks();
        }
    }, [isOpen, loadBookmarks]);

    const handleDelete = (id: number) => {
        // TODO: Implement backend delete when endpoint is ready
        setBookmarks(prev => prev.filter((b) => b.id !== id));
        onShowToast?.('info', 'Bookmark Removed', 'UI updated. Backend sync pending.');
    };

    const handleNavigate = (url: string) => {
        // Sync navigation with backend
        ApiClient.navigate(url);
        onNavigate(url);
        onClose();
    };

    const filteredBookmarks = bookmarks.filter(
        (bookmark) =>
            bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className="bookmarks-panel animate-slideDown">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Bookmarks
                    </h2>
                    <button className="panel-close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="panel-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search bookmarks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="panel-content">
                    {filteredBookmarks.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>{searchQuery ? 'No bookmarks found' : 'No bookmarks saved to Backend'}</p>
                            <span>Press Ctrl+D to save a bookmark to the C++ Engine.</span>
                        </div>
                    ) : (
                        <div className="bookmarks-list">
                            {filteredBookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="bookmark-item">
                                    <button
                                        className="bookmark-link"
                                        onClick={() => handleNavigate(bookmark.url)}
                                    >
                                        {bookmark.favicon ? (
                                            <img src={bookmark.favicon} alt="" className="bookmark-favicon" />
                                        ) : (
                                            <svg className="bookmark-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        <div className="bookmark-info">
                                            <span className="bookmark-title">{bookmark.title}</span>
                                            <span className="bookmark-url">{bookmark.url}</span>
                                        </div>
                                    </button>
                                    <button
                                        className="bookmark-delete"
                                        onClick={() => handleDelete(bookmark.id)}
                                        aria-label="Delete bookmark"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
