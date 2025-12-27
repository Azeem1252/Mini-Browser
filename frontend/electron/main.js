const electron = require('electron');
const { app, BrowserWindow, ipcMain, session, shell } = electron;
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let cppBackend;

// Start C++ backend server
function startCppBackend() {
    console.log('!!! CRITICAL: STRICT DOWNLOAD GATEKEEPER v2.5 ACTIVE !!!');
    const backendPath = path.join(__dirname, '../../backend/browser_server.exe');
    cppBackend = spawn(backendPath);

    cppBackend.stdout.on('data', (data) => console.log(`[C++ Backend]: ${data}`));
    cppBackend.stderr.on('data', (data) => console.error(`[C++ Backend Error]: ${data}`));
    cppBackend.on('close', (code) => console.log(`C++ Backend exited with code ${code}`));
}

const activeDownloads = new Map();
let downloadIdCounter = 0;
const activeDownloadKeys = new Map();

// IPC Handlers
ipcMain.handle('open-download', async (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) return { success: false, error: 'File does not exist' };
        await shell.openPath(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('show-in-folder', async (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) return { success: false, error: 'File does not exist' };
        shell.showItemInFolder(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cancel-download', (event, downloadId) => {
    const item = activeDownloads.get(String(downloadId));
    if (item) {
        item.cancel();
        activeDownloads.delete(String(downloadId));
        return true;
    }
    return false;
});

ipcMain.handle('pause-download', (event, downloadId) => {
    const item = activeDownloads.get(String(downloadId));
    if (item) {
        item.pause();
        return true;
    }
    return false;
});

ipcMain.handle('resume-download', (event, downloadId) => {
    const item = activeDownloads.get(String(downloadId));
    if (item) {
        item.resume();
        return true;
    }
    return false;
});

// Setup download handling for a given session
function setupSessionDownloads(ses) {
    const partition = ses.getStoragePath() || 'memory';
    console.log(`[Gatekeeper] Attaching to session: ${partition}`);

    ses.on('will-download', (event, item, webContents) => {
        const filename = item.getFilename();
        const url = item.getURL();
        const now = Date.now();
        const downloadId = `${now}-${downloadIdCounter++}`;

        // 1. IMMEDIATE SYNCHRONOUS PAUSE
        item.pause();
        console.log(`[Gatekeeper] [${partition}] PAUSED: ${filename}. LOCKED.`);

        // Deduplication
        const dedupeKey = `${url}::${filename}`;
        for (const [key, data] of activeDownloadKeys.entries()) {
            if (key.endsWith(`::${filename}`) && (now - data.timestamp) < 3000) {
                console.log(`[Gatekeeper] Blocking duplicate: ${filename}`);
                item.cancel();
                return;
            }
        }

        activeDownloads.set(downloadId, item);
        activeDownloadKeys.set(dedupeKey, { id: downloadId, timestamp: now });

        // Save Path
        let downloadPath = path.join(app.getPath('downloads'), filename);
        let n = 1;
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        while (fs.existsSync(downloadPath)) {
            downloadPath = path.join(app.getPath('downloads'), `${base} (${n++})${ext}`);
        }
        item.setSavePath(downloadPath);

        // Notify UI
        if (mainWindow) {
            mainWindow.webContents.send('download-started', {
                id: downloadId,
                filename: path.basename(downloadPath),
                url: url,
                size: item.getTotalBytes(),
                status: 'pending'
            });
        }

        item.on('updated', (event, state) => {
            if (state === 'progressing' && mainWindow) {
                mainWindow.webContents.send('download-progress', {
                    id: downloadId,
                    progress: item.getTotalBytes() > 0 ? Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100) : 0,
                    received: item.getReceivedBytes(),
                    total: item.getTotalBytes()
                });
            }
        });

        item.once('done', (event, state) => {
            activeDownloads.delete(downloadId);
            setTimeout(() => activeDownloadKeys.delete(dedupeKey), 2000);
            if (state === 'completed' && mainWindow) {
                mainWindow.webContents.send('download-completed', { id: downloadId, filename: path.basename(downloadPath), path: downloadPath });
            } else if (mainWindow) {
                mainWindow.webContents.send('download-failed', { id: downloadId, filename, error: state });
            }
        });
    });
}

// Global session tracking
app.on('session-created', (ses) => {
    setupSessionDownloads(ses);
});

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#1a1a1a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            webSecurity: false
        }
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => mainWindow = null);
}

if (app) {
    app.whenReady().then(() => {
        // Also attach to the default session explicitly
        setupSessionDownloads(session.defaultSession);

        startCppBackend();
        createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            if (cppBackend) cppBackend.kill();
            app.quit();
        }
    });
}
