import { useCallback } from 'react';

export const useElectron = () => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

    const createBrowserView = useCallback(async (tabId: number, url: string) => {
        if (!isElectron) return { success: false, error: 'Not running in Electron' };
        return await window.electronAPI!.createBrowserView(tabId, url, {
            x: 0,
            y: 120,
            width: window.innerWidth,
            height: window.innerHeight - 120,
        });
    }, [isElectron]);

    const navigateBrowserView = useCallback(async (tabId: number, url: string) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.navigateBrowserView(tabId, url);
    }, [isElectron]);

    const removeBrowserView = useCallback(async (tabId: number) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.removeBrowserView(tabId);
    }, [isElectron]);

    const showBrowserView = useCallback(async (tabId: number) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.showBrowserView(tabId);
    }, [isElectron]);

    const browserViewGoBack = useCallback(async (tabId: number) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.browserViewGoBack(tabId);
    }, [isElectron]);

    const browserViewGoForward = useCallback(async (tabId: number) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.browserViewGoForward(tabId);
    }, [isElectron]);

    const browserViewReload = useCallback(async (tabId: number) => {
        if (!isElectron) return { success: false };
        return await window.electronAPI!.browserViewReload(tabId);
    }, [isElectron]);

    const browserViewCanGoBack = useCallback(async (tabId: number) => {
        if (!isElectron) return { canGoBack: false };
        return await window.electronAPI!.browserViewCanGoBack(tabId);
    }, [isElectron]);

    const browserViewCanGoForward = useCallback(async (tabId: number) => {
        if (!isElectron) return { canGoForward: false };
        return await window.electronAPI!.browserViewCanGoForward(tabId);
    }, [isElectron]);

    const onBrowserViewNavigated = useCallback((callback: (data: { tabId: number; url: string }) => void) => {
        if (!isElectron) return;
        window.electronAPI!.onBrowserViewNavigated(callback);
    }, [isElectron]);

    const onBrowserViewTitleUpdated = useCallback((callback: (data: { tabId: number; title: string }) => void) => {
        if (!isElectron) return;
        window.electronAPI!.onBrowserViewTitleUpdated(callback);
    }, [isElectron]);

    const onBrowserViewLoading = useCallback((callback: (data: { tabId: number; isLoading: boolean }) => void) => {
        if (!isElectron) return;
        window.electronAPI!.onBrowserViewLoading(callback);
    }, [isElectron]);

    return {
        isElectron,
        createBrowserView,
        navigateBrowserView,
        removeBrowserView,
        showBrowserView,
        browserViewGoBack,
        browserViewGoForward,
        browserViewReload,
        browserViewCanGoBack,
        browserViewCanGoForward,
        onBrowserViewNavigated,
        onBrowserViewTitleUpdated,
        onBrowserViewLoading,
    };
};
