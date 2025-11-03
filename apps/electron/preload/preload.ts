// Preload script - exposes secure IPC APIs to renderer
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process
// to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Printer APIs
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printReceipt: (data: any) => ipcRenderer.invoke('printer:print', data),

  // App status
  getAppStatus: () => ipcRenderer.invoke('app:status'),

  // File export (for reports)
  exportFile: (type: string, payload: any) =>
    ipcRenderer.invoke('file:export', type, payload),

  // Online status
  onOnlineStatusChange: (callback: (isOnline: boolean) => void) => {
    ipcRenderer.on('app:online-status', (event, isOnline) => callback(isOnline));
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      listPrinters: () => Promise<any[]>;
      printReceipt: (data: any) => Promise<{ success: boolean; message?: string }>;
      getAppStatus: () => Promise<any>;
      exportFile: (type: string, payload: any) => Promise<any>;
      onOnlineStatusChange: (callback: (isOnline: boolean) => void) => void;
    };
  }
}

