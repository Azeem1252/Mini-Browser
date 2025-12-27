const API_BASE_URL = 'http://localhost:8080/api';

export interface NavigationRequest {
    url: string;
    tabId?: number;
}

export interface NavigationResponse {
    success: boolean;
    url: string;
    title?: string;
    content?: string;
    error?: string;
}

export interface HistoryEntry {
    url: string;
    title: string;
    timestamp: number;
}

class BrowserAPIClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async navigate(url: string, tabId?: number): Promise<NavigationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/navigate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, tabId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Navigation error:', error);
            return {
                success: false,
                url,
                error: error instanceof Error ? error.message : 'Navigation failed',
            };
        }
    }

    async goBack(tabId?: number): Promise<NavigationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/back`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tabId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Go back error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Go back failed',
            };
        }
    }

    async goForward(tabId?: number): Promise<NavigationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tabId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Go forward error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Go forward failed',
            };
        }
    }

    async refresh(tabId?: number): Promise<NavigationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tabId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Refresh error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Refresh failed',
            };
        }
    }

    async getHistory(tabId?: number): Promise<HistoryEntry[]> {
        try {
            const response = await fetch(`${this.baseUrl}/history${tabId ? `?tabId=${tabId}` : ''}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get history error:', error);
            return [];
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

export const apiClient = new BrowserAPIClient();
