import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

interface WebViewBrowserProps {
    tabId: number;
    url: string;
    isActive: boolean;
    zoomFactor: number;
    onNavigate: (url: string) => void;
    onTitleUpdate: (title: string) => void;
    onLoadingChange: (isLoading: boolean) => void;
}

export const WebViewBrowser = forwardRef<any, WebViewBrowserProps>(({
    tabId,
    url,
    isActive,
    zoomFactor,
    onNavigate,
    onTitleUpdate,
    onLoadingChange,
}, ref) => {
    const webviewRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const lastNavigatedUrl = useRef<string>('');

    // Expose webview methods to parent
    useImperativeHandle(ref, () => webviewRef.current);

    // Handle webview ready state
    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const handleDomReady = () => {
            setIsReady(true);
        };

        webview.addEventListener('dom-ready', handleDomReady);

        return () => {
            webview.removeEventListener('dom-ready', handleDomReady);
        };
    }, []);

    // Apply zoom factor only when ready
    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview || !isReady) return;

        try {
            if (typeof webview.setZoomFactor === 'function') {
                webview.setZoomFactor(zoomFactor);
            }
        } catch (err) {
            console.warn('Failed to set zoom factor:', err);
        }
    }, [zoomFactor, isReady]);

    // Navigation and title events
    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const handleDidNavigate = (e: any) => {
            lastNavigatedUrl.current = e.url; // Update internal tracker
            onNavigate(e.url);
        };

        const handleDidNavigateInPage = (e: any) => {
            lastNavigatedUrl.current = e.url; // Update internal tracker
            onNavigate(e.url);
        };

        const handlePageTitleUpdated = (e: any) => {
            onTitleUpdate(e.title);
        };

        const handleDidStartLoading = () => {
            onLoadingChange(true);
        };

        const handleDidStopLoading = () => {
            onLoadingChange(false);
        };

        webview.addEventListener('did-navigate', handleDidNavigate);
        webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
        webview.addEventListener('page-title-updated', handlePageTitleUpdated);
        webview.addEventListener('did-start-loading', handleDidStartLoading);
        webview.addEventListener('did-stop-loading', handleDidStopLoading);

        return () => {
            webview.removeEventListener('did-navigate', handleDidNavigate);
            webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
            webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
            webview.removeEventListener('did-start-loading', handleDidStartLoading);
            webview.removeEventListener('did-stop-loading', handleDidStopLoading);
        };
    }, [onNavigate, onTitleUpdate, onLoadingChange]);

    // Update webview URL when prop changes - use loadURL for proper navigation
    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview || !url || url === 'about:blank') return;

        // Skip if we already navigated to this exact URL
        if (lastNavigatedUrl.current === url) return;

        console.log(`[WebViewBrowser] Navigating to: ${url}`);
        lastNavigatedUrl.current = url;

        try {
            // Use loadURL if available (proper Electron webview method)
            if (typeof webview.loadURL === 'function') {
                webview.loadURL(url);
            } else {
                // Fallback to src property
                webview.src = url;
            }
        } catch (err) {
            console.warn('Failed to navigate webview:', err);
        }
    }, [url]);

    return (
        <webview
            ref={webviewRef}
            id={`webview-${tabId}`}
            src={url === 'about:blank' ? 'about:blank' : url}
            partition="browser"
            allowpopups={true}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                visibility: isActive ? 'visible' : 'hidden',
                pointerEvents: isActive ? 'auto' : 'none',
                background: 'transparent',
            }}
        />
    );
});

WebViewBrowser.displayName = 'WebViewBrowser';
