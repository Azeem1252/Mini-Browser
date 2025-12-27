// Electron API type definitions
declare global {
    interface Window {
        electronAPI?: {
            // Browser View Management
            createBrowserView: (tabId: number, url: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => Promise<{ success: boolean; tabId?: number; error?: string }>;
            navigateBrowserView: (tabId: number, url: string) => Promise<{ success: boolean; error?: string }>;
            removeBrowserView: (tabId: number) => Promise<{ success: boolean; error?: string }>;
            showBrowserView: (tabId: number) => Promise<{ success: boolean; error?: string }>;
            browserViewGoBack: (tabId: number) => Promise<{ success: boolean; error?: string }>;
            browserViewGoForward: (tabId: number) => Promise<{ success: boolean; error?: string }>;
            browserViewReload: (tabId: number) => Promise<{ success: boolean; error?: string }>;
            browserViewCanGoBack: (tabId: number) => Promise<{ canGoBack: boolean }>;
            browserViewCanGoForward: (tabId: number) => Promise<{ canGoForward: boolean }>;

            // Event listeners
            onBrowserViewNavigated: (callback: (data: { tabId: number; url: string }) => void) => void;
            onBrowserViewTitleUpdated: (callback: (data: { tabId: number; title: string }) => void) => void;
            onBrowserViewLoading: (callback: (data: { tabId: number; isLoading: boolean }) => void) => void;

            // Platform info
            platform: string;
            isElectron: boolean;
        };
    }
}

export { };
