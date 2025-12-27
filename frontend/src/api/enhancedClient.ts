/**
 * Enhanced API Client with retry logic, request cancellation,
 * and improved error handling
 */

const API_BASE_URL = 'http://localhost:3001';

// Request status tracking
interface RequestTracker {
    controller: AbortController;
    timestamp: number;
}

const activeRequests = new Map<string, RequestTracker>();

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
    loadTime?: number;
}

export interface HistoryEntry {
    url: string;
    title: string;
    timestamp: number;
}

export interface BookmarkEntry {
    id: string;
    title: string;
    url: string;
    createdAt: number;
}

interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
};

// Error types for better handling
export class ApiError extends Error {
    statusCode?: number;
    isRetryable: boolean;
    
    constructor(
        message: string,
        statusCode?: number,
        isRetryable: boolean = true
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
    }
}

export class NetworkError extends ApiError {
    constructor(message: string = 'Network request failed') {
        super(message, undefined, true);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends ApiError {
    constructor(message: string = 'Request timed out') {
        super(message, undefined, true);
        this.name = 'TimeoutError';
    }
}

export class AbortedError extends ApiError {
    constructor(message: string = 'Request was cancelled') {
        super(message, undefined, false);
        this.name = 'AbortedError';
    }
}

// Utility functions
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        config.maxDelay
    );
    return delay;
}

function generateRequestId(endpoint: string, tabId?: number): string {
    return `${endpoint}-${tabId || 'global'}-${Date.now()}`;
}

class EnhancedBrowserAPIClient {
    private baseUrl: string;
    private retryConfig: RetryConfig;
    private timeout: number;

    constructor(
        baseUrl: string = API_BASE_URL,
        retryConfig: Partial<RetryConfig> = {},
        timeout: number = 30000
    ) {
        this.baseUrl = baseUrl;
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        this.timeout = timeout;
    }

    /**
     * Cancel all pending requests for a specific tab
     */
    cancelTabRequests(tabId: number): void {
        const prefix = `navigate-${tabId}`;
        activeRequests.forEach((tracker, key) => {
            if (key.includes(prefix)) {
                tracker.controller.abort();
                activeRequests.delete(key);
            }
        });
    }

    /**
     * Cancel all pending requests
     */
    cancelAllRequests(): void {
        activeRequests.forEach((tracker) => {
            tracker.controller.abort();
        });
        activeRequests.clear();
    }

    /**
     * Make a request with retry logic and cancellation support
     */
    private async fetchWithRetry<T>(
        endpoint: string,
        options: RequestInit = {},
        requestId?: string
    ): Promise<T> {
        const id = requestId || generateRequestId(endpoint);
        
        // Cancel any existing request with the same ID
        const existing = activeRequests.get(id);
        if (existing) {
            existing.controller.abort();
        }

        const controller = new AbortController();
        activeRequests.set(id, { controller, timestamp: Date.now() });

        let lastError: Error = new NetworkError();

        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                // Create timeout signal
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    // Don't retry client errors (4xx)
                    if (response.status >= 400 && response.status < 500) {
                        throw new ApiError(
                            `Request failed: ${response.statusText}`,
                            response.status,
                            false
                        );
                    }
                    throw new ApiError(
                        `Request failed: ${response.statusText}`,
                        response.status,
                        true
                    );
                }

