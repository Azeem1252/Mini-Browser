const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Browser View Management
    createBrowserView: (tabId, url, bounds) =>
        ipcRenderer.invoke('create-browser-view', { tabId, url, bounds }),

    navigateBrowserView: (tabId, url) =>
        ipcRenderer.invoke('navigate-browser-view', { tabId, url }),

    removeBrowserView: (tabId) =>
        ipcRenderer.invoke('remove-browser-view', { tabId }),

    showBrowserView: (tabId) =>
        ipcRenderer.invoke('show-browser-view', { tabId }),

    browserViewGoBack: (tabId) =>
        ipcRenderer.invoke('browser-view-go-back', { tabId }),

    browserViewGoForward: (tabId) =>
        ipcRenderer.invoke('browser-view-go-forward', { tabId }),

    browserViewReload: (tabId) =>
        ipcRenderer.invoke('browser-view-reload', { tabId }),

    browserViewCanGoBack: (tabId) =>
        ipcRenderer.invoke('browser-view-can-go-back', { tabId }),

    browserViewCanGoForward: (tabId) =>
        ipcRenderer.invoke('browser-view-can-go-forward', { tabId }),

    // Event listeners
    onBrowserViewNavigated: (callback) => {
        ipcRenderer.on('browser-view-navigated', (event, data) => callback(data));
    },

    onBrowserViewTitleUpdated: (callback) => {
        ipcRenderer.on('browser-view-title-updated', (event, data) => callback(data));
    },

    onBrowserViewLoading: (callback) => {
        ipcRenderer.on('browser-view-loading', (event, data) => callback(data));
    },

    // Download event listeners
    onDownloadStarted: (callback) => {
        ipcRenderer.on('download-started', (event, data) => callback(data));
    },

    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, data) => callback(data));
    },

    onDownloadCompleted: (callback) => {
        ipcRenderer.on('download-completed', (event, data) => callback(data));
    },

    onDownloadFailed: (callback) => {
        ipcRenderer.on('download-failed', (event, data) => callback(data));
    },

    // File system actions
    openDownload: (filePath) => ipcRenderer.invoke('open-download', filePath),
    showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
    cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
    pauseDownload: (id) => ipcRenderer.invoke('pause-download', id),
    resumeDownload: (id) => ipcRenderer.invoke('resume-download', id),

    // Platform info
    platform: process.platform,
    isElectron: true,
});
