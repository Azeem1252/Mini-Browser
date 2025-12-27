
const API_BASE = 'http://localhost:8080';

export interface BackendBookmark {
    title: string;
    url: string;
}

export const ApiClient = {
    // Basic verification
    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.error('Backend health check failed:', error);
            return false;
        }
    },

    // Bookmarks
    getBookmarks: async (): Promise<BackendBookmark[]> => {
        try {
            const response = await fetch(`${API_BASE}/api/bookmarks`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
            return [];
        }
    },

    addBookmark: async (title: string, url: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/bookmarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, url })
            });
            if (!response.ok) return false;
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to add bookmark:', error);
            return false;
        }
    },

    deleteBookmark: async (title: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/bookmarks?title=${encodeURIComponent(title)}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to delete bookmark:', error);
            return false;
        }
    },

    // History
    getHistory: async (): Promise<string[]> => {
        try {
            const response = await fetch(`${API_BASE}/api/history`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
    },

    clearHistory: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/history/clear`, { method: 'POST' });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    },

    // Navigation
    navigate: async (url: string, tabId?: number): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/navigate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, tabId })
            });
            return await response.json();
        } catch (error) {
            console.error('Navigation API failed:', error);
            return null;
        }
    },

    goBack: async (tabId?: number): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/back`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabId })
            });
            return await response.json();
        } catch (error) {
            console.error('Back navigation failed:', error);
            return null;
        }
    },

    goForward: async (tabId?: number): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/forward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabId })
            });
            return await response.json();
        } catch (error) {
            console.error('Forward navigation failed:', error);
            return null;
        }
    },

    getTabStatus: async (tabId: number): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/tabs/status?tabId=${tabId}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get tab status:', error);
            return null;
        }
    },

    // Downloads
    getDownloads: async (): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get downloads:', error);
            return { history: [], pending_count: 0, priority_count: 0 };
        }
    },

    addDownload: async (id: string, filename: string, url: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, filename, url })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to sync download:', error);
            // Default to queue if backend is unreachable (STRICT MODE)
            return { action: 'queue' };
        }
    },

    completeDownload: async (id: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to complete download:', error);
            return { nextId: null };
        }
    },

    prioritizeDownload: async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads/prioritize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to prioritize download:', error);
            return false;
        }
    },

    clearDownloads: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads/clear`, {
                method: 'POST'
            });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to clear downloads:', error);
            return false;
        }
    },

    // Tabs
    createTab: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/tabs/new`, { method: 'POST' });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to create tab on backend:', error);
            return false;
        }
    },

    closeTab: async (tabId: number): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/tabs/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabId })
            });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to close tab on backend:', error);
            return false;
        }
    },

    // Undo
    undo: async (): Promise<any[] | null> => {
        try {
            const response = await fetch(`${API_BASE}/api/undo`, { method: 'POST' });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Undo failed:', error);
            return null;
        }
    }
};