                const data = await response.json();
                activeRequests.delete(id);
                return data;

            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        activeRequests.delete(id);
                        throw new AbortedError();
                    }

                    lastError = error;

                    // Check if error is retryable
                    const isRetryable = error instanceof ApiError ? error.isRetryable : true;

                    if (isRetryable && attempt < this.retryConfig.maxRetries) {
                        const delay = calculateBackoff(attempt, this.retryConfig);
                        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
                        await sleep(delay);
                        continue;
                    }
                }

                activeRequests.delete(id);
                throw lastError;
            }
        }

        activeRequests.delete(id);
        throw lastError;
    }

    /**
     * Navigate to a URL
     */
    async navigate(url: string, tabId?: number): Promise<NavigationResponse> {
        const startTime = Date.now();
        
        try {
            // Cancel any pending navigation for this tab
            if (tabId) {
                this.cancelTabRequests(tabId);
            }

            const response = await this.fetchWithRetry<NavigationResponse>(
                '/navigate',
                {
                    method: 'POST',
                    body: JSON.stringify({ url, tabId }),
                },
                `navigate-${tabId}`
            );

            return {
                ...response,
                loadTime: Date.now() - startTime,
            };
        } catch (error) {
            if (error instanceof AbortedError) {
                return {
                    success: false,
                    url,
                    error: 'Navigation cancelled',
                };
            }

            console.error('Navigation error:', error);
            return {
                success: false,
                url,
                error: error instanceof Error ? error.message : 'Navigation failed',
                loadTime: Date.now() - startTime,
            };
        }
    }

    /**
     * Go back in history
     */
    async goBack(tabId?: number): Promise<NavigationResponse> {
        try {
            return await this.fetchWithRetry<NavigationResponse>(
                '/back',
                {
                    method: 'POST',
                    body: JSON.stringify({ tabId }),
                }
            );
        } catch (error) {
            console.error('Go back error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Go back failed',
            };
        }
    }

    /**
     * Go forward in history
     */
    async goForward(tabId?: number): Promise<NavigationResponse> {
        try {
            return await this.fetchWithRetry<NavigationResponse>(
                '/forward',
                {
                    method: 'POST',
                    body: JSON.stringify({ tabId }),
                }
            );
        } catch (error) {
            console.error('Go forward error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Go forward failed',
            };
        }
    }

    /**
     * Refresh the current page
     */
    async refresh(tabId?: number): Promise<NavigationResponse> {
        try {
            return await this.fetchWithRetry<NavigationResponse>(
                '/refresh',
                {
                    method: 'POST',
                    body: JSON.stringify({ tabId }),
                }
            );
        } catch (error) {
            console.error('Refresh error:', error);
            return {
                success: false,
                url: '',
                error: error instanceof Error ? error.message : 'Refresh failed',
            };
        }
    }

    /**
     * Get browsing history
     */
    async getHistory(tabId?: number, limit: number = 100): Promise<HistoryEntry[]> {
        try {
            const query = new URLSearchParams();
            if (tabId) query.set('tabId', String(tabId));
            query.set('limit', String(limit));

            return await this.fetchWithRetry<HistoryEntry[]>(
                `/history?${query.toString()}`
            );
        } catch (error) {
            console.error('Get history error:', error);
            return [];
        }
    }

    /**
     * Clear browsing history
     */
    async clearHistory(): Promise<boolean> {
        try {
            const response = await this.fetchWithRetry<{ success: boolean }>(
                '/history',
                { method: 'DELETE' }
            );
            return response.success;
        } catch (error) {
            console.error('Clear history error:', error);
            return false;
        }
    }

    /**
     * Get bookmarks
     */
    async getBookmarks(): Promise<BookmarkEntry[]> {
        try {
            return await this.fetchWithRetry<BookmarkEntry[]>('/bookmarks');
        } catch (error) {
            console.error('Get bookmarks error:', error);
            return [];
        }
    }

    /**
     * Add a bookmark
     */
    async addBookmark(title: string, url: string): Promise<BookmarkEntry | null> {
        try {
            return await this.fetchWithRetry<BookmarkEntry>(
                '/bookmarks',
                {
                    method: 'POST',
                    body: JSON.stringify({ title, url }),
                }
            );
        } catch (error) {
            console.error('Add bookmark error:', error);
            return null;
        }
    }

    /**
     * Delete a bookmark
     */
    async deleteBookmark(id: string): Promise<boolean> {
        try {
            const response = await this.fetchWithRetry<{ success: boolean }>(
                `/bookmarks/${id}`,
                { method: 'DELETE' }
            );
            return response.success;
        } catch (error) {
            console.error('Delete bookmark error:', error);
            return false;
        }
    }

    /**
     * Check API health
     */
    async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
        const startTime = Date.now();
        try {
            await this.fetchWithRetry<{ status: string }>(
                '/health',
                {},
                'health-check'
            );
            return {
                healthy: true,
                latency: Date.now() - startTime,
            };
        } catch (error) {
            return {
                healthy: false,
                latency: Date.now() - startTime,
            };
        }
    }

    /**
     * Get API stats
     */
    getActiveRequestCount(): number {
        return activeRequests.size;
    }

    /**
     * Check if there are active requests for a tab
     */
    hasActiveRequests(tabId: number): boolean {
        const prefix = `navigate-${tabId}`;
        return Array.from(activeRequests.keys()).some(key => key.includes(prefix));
    }
}

// Export singleton instance
export const apiClient = new EnhancedBrowserAPIClient();

// Export class for custom instances
export { EnhancedBrowserAPIClient };

// Export utility to create configured clients
export function createApiClient(
    baseUrl?: string,
    retryConfig?: Partial<RetryConfig>,
    timeout?: number
): EnhancedBrowserAPIClient {
    return new EnhancedBrowserAPIClient(baseUrl, retryConfig, timeout);
}
