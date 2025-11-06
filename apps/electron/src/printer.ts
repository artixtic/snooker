// ESC/POS printer support
import { Printer } from 'escpos';
// @ts-ignore - Dynamic assignment to escpos module
const escpos = require('escpos');

// Try to load escpos-usb module (optional - may not be available)
let escposUSB: any = null;
try {
  // @ts-ignore - escpos-usb module
  escposUSB = require('escpos-usb');
  if (escposUSB) {
    escpos.USB = escposUSB;
  }
} catch (error) {
  console.warn('escpos-usb module not available, USB printing will be disabled:', error);
}

export async function listPrinters(): Promise<any[]> {
  try {
    // Check if USB support is available
    if (!escposUSB || !escpos.USB) {
      console.warn('USB printer support not available');
      return [];
    }

    // List USB printers
    const devices = await new Promise<any[]>((resolve, reject) => {
      if (!escpos.USB.findPrinter) {
        resolve([]);
        return;
      }

      escpos.USB.findPrinter((err: any, devices: any[]) => {
        if (err) {
          console.warn('Error finding USB printers:', err);
          resolve([]);
        } else {
          resolve(devices || []);
        }
      });
    });

    return devices.map((device, index) => ({
      id: `usb-${index}`,
      name: device.deviceDescriptor?.idVendor || `Printer ${index + 1}`,
      type: 'usb',
      device,
    }));
  } catch (error) {
    console.error('Error listing printers:', error);
    return [];
  }
}

export async function printReceipt(data: {
  printerId?: string;
  lines: string[];
  encoding?: string;
}): Promise<{ success: boolean; message?: string }> {
  return new Promise(async (resolve) => {
    try {
      // Check if USB support is available
      if (!escposUSB || !escpos.USB) {
        resolve({ success: false, message: 'USB printer support not available. Please install escpos-usb module.' });
        return;
      }

      const devices = await listPrinters();
      if (devices.length === 0) {
        resolve({ success: false, message: 'No printers found' });
        return;
      }

      const selectedDevice = devices.find((d) => d.id === data.printerId) || devices[0];
      if (!selectedDevice || !selectedDevice.device) {
        resolve({ success: false, message: 'Selected printer device not available' });
        return;
      }

      const device = selectedDevice.device;

      // Create printer instance
      const options = {
        encoding: data.encoding || 'GB18030',
        width: 48, // 48mm width
      };

      const printer = new Printer(device, options);

      // Print lines
      printer
        .font('a')
        .align('ct')
        .size(1, 1)
        .text('SNOOKER POS')
        .text('----------------')
        .size(0, 0)
        .align('lt');

      data.lines.forEach((line) => {
        printer.text(line);
      });

      printer
        .text('----------------')
        .align('ct')
        .text('Thank you!')
        .cut()
        .close(() => {
          resolve({ success: true, message: 'Receipt printed successfully' });
        });
    } catch (error: any) {
      resolve({ success: false, message: error.message });
    }
  });
}

