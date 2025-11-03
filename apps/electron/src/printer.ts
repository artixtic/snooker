// ESC/POS printer support
import { Printer } from 'escpos';
import escpos from 'escpos';
// @ts-ignore - escpos types may not be perfect
escpos.USB = require('escpos-usb');

export async function listPrinters(): Promise<any[]> {
  try {
    // List USB printers
    const devices = await new Promise<any[]>((resolve, reject) => {
      escpos.USB.findPrinter((err: any, devices: any[]) => {
        if (err) reject(err);
        else resolve(devices || []);
      });
    });

    return devices.map((device, index) => ({
      id: `usb-${index}`,
      name: device.deviceDescriptor.idVendor || `Printer ${index + 1}`,
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
      const devices = await listPrinters();
      if (devices.length === 0) {
        resolve({ success: false, message: 'No printers found' });
        return;
      }

      const selectedDevice = devices.find((d) => d.id === data.printerId) || devices[0];
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

