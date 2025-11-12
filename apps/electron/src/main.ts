import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { listPrinters, printReceipt } from './printer';

// Keep references to child processes
let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV !== 'production';
const API_URL = isDev ? 'http://localhost:3001' : 'http://localhost:3001';
const FRONTEND_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Prevent navigation to external URLs (but allow internal navigation)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== FRONTEND_URL && !parsedUrl.origin.includes('localhost')) {
      event.preventDefault();
    }
  });

  // Prevent drag and drop file events
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      // Remove any existing drag event listeners that might cause issues
      window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    `).catch(console.error);
  });

  // Load frontend
  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  return mainWindow;
}

function startBackend() {
  if (backendProcess) {
    console.log('Backend already running');
    return;
  }

  // In dev mode, backend is already started by npm run dev
  // Only start it here if we're in production or if explicitly needed
  if (isDev) {
    console.log('Backend should be started by npm run dev in development mode');
    return;
  }

  console.log('Starting backend server...');
  const backendPath = path.join(__dirname, '../../backend/dist/main.js');
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, '../../backend'),
    stdio: 'inherit',
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
    backendProcess = null;
  });
}

function startFrontend() {
  if (!isDev) {
    return; // Frontend is already built in production
  }

  if (frontendProcess) {
    console.log('Frontend already running');
    return;
  }

  // In dev mode, frontend is already started by npm run dev
  // Only start it here if explicitly needed
  console.log('Frontend should be started by npm run dev in development mode');
}

app.whenReady().then(() => {
  // Start backend and frontend if in dev mode
  if (isDev) {
    startBackend();
    startFrontend();
    
    // Wait a bit for servers to start
    setTimeout(() => {
      createWindow();
    }, 5000);
  } else {
    startBackend();
    setTimeout(() => {
      createWindow();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup processes
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (frontendProcess) {
    frontendProcess.kill();
    frontendProcess = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
});

// IPC handlers for printer
ipcMain.handle('printer:list', async () => {
  try {
    return await listPrinters();
  } catch (error: any) {
    console.error('List printers error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('printer:print', async (event, data) => {
  try {
    return await printReceipt(data);
  } catch (error: any) {
    console.error('Print error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('app:status', async () => {
  return {
    online: true, // Check network status appropriately
    backend: backendProcess !== null,
  };
});

