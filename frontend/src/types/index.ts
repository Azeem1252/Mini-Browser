/**
 * Core Types and Interfaces for the Web Browser Application
 * Provides type safety and better developer experience
 */

// ============ Tab Types ============

export interface TabInfo {
    id: number;
    title: string;
    url: string;
    favicon?: string;
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    error?: string;
    content?: string;
    isPinned?: boolean;
    isMuted?: boolean;
    groupId?: string;
    lastAccessed?: number;
}

export interface TabGroup {
    id: string;
    name: string;
    color: TabGroupColor;
    collapsed: boolean;
    tabIds: number[];
}

export type TabGroupColor = 
    | 'grey' 
    | 'blue' 
    | 'red' 
    | 'yellow' 
    | 'green' 
    | 'pink' 
    | 'purple' 
    | 'cyan' 
    | 'orange';

// ============ Navigation Types ============

export interface NavigationRequest {
    url: string;
    tabId?: number;
    force?: boolean;
}

export interface NavigationResponse {
    success: boolean;
    url: string;
    title?: string;
    content?: string;
    error?: string;
    statusCode?: number;
    headers?: Record<string, string>;
    loadTime?: number;
}

export interface NavigationState {
    canGoBack: boolean;
    canGoForward: boolean;
    backStack: string[];
    forwardStack: string[];
}

// ============ History Types ============

export interface HistoryEntry {
    id: string;
    url: string;
    title: string;
    timestamp: number;
    visitCount: number;
    favicon?: string;
}

export interface HistorySearchResult {
    entries: HistoryEntry[];
    totalCount: number;
    query: string;
}

// ============ Bookmark Types ============

export interface Bookmark {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    folderId?: string;
    createdAt: number;
    tags?: string[];
}

export interface BookmarkFolder {
    id: string;
    name: string;
    parentId?: string;
    createdAt: number;
    children: (Bookmark | BookmarkFolder)[];
}

// ============ Theme Types ============

export type ThemeName = 
    | 'dark' 
    | 'light' 
    | 'ocean' 
    | 'forest' 
    | 'sunset' 
    | 'cyberpunk' 
    | 'dracula'
    | 'nord'
    | 'solarized'
    | 'auto';

export interface ThemeColors {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgElevated: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accentPrimary: string;
    accentSecondary: string;
    borderColor: string;
    success: string;
    warning: string;
    error: string;
}

// ============ Settings Types ============

export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'ecosia' | 'brave' | 'custom';

export interface BrowserSettings {
    // General
    searchEngine: SearchEngine;
    customSearchUrl?: string;
    homepage: string;
    newTabPage: 'blank' | 'home' | 'speed-dial';
    
    // Appearance
    theme: ThemeName;
    showBookmarksBar: boolean;
    compactMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    animationsEnabled: boolean;
    soundEffects: boolean;
    
    // Privacy
    clearHistoryOnExit: boolean;
    blockPopups: boolean;
    doNotTrack: boolean;
    cookiePolicy: 'allow-all' | 'block-third-party' | 'block-all';
    
    // Performance
    preloadPages: boolean;
    hardwareAcceleration: boolean;
    
    // Downloads
    defaultDownloadPath?: string;
    askBeforeDownload: boolean;
}

export const DEFAULT_SETTINGS: BrowserSettings = {
    searchEngine: 'google',
    homepage: 'about:blank',
    newTabPage: 'speed-dial',
    theme: 'dark',
    showBookmarksBar: false,
    compactMode: false,
    fontSize: 'medium',
    animationsEnabled: true,
    soundEffects: true,
    clearHistoryOnExit: false,
    blockPopups: true,
    doNotTrack: true,
    cookiePolicy: 'block-third-party',
    preloadPages: true,
    hardwareAcceleration: true,
    askBeforeDownload: true,
};

// ============ Download Types ============

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface Download {
    id: string;
    url: string;
    filename: string;
    path?: string;
    size: number;
    downloadedBytes: number;
    status: DownloadStatus;
    startedAt: number;
    completedAt?: number;
    error?: string;
    speed?: number;
}

// ============ Session Types ============

export interface BrowserSession {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    windows: SessionWindow[];
    isDefault?: boolean;
}

export interface SessionWindow {
    id: number;
    tabs: SessionTab[];
    activeTabIndex: number;
    bounds?: WindowBounds;
}

export interface SessionTab {
    url: string;
    title: string;
    isPinned: boolean;
    groupId?: string;
}

export interface WindowBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ============ Quick Link Types ============

export interface QuickLink {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    color?: string;
    isPinned: boolean;
    visitCount: number;
    lastVisited: number;
}

// ============ Reading Mode Types ============

export interface ReadingModeSettings {
    fontSize: number;
    lineHeight: number;
    fontFamily: 'sans-serif' | 'serif' | 'monospace';
    theme: 'light' | 'sepia' | 'dark';
    maxWidth: number;
    textAlign: 'left' | 'justify';
}

export const DEFAULT_READING_SETTINGS: ReadingModeSettings = {
    fontSize: 18,
    lineHeight: 1.6,
    fontFamily: 'serif',
    theme: 'sepia',
    maxWidth: 720,
    textAlign: 'left',
};

// ============ Keyboard Shortcut Types ============

export interface KeyboardShortcut {
    id: string;
    key: string;
    modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
    action: string;
    description: string;
    enabled: boolean;
}

// ============ API Response Types ============

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// ============ Event Types ============

export type BrowserEventType = 
    | 'navigate'
    | 'tab-create'
    | 'tab-close'
    | 'tab-switch'
    | 'bookmark-add'
    | 'bookmark-remove'
    | 'download-start'
    | 'download-complete'
    | 'theme-change'
    | 'settings-update';

export interface BrowserEvent<T = unknown> {
    type: BrowserEventType;
    payload: T;
    timestamp: number;
}

// ============ Utility Types ============

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
