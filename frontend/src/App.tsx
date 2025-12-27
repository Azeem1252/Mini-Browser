import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedTabBar, type Tab, type TabGroup } from './assets/components/EnhancedTabBar';
import { AddressBar } from './assets/components/AddressBar';
import { NavigationControls } from './assets/components/NavigationControls';
import { WebViewBrowser } from './components/WebViewBrowser';
import { BookmarksPanel } from './assets/components/BookmarksPanel';
import { HistoryPanel } from './assets/components/HistoryPanel';
import { SettingsPanel } from './assets/components/SettingsPanel';
import { DownloadsPanel } from './assets/components/DownloadsPanel';
import { CommandPalette } from './assets/components/CommandPalette';
import { ZoomControls } from './assets/components/ZoomControls';
import { FindInPage } from './assets/components/FindInPage';
import { QRCodeGenerator } from './assets/components/QRCodeGenerator';
import { Confetti } from './assets/components/Confetti';
import { GameHub } from './assets/components/GameHub';
import { StatusBar } from './assets/components/StatusBar';
import { SpeedDial } from './assets/components/SpeedDial';
import { SessionManager } from './assets/components/SessionManager';
import { ToastContainer, type ToastMessage } from './assets/components/Toast';
import type { BrowserSession } from './types';
import { ApiClient } from './services/ApiClient';
import './App.css';

interface TabState extends Tab {
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    navigationHistory: string[];  // Array of URLs visited in this tab
    currentHistoryIndex: number;  // Current position in history (-1 = no history)
}

// Smart URL parser - converts user input to proper URL
function parseURL(input: string): string {
    if (!input || input === 'about:blank') return 'about:blank';

    // Already has protocol
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return input;
    }

    // Looks like a domain (has a dot)
    if (input.includes('.')) {
        return `https://${input}`;
    }

    // Otherwise, treat as search query
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

