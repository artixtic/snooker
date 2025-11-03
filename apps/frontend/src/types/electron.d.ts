// Type definitions for Electron IPC APIs
declare global {
  interface Window {
    electronAPI?: {
      listPrinters: () => Promise<any[]>;
      printReceipt: (data: { lines: string[] }) => Promise<{ success: boolean; message?: string }>;
      getAppStatus: () => Promise<any>;
      exportFile: (type: string, payload: any) => Promise<any>;
      onOnlineStatusChange: (callback: (isOnline: boolean) => void) => void;
    };
  }
}

export {};

