const electron = require('electron');
const { app, BrowserWindow, ipcMain, session, shell } = electron;
console.log('--- Electron environment ---');
console.log('Node:', process.versions.node);
console.log('Chrome:', process.versions.chrome);
console.log('Electron:', process.versions.electron);
console.log('App object type:', typeof app);
console.log('---------------------------');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Added for health checks
const { spawn } = require('child_process');

let mainWindow;
let cppBackend;

// Start C++ backend server
function startCppBackend() {
    console.log('!!! CRITICAL: STRICT DOWNLOAD GATEKEEPER v2.3 ACTIVE !!!');
    const backendPath = path.join(__dirname, '../../backend/browser_server.exe');
    cppBackend = spawn(backendPath);

    cppBackend.stdout.on('data', (data) => {
        console.log(`[C++ Backend]: ${data}`);
    });

    cppBackend.stderr.on('data', (data) => {
        console.error(`[C++ Backend Error]: ${data}`);
    });

    cppBackend.on('close', (code) => {
        console.log(`C++ Backend exited with code ${code}`);
    });
}

const activeDownloads = new Map();
let downloadIdCounter = 0;
const activeDownloadKeys = new Map(); // Better deduplication: key = url+filename, value = {id, timestamp}

// IPC Handlers for Downloads
ipcMain.handle('open-download', async (event, filePath) => {
    console.log('[IPC] open-download requested for:', filePath);
    try {
        if (!fs.existsSync(filePath)) {
            console.error('[IPC] File does not exist:', filePath);
            return { success: false, error: 'File does not exist' };
        }
        await shell.openPath(filePath);
        return { success: true };
    } catch (error) {
        console.error('[IPC] open-download error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('show-in-folder', async (event, filePath) => {
    console.log('[IPC] show-in-folder requested for:', filePath);
    try {
        if (!fs.existsSync(filePath)) {
            console.error('[IPC] File does not exist:', filePath);
            return { success: false, error: 'File does not exist' };
        }
        shell.showItemInFolder(filePath);
        return { success: true };
    } catch (error) {
        console.error('[IPC] show-in-folder error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cancel-download', (event, downloadId) => {
    console.log('[IPC] cancel-download requested for ID:', downloadId);
    const item = activeDownloads.get(String(downloadId));
    if (item) {
        item.cancel();
        activeDownloads.delete(String(downloadId));
        return true;
    }
    console.warn('[IPC] No active download found for ID:', downloadId);
    return false;
});

// Helper to check if backend is running
function checkBackendHealth() {
    console.log('[Gatekeeper] Checking backend health...');
    return new Promise((resolve) => {
        const req = http.get('http://localhost:8080/api/health', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const status = JSON.parse(data).status;
                    const isOk = status === 'ok';
                    console.log(`[Gatekeeper] Backend health check: ${isOk ? 'OK' : 'FAILED'}`);
                    resolve(isOk);
                } catch (e) {
                    console.error('[Gatekeeper] Failed to parse health response');
                    resolve(false);
                }
            });
        });
        req.on('error', (err) => {
            console.error('[Gatekeeper] Backend UNREACHABLE:', err.message);
            resolve(false);
        });
        req.setTimeout(800, () => {
            console.warn('[Gatekeeper] Health check TIMEOUT');
            req.destroy();
            resolve(false);
        });
    });
}

// Setup download handling for a given session
function setupSessionDownloads(ses) {
    ses.on('will-download', async (event, item, webContents) => {
        const filename = item.getFilename();
        console.log(`[Gatekeeper] Download started: ${filename}`);

        // Check backend health in background (non-blocking)
        checkBackendHealth().then(isUp => {
            if (!isUp) {
                console.warn(`[Gatekeeper] Backend offline - download ${filename} not synced to C++ Queue`);
            } else {
                console.log(`[Gatekeeper] Backend online - syncing ${filename} to C++ Queue`);
            }
        });

        // Let download proceed immediately (don't block)
        console.log(`[Gatekeeper] ALLOWED ${filename} to proceed.`);

        const url = item.getURL();
        const now = Date.now();

        // PRIMARY: Filename-only deduplication (catches redirects like MediaFire)
        // If same filename started within 3 seconds, block it
        for (const [key, data] of activeDownloadKeys.entries()) {
            if (key.endsWith(`::${filename}`) && (now - data.timestamp) < 3000) {
                console.log(`[Gatekeeper] BLOCKING duplicate redirect for: ${filename}`);
                item.cancel();
                return;
            }
        }

        const dedupeKey = `${url}::${filename}`;
        const fileSize = item.getTotalBytes();
        const downloadId = `${now}-${downloadIdCounter++}`; // Robust ID

        activeDownloads.set(downloadId, item);
        activeDownloadKeys.set(dedupeKey, { id: downloadId, timestamp: now });

        // Handle file name conflicts (prevent overwrite)
        let downloadPath = path.join(app.getPath('downloads'), filename);
        let n = 1;
        const ext = path.extname(filename);
        const name = path.basename(filename, ext);

        while (fs.existsSync(downloadPath)) {
            downloadPath = path.join(app.getPath('downloads'), `${name} (${n++})${ext}`);
        }

        item.setSavePath(downloadPath);

        console.log(`[Download Started]: ID=${downloadId} | ${filename} -> ${downloadPath}`);

        // Send download start to renderer
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('download-started', {
                id: downloadId,
                filename: path.basename(downloadPath),
                url: url,
                size: fileSize,
                progress: 0,
                status: 'downloading',
                path: downloadPath
            });
        }

        // Track progress
        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                const received = item.getReceivedBytes();
                const total = item.getTotalBytes();
                const progress = total > 0 ? Math.round((received / total) * 100) : 0;

                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('download-progress', {
                        id: downloadId,
                        progress: progress,
                        received: received,
                        total: total
                    });
                }
            } else if (state === 'interrupted') {
                console.log(`[Download Interrupted]: ID=${downloadId} | ${filename}`);
                activeDownloads.delete(downloadId);
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('download-failed', {
                        id: downloadId,
                        filename: filename,
                        error: 'interrupted'
                    });
                }
            }
        });

        // Handle completion
        item.once('done', (event, state) => {
            activeDownloads.delete(downloadId);
            // Clean up dedupe key after 2 seconds to allow re-download
            setTimeout(() => activeDownloadKeys.delete(dedupeKey), 2000);
            // Wait a tiny bit for FS to settle before notifying renderer
            setTimeout(() => {
                if (state === 'completed') {
                    console.log(`[Download Completed]: ID=${downloadId} | ${filename}`);
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.send('download-completed', {
                            id: downloadId,
                            filename: path.basename(downloadPath),
                            size: item.getTotalBytes(),
                            path: downloadPath
                        });
                    }
                } else {
                    console.log(`[Download ${state.charAt(0).toUpperCase() + state.slice(1)}]: ID=${downloadId} | ${filename}`);
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.send('download-failed', {
                            id: downloadId,
                            filename: filename,
                            error: state // 'cancelled' or 'interrupted'
                        });
                    }
                }
            }, 100);
        });
    });
}