function App() {
    // Tab management
    const [browserState, setBrowserState] = useState<{
        tabs: TabState[];
        activeTabId: number;
    }>(() => {
        const initialId = Date.now();
        return {
            tabs: [{
                id: initialId,
                title: 'New Tab',
                url: 'about:blank',
                isLoading: false,
                canGoBack: false,
                canGoForward: false,
                navigationHistory: [],
                currentHistoryIndex: -1,
            }],
            activeTabId: initialId
        };
    });

    const { tabs, activeTabId } = browserState;

    // UI state
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showDownloads, setShowDownloads] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showFindInPage, setShowFindInPage] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showGame, setShowGame] = useState(false);
    const [showSessionManager, setShowSessionManager] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Tab Groups State (uses Linked List concept for ordering)
    const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
        const saved = localStorage.getItem('tab_groups');
        return saved ? JSON.parse(saved) : [];
    });

    // Toast helper function
    const showToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
        const newToast: ToastMessage = {
            id: Date.now().toString(),
            type,
            title,
            message,
            duration: 3000,
        };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Download tracking map to match Electron IDs to our IDs
    const listenersSetUp = useRef(false);
    const processedDownloads = useRef<Set<string>>(new Set()); // Track processed download IDs

    // Listen for download events from Electron (only once)
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI || listenersSetUp.current) return;

        listenersSetUp.current = true;

        // Download started
        electronAPI.onDownloadStarted?.(async (data: any) => {
            // Extra deduplication at event level
            const dedupeKey = `${data.url}::${data.filename}`;
            if (processedDownloads.current.has(dedupeKey)) {
                console.log('[Download] Skipping duplicate event for:', data.filename);
                return;
            }
            processedDownloads.current.add(dedupeKey);
            // Clear after 10 seconds to allow re-download
            setTimeout(() => processedDownloads.current.delete(dedupeKey), 10000);

            // 1. Sync with C++ Backend
            const success = await ApiClient.addDownload(String(data.id), data.filename, data.url);

            if (success) {
                setShowDownloads(true); // Auto-open downloads panel
                showToast('info', 'Download Sync Status', `Downloading: ${data.filename} [Synced to C++ Backend]`);
            } else {
                showToast('warning', 'Backend Offline', `Downloading: ${data.filename} [Backend NOT Synced - Local Only]`);
            }
        });

        // Download progress
        electronAPI.onDownloadProgress?.((_data: any) => {
            // Logic moved to Backend polling in DownloadsPanel
        });

        // Download completed
        electronAPI.onDownloadCompleted?.((data: any) => {
            showToast('success', 'Download Complete', `${data.filename} is ready!`);
        });

        // Download failed
        electronAPI.onDownloadFailed?.((data: any) => {
            if (data.error !== 'cancelled') {
                showToast('error', 'Download Failed', `${data.filename} failed: ${data.error}`);
            }
        });
    }, [showToast]);

    // Webview refs for direct control
    const webviewRefs = useRef<Map<number, any>>(new Map());

    // Theme management
    useEffect(() => {
        const savedTheme = localStorage.getItem('browser_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Add Global Undo Listener (Ctrl+Z)
        const handleUndoShortcut = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                ApiClient.undo().then(success => {
                    if (success) {
                        showToast('info', 'Undo Action', 'Restoring last closed tab...');
                        // In a production app, we'd fetch the full tab state here.
                        // For this project, we notify the user that the backend restored it.
                    }
                });
            }
        };

        window.addEventListener('keydown', handleUndoShortcut);
        return () => window.removeEventListener('keydown', handleUndoShortcut);
    }, [showToast]);

    // Note: Navigation state is now managed per-tab in the frontend
    // No need for backend polling

    const activeTab = tabs.find((tab) => tab.id === activeTabId);

    // Update tab helper
    const updateTab = useCallback((tabId: number, updates: Partial<TabState>) => {
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
        }));
    }, []);

    // Navigation handler - Does NOT sync to backend (did-navigate handles that)
    const handleNavigate = useCallback((input: string, tabId?: number) => {
        const targetTabId = tabId || activeTabId;
        const url = parseURL(input);

        // Just update local state and let webview navigate
        // The did-navigate event will sync the FINAL URL to C++ backend
        updateTab(targetTabId, {
            url,
            title: url,
            isLoading: true,
        });
    }, [activeTabId, updateTab]);

    // Flag to prevent re-syncing URL to backend during Back/Forward navigation
    const isNavigatingFromBackForward = useRef<boolean>(false);

    // Navigation controls - USE PER-TAB HISTORY
    const handleGoBack = useCallback(() => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (!currentTab || currentTab.currentHistoryIndex <= 0) return;

        const newIndex = currentTab.currentHistoryIndex - 1;
        const previousUrl = currentTab.navigationHistory[newIndex];

        // Set flag to prevent re-sync
        isNavigatingFromBackForward.current = true;

        // Update webview
        const webviewRef = webviewRefs.current.get(activeTabId);
        const webview = webviewRef?.current;
        if (webview) {
            webview.src = previousUrl;
        }

        // Update tab state
        updateTab(activeTabId, {
            url: previousUrl,
            currentHistoryIndex: newIndex,
            canGoBack: newIndex > 0,
            canGoForward: true,
        });

        // Reset flag
        setTimeout(() => { isNavigatingFromBackForward.current = false; }, 500);
    }, [activeTabId, tabs, updateTab]);

    const handleGoForward = useCallback(() => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (!currentTab || currentTab.currentHistoryIndex >= currentTab.navigationHistory.length - 1) return;

        const newIndex = currentTab.currentHistoryIndex + 1;
        const nextUrl = currentTab.navigationHistory[newIndex];

        // Set flag to prevent re-sync
        isNavigatingFromBackForward.current = true;

        // Update webview
        const webviewRef = webviewRefs.current.get(activeTabId);
        const webview = webviewRef?.current;
        if (webview) {
            webview.src = nextUrl;
        }

        // Update tab state
        updateTab(activeTabId, {
            url: nextUrl,
            currentHistoryIndex: newIndex,
            canGoBack: true,
            canGoForward: newIndex < currentTab.navigationHistory.length - 1,
        });

        // Reset flag
        setTimeout(() => { isNavigatingFromBackForward.current = false; }, 500);
    }, [activeTabId, tabs, updateTab]);

    const handleRefresh = useCallback(() => {
        const webviewRef = webviewRefs.current.get(activeTabId);
        const webview = webviewRef?.current;
        if (webview) {
            webview.reload();
        }
    }, [activeTabId]);

    const handleHome = useCallback(() => {
        handleNavigate('about:blank', activeTabId);
    }, [activeTabId, handleNavigate]);

    // Tab management
    const handleNewTab = useCallback(() => {
        const newId = Date.now();
        const newTab: TabState = {
            id: newId,
            title: 'New Tab',
            url: 'about:blank',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            navigationHistory: [],
            currentHistoryIndex: -1,
        };

        // Sync with backend
        ApiClient.createTab().catch(err => console.error('Backend tab creation failed:', err));

        setBrowserState(prev => ({
            tabs: [...prev.tabs, newTab],
            activeTabId: newId
        }));
    }, []);

    const handleCloseTab = useCallback(
        (tabId: number) => {
            // Sync with backend before closing locally
            ApiClient.closeTab(tabId).catch(err => console.error('Backend tab closure failed:', err));

            setBrowserState(prev => {
                if (prev.tabs.length === 1) {
                    return {
                        ...prev,
                        tabs: prev.tabs.map(t => t.id === tabId ? {
                            ...t,
                            url: 'about:blank',
                            title: 'New Tab',
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            navigationHistory: [],
                            currentHistoryIndex: -1,
                        } : t)
                    };
                }

                const tabIndex = prev.tabs.findIndex((tab) => tab.id === tabId);
                const nextTabs = prev.tabs.filter((tab) => tab.id !== tabId);
                const nextActiveId = prev.activeTabId === tabId
                    ? nextTabs[Math.max(0, tabIndex - 1)].id
                    : prev.activeTabId;

                return {
                    tabs: nextTabs,
                    activeTabId: nextActiveId
                };
            });

            // Clean up webview ref
            webviewRefs.current.delete(tabId);
        },
        []
    );

    // ===============================================
    // TAB GROUP HANDLERS
    // ===============================================

    // Save groups to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('tab_groups', JSON.stringify(tabGroups));
    }, [tabGroups]);

    // Reorder tabs (for drag-drop) - preserves TabState properties from existing tabs
    const handleTabsReorder = useCallback((newTabOrder: Tab[]) => {
        setBrowserState(prev => {
            // Map the new order while preserving full TabState properties
            const reorderedTabs = newTabOrder.map(newTab => {
                const existingTab = prev.tabs.find(t => t.id === newTab.id);
                return existingTab || { ...newTab, isLoading: false, canGoBack: false, canGoForward: false, navigationHistory: [], currentHistoryIndex: -1 };
            });
            return { ...prev, tabs: reorderedTabs };
        });
    }, []);

    // Pin a tab
    const handleTabPin = useCallback((tabId: number) => {
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                t.id === tabId ? { ...t, isPinned: true, groupId: null } : t
            )
        }));
        showToast('success', 'Tab Pinned', 'Tab has been pinned');
    }, [showToast]);

    // Unpin a tab
    const handleTabUnpin = useCallback((tabId: number) => {
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                t.id === tabId ? { ...t, isPinned: false } : t
            )
        }));
    }, []);

    // Create a new tab group
    const handleCreateGroup = useCallback((name: string, color: string, tabIds: number[]) => {
        const groupId = `group-${Date.now()}`;
        setTabGroups(prev => [...prev, { id: groupId, name, color, collapsed: false }]);

        // Add tabs to the group
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                tabIds.includes(t.id) ? { ...t, groupId } : t
            )
        }));
        showToast('success', 'Group Created', `Created group "${name}"`);
    }, [showToast]);

    // Add tab to existing group
    const handleAddToGroup = useCallback((tabId: number, groupId: string) => {
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                t.id === tabId ? { ...t, groupId, isPinned: false } : t
            )
        }));
    }, []);

    // Remove tab from group
    const handleRemoveFromGroup = useCallback((tabId: number) => {
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                t.id === tabId ? { ...t, groupId: null } : t
            )
        }));
    }, []);

    // Toggle group collapse
    const handleToggleGroupCollapse = useCallback((groupId: string) => {
        setTabGroups(prev =>
            prev.map(g =>
                g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
            )
        );
    }, []);

    // Delete a group (tabs become ungrouped)
    const handleDeleteGroup = useCallback((groupId: string) => {
        // Remove group from list
        setTabGroups(prev => prev.filter(g => g.id !== groupId));

        // Ungroup all tabs in this group
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t =>
                t.groupId === groupId ? { ...t, groupId: null } : t
            )
        }));
    }, []);

    // Rename a group
    const handleRenameGroup = useCallback((groupId: string, name: string) => {
        setTabGroups(prev =>
            prev.map(g =>
                g.id === groupId ? { ...g, name } : g
            )
        );
    }, []);

    // Track last synced URL to prevent duplicates from redirects
    const lastSyncedUrl = useRef<string>('');

    // URL Normalization for deduplication (handles www, trailing slashes, etc.)
    const normalizeUrl = useCallback((url: string) => {
        if (!url || url === 'about:blank' || url === 'home://') return url;
        try {
            const u = new URL(url);
            // Remove 'www.' prefix and trailing slashes for comparison
            const host = u.hostname.toLowerCase().replace(/^www\./, '');
            let path = u.pathname.replace(/\/$/, '') || '/';
            // Return a "canonical" version for sync comparison
            return `${u.protocol}//${host}${path}${u.search}`;
        } catch {
            return url.toLowerCase().replace(/\/$/, '');
        }
    }, []);

    // Webview event handlers - SYNC TO C++ BACKEND
    const handleWebViewNavigate = useCallback(async (tabId: number, url: string) => {
        // Skip blank pages and empty URLs
        if (!url || url === 'about:blank' || url === 'home://') return;

        // 1. Update local UI state
        updateTab(tabId, { url });

        // 2. Soft normalization for deduplication
        const normalizedNew = normalizeUrl(url);
        const normalizedLast = normalizeUrl(lastSyncedUrl.current);

        // 3. Skip sync if this navigation was triggered by Back/Forward button
        if (isNavigatingFromBackForward.current) {
            console.log('[handleWebViewNavigate] [BACK/FWD MODE] Skipping sync:', url);
            // Still update tracker to ensure we don't sync this later as a "new" URL
            lastSyncedUrl.current = url;
            return;
        }

        // 4. Skip if it's effectively the same URL (handles redirects)
        // BUT only if we've synced something before (lastSyncedUrl is not empty)
        if (lastSyncedUrl.current && normalizedNew === normalizedLast) {
            console.log('[handleWebViewNavigate] Skipping duplicate/redirect:', url);
            // Update lastSyncedUrl even if normalized match, to keep the exact URL updated
            lastSyncedUrl.current = url;
            return;
        }

        // 5. Add to tab's navigation history
        console.log('[handleWebViewNavigate] Adding to tab history:', url);
        lastSyncedUrl.current = url;

        // Also sync to backend for global history panel (optional)
        ApiClient.navigate(url, 0).catch(err => console.warn('Backend sync failed:', err));

        // 6. Update tab's navigation history
        setBrowserState(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => {
                if (t.id !== tabId) return t;

                // Remove any forward history (like real browsers do)
                const newHistory = t.navigationHistory.slice(0, t.currentHistoryIndex + 1);
                newHistory.push(url);

                return {
                    ...t,
                    navigationHistory: newHistory,
                    currentHistoryIndex: newHistory.length - 1,
                    canGoBack: newHistory.length > 1,
                    canGoForward: false,
                };
            })
        }));
    }, [normalizeUrl]);

    const handleWebViewTitleUpdate = useCallback((tabId: number, title: string) => {
        updateTab(tabId, { title });
    }, [updateTab]);

    const handleWebViewLoadingChange = useCallback((tabId: number, isLoading: boolean) => {
        updateTab(tabId, { isLoading });
    }, [updateTab]);

    // Bookmark current page
    const handleAddBookmark = useCallback(async () => {
        if (activeTab && activeTab.url !== 'about:blank') {
            // Save EXCLUSIVELY to C++ Backend
            const success = await ApiClient.addBookmark(activeTab.title, activeTab.url);

            if (success) {
                // Show success animation & toast only on REAL success
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                showToast('success', 'Bookmark Added', 'Page saved to C++ Backend!');
            } else {
                showToast('error', 'Sync Failed', 'Could not save bookmark. Is the backend running?');
            }
        }
    }, [activeTab, showToast]);

    // Session management
    const handleRestoreSession = useCallback((session: BrowserSession) => {
        const firstWindow = session.windows[0];
        if (!firstWindow) return;

        const baseId = Date.now();
        const restoredTabs: TabState[] = firstWindow.tabs.map((tab: any, index: number) => ({
            id: baseId + index,
            title: tab.title,
            url: tab.url,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            navigationHistory: [],
            currentHistoryIndex: -1,
        }));

        setBrowserState({
            tabs: restoredTabs,
            activeTabId: restoredTabs[firstWindow.activeTabIndex || 0]?.id || restoredTabs[0].id
        });
        setShowSessionManager(false);
    }, []);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setZoomLevel((prev) => Math.min(prev + 25, 500));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel((prev) => Math.max(prev - 25, 25));
    }, []);

    const handleZoomReset = useCallback(() => {
        setZoomLevel(100);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                handleNewTab();
            }
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                handleCloseTab(activeTabId);
            }
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                handleAddBookmark();
            }
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                setShowHistory(true);
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                setShowFindInPage(true);
            }
            if ((e.ctrlKey && e.key === '=') || (e.ctrlKey && e.key === '+')) {
                e.preventDefault();
                handleZoomIn();
            }
            if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            }
            if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                handleZoomReset();
            }
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                handleRefresh();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTabId, handleNewTab, handleCloseTab, handleAddBookmark, handleZoomIn, handleZoomOut, handleZoomReset, handleRefresh]);

    // Handle case where activeTab is not found - this can happen during state transitions
    // Return a loading state while React reconciles
    if (!activeTab) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary, #0f0f0f)',
                color: 'var(--text-primary, white)',
                fontFamily: 'var(--font-family, sans-serif)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--accent-primary, #6366f1)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary, #a1a1aa)' }}>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app">
            {/* Version Badge for debugging stale builds */}
            <div style={{
                position: 'fixed',
                top: '5px',
                right: '5px',
                zIndex: 9999,
                background: '#ff0000',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                pointerEvents: 'none'
            }}>
                v2.3 ALPHA - BACKEND-STRICT
            </div>
            {/* ParticleBackground removed for stability */}

            <div className="main-layout">
                <EnhancedTabBar
                    tabs={tabs}
                    activeTabId={activeTabId}
                    groups={tabGroups}
                    onTabSelect={(id: number) => setBrowserState(prev => ({ ...prev, activeTabId: id }))}
                    onTabClose={handleCloseTab}
                    onNewTab={handleNewTab}
                    onTabsReorder={handleTabsReorder}
                    onTabPin={handleTabPin}
                    onTabUnpin={handleTabUnpin}
                    onCreateGroup={handleCreateGroup}
                    onAddToGroup={handleAddToGroup}
                    onRemoveFromGroup={handleRemoveFromGroup}
                    onToggleGroupCollapse={handleToggleGroupCollapse}
                    onDeleteGroup={handleDeleteGroup}
                    onRenameGroup={handleRenameGroup}
                />

                <div className="browser-chrome">
                    <div className="toolbar">
                        <NavigationControls
                            canGoBack={activeTab?.canGoBack || false}
                            canGoForward={activeTab?.canGoForward || false}
                            isLoading={activeTab?.isLoading || false}
                            onBack={handleGoBack}
                            onForward={handleGoForward}
                            onRefresh={handleRefresh}
                            onHome={handleHome}
                        />

                        <AddressBar
                            url={activeTab?.url || ''}
                            isLoading={activeTab?.isLoading || false}
                            onNavigate={(url) => handleNavigate(url, activeTabId)}
                        />

                        <div className="browser-actions">
                            {/* Add Bookmark Button (Star) */}
                            <button
                                className="action-button"
                                title="Add Bookmark (Ctrl+D)"
                                onClick={handleAddBookmark}
                                disabled={!activeTab?.url || activeTab.url === 'about:blank'}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {/* View Bookmarks Button */}
                            <button className="action-button" title="Bookmarks" onClick={() => setShowBookmarks(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="action-button" title="History" onClick={() => setShowHistory(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="action-button" title="Downloads" onClick={() => setShowDownloads(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="action-button" title="Settings" onClick={() => setShowSettings(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <button className="action-button" title="QR Code" onClick={() => setShowQRCode(true)} disabled={!activeTab?.url || activeTab.url === 'about:blank'}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                                    <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                                    <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                                    <path d="M14 14h7v7h-7z" strokeWidth="2" />
                                </svg>
                            </button>
                            <button className="action-button" title="Games" onClick={() => setShowGame(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M6 12h4m2 0h4M6 8h.01M18 8h.01M6 16h.01M18 16h.01M9 20h6a6 6 0 006-6V8a6 6 0 00-6-6H9a6 6 0 00-6 6v6a6 6 0 006 6z" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <button className="action-button" title="Sessions" onClick={() => setShowSessionManager(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <ZoomControls
                            zoomLevel={zoomLevel}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onZoomReset={handleZoomReset}
                        />
                    </div>

                    {activeTab?.isLoading && (
                        <div className="loading-progress">
                            <div className="loading-progress-bar indeterminate" />
                        </div>
                    )}
                </div>

                <div className="browser-content">
                    <div className="webview-container">
                        {tabs.map((tab) => {
                            // Ensure ref exists
                            if (!webviewRefs.current.has(tab.id)) {
                                webviewRefs.current.set(tab.id, React.createRef<any>());
                            }
                            const webviewRef = webviewRefs.current.get(tab.id);

                            return (
                                <WebViewBrowser
                                    key={tab.id}
                                    ref={webviewRef}
                                    tabId={tab.id}
                                    url={tab.url}
                                    isActive={tab.id === activeTabId}
                                    zoomFactor={zoomLevel / 100}
                                    onNavigate={(url) => handleWebViewNavigate(tab.id, url)}
                                    onTitleUpdate={(title) => handleWebViewTitleUpdate(tab.id, title)}
                                    onLoadingChange={(isLoading) => handleWebViewLoadingChange(tab.id, isLoading)}
                                />
                            );
                        })}
                    </div>

                    {/* SpeedDial Overlay */}
                    {activeTab?.url === 'about:blank' && (
                        <div className="speed-dial-overlay" style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-primary)' }}>
                            <SpeedDial onNavigate={(url) => handleNavigate(url, activeTabId)} />
                        </div>
                    )}
                </div>

                <StatusBar
                    url={activeTab?.url || ''}
                    isLoading={activeTab?.isLoading || false}
                    zoomLevel={zoomLevel}
                    isSecure={activeTab?.url?.startsWith('https://') || false}
                    connectionInfo={{ protocol: 'https' }}
                />
            </div>

            {/* Panels & Modals (Outside Grid Flow) */}
            <BookmarksPanel
                isOpen={showBookmarks}
                onClose={() => setShowBookmarks(false)}
                onNavigate={(url) => handleNavigate(url, activeTabId)}
                onShowToast={showToast}
            />

            <HistoryPanel
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onNavigate={(url) => handleNavigate(url, activeTabId)}
                onShowToast={showToast}
            />

            <SettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />


            <DownloadsPanel
                isOpen={showDownloads}
                onClose={() => setShowDownloads(false)}
                onShowToast={showToast}
            />

            <SessionManager
                isOpen={showSessionManager}
                onClose={() => setShowSessionManager(false)}
                currentTabs={tabs.map(tab => ({ url: tab.url, title: tab.title, isPinned: false }))}
                onRestoreSession={handleRestoreSession}
            />

            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                tabs={tabs}
                onNavigateToTab={(id) => setBrowserState(prev => ({ ...prev, activeTabId: id }))}
                onNewTab={handleNewTab}
                onOpenBookmarks={() => setShowBookmarks(true)}
                onOpenHistory={() => setShowHistory(true)}
                onOpenSettings={() => setShowSettings(true)}
            />

            <FindInPage
                isOpen={showFindInPage}
                onClose={() => setShowFindInPage(false)}
                content=""
            />

            <QRCodeGenerator
                isOpen={showQRCode}
                onClose={() => setShowQRCode(false)}
                url={activeTab?.url || ''}
            />

            <GameHub
                isOpen={showGame}
                onClose={() => setShowGame(false)}
            />

            {showConfetti && <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}

export default App;
