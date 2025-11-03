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
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
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

  console.log('Starting frontend server...');
  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../../frontend'),
    shell: true,
    stdio: 'inherit',
  });

  frontendProcess.on('exit', (code) => {
    console.log(`Frontend exited with code ${code}`);
    frontendProcess = null;
  });
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