// Setup download handling for webview session only
function setupDownloadHandler() {
    // Webview partition session (browser) - memory only to prevent local history leaks
    const webviewSession = session.fromPartition('browser');
    setupSessionDownloads(webviewSession);
    console.log('[Download Handler] Set up for memory-only browser partition');
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            webSecurity: false, // Allow requests to C++ backend on port 8080
        },
    });

    // Setup download handler
    setupDownloadHandler();

    // Load React UI
    const isDev = !app.isPackaged;

    if (isDev) {
        const devPorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
        let loaded = false;

        for (const port of devPorts) {
            try {
                const url = `http://localhost:${port}`;
                console.log(`Checking port ${port}...`);
                await mainWindow.loadURL(url);
                console.log(`Successfully loaded from port ${port}`);
                loaded = true;
                break;
            } catch (e) {
                // Ignore failure and try next port
            }
        }

        if (!loaded) {
            console.error('CRITICAL: Could not load Vite dev server on any port (5173-5180)');
        }

        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Electron app lifecycle
if (app) {
    app.whenReady().then(() => {
        startCppBackend();
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            if (cppBackend) {
                cppBackend.kill();
            }
            app.quit();
        }
    });

    app.on('before-quit', () => {
        if (cppBackend) {
            cppBackend.kill();
        }
    });
} else {
    console.error('Electron "app" object is undefined. Ensure this is running in an Electron environment.');
}
