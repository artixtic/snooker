// Type definitions for escpos module
declare module 'escpos' {
  export class Printer {
    constructor(device: any, options?: any);
    font(font: string): Printer;
    align(alignment: string): Printer;
    size(width: number, height: number): Printer;
    text(text: string): Printer;
    cut(): Printer;
    close(callback?: () => void): void;
  }
  
  export const USB: {
    findPrinter(callback: (err: any, devices: any[]) => void): void;
  };
}

declare module 'escpos-usb' {
  const USB: any;
  export default USB;
}

