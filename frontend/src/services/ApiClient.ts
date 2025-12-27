
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
    getDownloads: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE}/api/downloads`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch downloads:', error);
            return [];
        }
    },

    addDownload: async (id: string, filename: string, url: string): Promise<boolean> => {
        try {
            const params = new URLSearchParams({ id, filename, url });
            const response = await fetch(`${API_BASE}/api/downloads?${params.toString()}`, {
                method: 'POST'
            });
            if (!response.ok) return false;
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Failed to sync download:', error);
            return false;
        }
    },

    // Undo & Session Management
    undo: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/undo`, { method: 'POST' });
            const data = await response.json();
            return !!data.success;
        } catch (error) {
            console.error('Undo failed:', error);
            return false;
        }
    },

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
    }
};
