import { Order, StoreSettings } from '../types';

/**
 * Universal Cross-Platform Thermal Printer Driver & Formatter
 * 
 * Supports:
 * 1. Desktop & Laptop:
 *    - Plugged USB/Serial/Network thermal printers (58mm & 80mm roll exact browser & iframe print)
 *    - Bluetooth portable thermal printers (Web Bluetooth ESC/POS streaming)
 * 2. Android:
 *    - Bluetooth mobile thermal printers via Web Bluetooth API (Chrome)
 *    - Bluetooth mobile thermal printers via RawBT Service (supports Classic Bluetooth SPP / RFCOMM)
 *    - Android System Print Dialog
 * 3. iOS (iPhone / iPad):
 *    - iOS AirPrint & Bluetooth thermal printers via system print
 *    - Direct Web Share of 203 DPI thermal receipt image to mobile printer companion apps (POS-Printer, XPrinter, PeriPage, Phomemo)
 *    - Web Bluetooth in Bluefy / WebBLE browsers
 */

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  hasWebBluetooth: boolean;
  hasWebUSB: boolean;
  hasWebSerial: boolean;
  hasWebShare: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isInIframe: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      hasWebBluetooth: false,
      hasWebUSB: false,
      hasWebSerial: false,
      hasWebShare: false,
      isSafari: false,
      isChrome: false,
      isInIframe: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;
  const nav = navigator as any;
  const hasWebBluetooth = 'bluetooth' in nav;
  const hasWebUSB = 'usb' in nav;
  const hasWebSerial = 'serial' in nav;
  const hasWebShare = typeof navigator.share === 'function';
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua) && !isSafari;

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  return {
    isIOS,
    isAndroid,
    isDesktop,
    hasWebBluetooth,
    hasWebUSB,
    hasWebSerial,
    hasWebShare,
    isSafari,
    isChrome,
    isInIframe,
  };
}

export function formatCurrency(amount: number, symbol = 'Rs.'): string {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generates sample test order data for printer calibration and test prints
 */
export function createSampleTestOrder(settings: StoreSettings): Order {
  return {
    id: `test-order-${Date.now()}`,
    orderNumber: 'TEST-001',
    cashierName: settings.cashierName || 'Cashier 01',
    customer: {
      name: 'Sample Customer (Test)',
      phone: '+94 77 123 4567',
    },
    items: [
      {
        id: 'test-item-1',
        name: 'Deneth Boutique Shirt',
        sku: 'DF-SHIRT-01',
        category: 'Shirts',
        quantity: 1,
        unitPrice: 3500,
        selectedSize: 'M',
        selectedColor: 'Black',
      },
      {
        id: 'test-item-2',
        name: 'Pant Hemming (Alteration)',
        sku: 'ALT-HEM-01',
        category: 'Alterations',
        quantity: 1,
        unitPrice: 600,
      },
    ],
    subtotal: 4100,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 4100,
    paymentMethod: 'cash',
    tenderedAmount: 5000,
    changeAmount: 900,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Known Thermal Printer Bluetooth GATT Service UUIDs
 */
export const BLUETOOTH_THERMAL_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // MPT-II, POS-58, YHD-5808L, PT-210
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / YHD BLE
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic Thermal
  '0000fee7-0000-1000-8000-00805f9b34fb', // Wechat / Retail POS
  '0000e0ff-0000-1000-8000-00805f9b34fb', // Rongta / ZJiang
  '0000fff0-0000-1000-8000-00805f9b34fb', // Xprinter / Milestone
];

/**
 * Common Bluetooth printer name prefixes
 */
export const BLUETOOTH_NAME_PREFIXES = [
  'POS-58',
  'POS',
  'YHD',
  '5808',
  'YHD-5808L',
  'MPT',
  'RPP',
  'Printer',
  'MTP',
  'XP',
  'PT-',
  'GP-',
  'BlueTooth',
  'BT',
  'Thermal',
  'ZJ',
  'QS',
];

/**
 * Formats a plain text receipt suitable for WhatsApp sharing, SMS, RawBT, or clipboard
 */
export function generateReceiptText(order: Order, settings: StoreSettings, widthOverride?: '58mm' | '80mm'): string {
  const widthMode = widthOverride || settings.receiptWidth || '58mm';
  const width = widthMode === '80mm' ? 44 : 32;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const lineBetween = (left: string, right: string) => {
    const spaceCount = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaceCount) + right;
  };

  const lines: string[] = [
    doubleDivider,
    center(settings.storeName.toUpperCase()),
    center(settings.tagline || 'Boutique Apparel & Tailoring'),
    center(settings.address),
    center(`Tel: ${settings.phone}`),
    doubleDivider,
    lineBetween(`Bill No: #${order.orderNumber}`, new Date(order.createdAt).toLocaleDateString()),
    lineBetween(`Cashier: ${order.cashierName}`, new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
  ];

  if (order.customer?.name || order.customer?.phone) {
    lines.push(divider);
    if (order.customer.name) lines.push(`Customer: ${order.customer.name}`);
    if (order.customer.phone) lines.push(`Phone:    ${order.customer.phone}`);
  }

  lines.push(divider);
  lines.push(lineBetween('ITEM', 'QTY   AMOUNT'));
  lines.push(divider);

  for (const item of order.items) {
    const variant = [item.selectedSize, item.selectedColor].filter(Boolean).join('/');
    const nameStr = `${item.name}${variant ? ` (${variant})` : ''}`;
    lines.push(nameStr);
    const lineTotal = formatCurrency(item.quantity * item.unitPrice, settings.currencySymbol);
    if (item.quantity > 1) {
      lines.push(lineBetween(`  Qty: ${item.quantity} (@ ${formatCurrency(item.unitPrice, settings.currencySymbol)})`, lineTotal));
    } else {
      lines.push(lineBetween('  Qty: 1', lineTotal));
    }
  }

  lines.push(divider);
  lines.push(lineBetween('SUBTOTAL:', formatCurrency(order.subtotal, settings.currencySymbol)));

  if (order.discountAmount > 0) {
    lines.push(lineBetween(`DISCOUNT (${order.discountPercent}%):`, `-${formatCurrency(order.discountAmount, settings.currencySymbol)}`));
  }

  if (order.taxAmount > 0) {
    lines.push(lineBetween(`TAX (${order.taxPercent}%):`, formatCurrency(order.taxAmount, settings.currencySymbol)));
  }

  lines.push(doubleDivider);
  lines.push(lineBetween('TOTAL PAYABLE:', formatCurrency(order.total, settings.currencySymbol)));
  lines.push(doubleDivider);

  lines.push(lineBetween(`PAID [${order.paymentMethod.toUpperCase()}]:`, formatCurrency(order.tenderedAmount, settings.currencySymbol)));
  if (order.changeAmount > 0) {
    lines.push(lineBetween('CHANGE RETURNED:', formatCurrency(order.changeAmount, settings.currencySymbol)));
  }

  lines.push('');
  lines.push(center('*** ITEMS PURCHASED: ' + order.items.reduce((s, i) => s + i.quantity, 0) + ' ***'));
  lines.push('');
  lines.push(center(settings.receiptFooterMessage));
  lines.push(center('Thank You for Shopping with Us!'));
  lines.push(doubleDivider);

  return lines.join('\n');
}

/**
 * Creates ESC/POS binary command buffer for portable thermal printers
 */
export function buildEscPosPayload(order: Order, settings: StoreSettings, widthMode: '58mm' | '80mm' = '58mm'): Uint8Array {
  const ESC = 0x1B;
  const GS = 0x1D;

  const chunks: number[] = [];

  // Helper to push array of bytes
  const push = (...bytes: number[]) => chunks.push(...bytes);
  const encoder = new TextEncoder();
  const pushText = (text: string) => {
    const bytes = encoder.encode(text);
    for (let i = 0; i < bytes.length; i++) chunks.push(bytes[i]);
  };

  // 1. Initialize printer
  push(ESC, 0x40);

  // 2. Select character code table (PC437 / Standard)
  push(ESC, 0x74, 0x00);

  // 3. Center alignment
  push(ESC, 0x61, 0x01);

  // 4. Double height / bold for Store Name
  push(ESC, 0x21, 0x20); // Double height
  pushText(`${settings.storeName.toUpperCase()}\n`);
  push(ESC, 0x21, 0x00); // Normal font

  pushText(`${settings.tagline || 'Boutique Apparel & Tailoring'}\n`);
  pushText(`${settings.address}\n`);
  pushText(`Tel: ${settings.phone}\n`);

  // Left align for body
  push(ESC, 0x61, 0x00);

  const receiptBody = generateReceiptText(order, settings, widthMode);
  // Remove the header lines since we formatted them with double-height above
  const bodyWithoutDuplicateHeader = receiptBody.split('\n').slice(6).join('\n');

  pushText(bodyWithoutDuplicateHeader);
  pushText('\n\n\n\n');

  // Cut paper (GS V 66 0: Feed n lines and cut)
  push(GS, 0x56, 0x42, 0x00);

  return new Uint8Array(chunks);
}

/**
 * Injects dynamic print page size CSS rules into the document head
 */
export function injectThermalPrintStyles(widthMode: '58mm' | '80mm' = '58mm'): void {
  try {
    const existing = document.getElementById('dynamic-thermal-page-style');
    if (existing) {
      existing.remove();
    }

    const style = document.createElement('style');
    style.id = 'dynamic-thermal-page-style';
    style.textContent = `
      @media print {
        @page {
          size: ${widthMode === '80mm' ? '80mm auto' : '58mm auto'} !important;
          margin: 0mm !important;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.setAttribute('data-print-width', widthMode);
    document.documentElement.setAttribute('data-print-width', widthMode);
  } catch (e) {
    console.warn('Could not inject dynamic print style:', e);
  }
}

/**
 * Prints to Plugged USB / Network / System printer.
 * 
 * Synchronously triggers the browser's native print dialog on the active window.
 * If running inside a sandboxed iframe without allow-modals, gracefully falls back
 * to a non-zero offscreen printable iframe.
 */
export function printReceiptViaBrowser(
  receiptElementId = 'thermal-receipt-printable',
  widthMode: '58mm' | '80mm' = '58mm'
): { success: boolean; message?: string } {
  // 1. Inject exact @page dimension rule for 58mm or 80mm roll
  injectThermalPrintStyles(widthMode);

  // 2. Direct Window Print:
  // Calling window.print() synchronously inside the user's click event
  // guarantees user-gesture validation across Chrome, Edge, Safari, Firefox, iOS & Android.
  try {
    window.print();
    return { success: true };
  } catch (directPrintErr: any) {
    console.warn('Direct window.print() threw, trying fallback printable frame:', directPrintErr);
  }

  // 3. Fallback: If window.print() was blocked (e.g. sandboxed iframe),
  // use a hidden iframe that HAS REAL NON-ZERO DIMENSIONS (so Chromium never drops it!)
  try {
    const receiptElem = document.getElementById(receiptElementId);
    if (!receiptElem) {
      return { success: false, message: 'Receipt container not found in DOM.' };
    }

    let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    // Non-zero dimensions placed offscreen:
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0px';
    iframe.style.width = widthMode === '80mm' ? '576px' : '384px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - Deneth Fashion</title>
          <style>
            @page {
              size: ${widthMode === '80mm' ? '80mm auto' : '58mm auto'};
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: 'JetBrains Mono', 'Courier New', monospace;
              font-size: ${widthMode === '80mm' ? '12px' : '10.5px'};
              line-height: 1.25;
              width: ${widthMode === '80mm' ? '80mm' : '58mm'};
              box-sizing: border-box;
            }
            #thermal-receipt-printable {
              width: ${widthMode === '80mm' ? '80mm' : '58mm'} !important;
              max-width: ${widthMode === '80mm' ? '80mm' : '58mm'} !important;
              padding: 2mm 1mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            img {
              max-width: 90% !important;
              height: auto !important;
              filter: grayscale(100%) contrast(200%) !important;
              display: block !important;
              margin: 0 auto !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
          </style>
        </head>
        <body>
          ${receiptElem.outerHTML}
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (iframeErr: any) {
          console.error('Iframe print failed:', iframeErr);
        }
      }, 80);

      return { success: true };
    }
  } catch (err: any) {
    console.error('All printing attempts failed:', err);
    return {
      success: false,
      message: err?.message || 'Print dialog could not be opened. Please check browser permissions.',
    };
  }

  return { success: false, message: 'Print dialog could not be opened.' };
}

/**
 * Direct WebUSB Hardware ESC/POS Printer Driver
 * Communicates directly over USB cable with plugged thermal printers
 * (Xprinter, POS-58, Rongta, Epson, ZJiang, Milestone, etc.)
 * Bypasses Windows/Mac spoolers and works directly from the browser!
 */
export async function printViaWebUSB(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm'
): Promise<{ success: boolean; message: string }> {
  const nav = navigator as any;
  if (!nav.usb) {
    return {
      success: false,
      message: 'WebUSB is not supported on this browser. Please use Google Chrome, Edge, or Opera on Windows/Mac/Linux/Android.',
    };
  }

  try {
    // 1. Request USB Device from user with printer class and common thermal vendor IDs
    const device = await nav.usb.requestDevice({
      filters: [
        { classCode: 7 }, // Standard USB Printer Class
        { vendorId: 0x0fe6 }, // ICS / ZJiang
        { vendorId: 0x0416 }, // Winbond / POS58
        { vendorId: 0x0483 }, // STMicroelectronics / Xprinter
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x1fc9 }, // NXP / Thermal
        { vendorId: 0x1a86 }, // QinHeng Electronics / CH340 USB
        { vendorId: 0x067b }, // Prolific
      ],
    }).catch(async (e: any) => {
      if (e.name === 'NotFoundError') throw e;
      // If filtered fails, let user pick any connected USB device
      return await nav.usb.requestDevice({ filters: [] });
    });

    if (!device) {
      return { success: false, message: 'No USB printer selected.' };
    }

    await device.open();

    // 2. Select configuration
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // 3. Find printer interface and bulk OUT endpoint
    let targetInterfaceNumber = 0;
    let endpointOutNumber: number | null = null;

    const configuration = device.configuration;
    if (configuration && configuration.interfaces) {
      for (const iface of configuration.interfaces) {
        for (const alt of iface.alternates) {
          const outEndpoint = alt.endpoints.find(
            (ep: any) => ep.direction === 'out' && ep.type === 'bulk'
          );
          if (outEndpoint) {
            targetInterfaceNumber = iface.interfaceNumber;
            endpointOutNumber = outEndpoint.endpointNumber;
            break;
          }
        }
        if (endpointOutNumber !== null) break;
      }
    }

    // Fallback: claim interface 0, endpoint 1 or 2 if not found
    try {
      await device.claimInterface(targetInterfaceNumber);
    } catch {
      // already claimed or alternate
    }

    if (endpointOutNumber === null) {
      endpointOutNumber = 1;
    }

    // 4. Build binary ESC/POS payload
    const payload = buildEscPosPayload(order, settings, widthMode);

    // 5. Transfer OUT to thermal printer in chunks
    const chunkSize = 64;
    for (let offset = 0; offset < payload.length; offset += chunkSize) {
      const slice = payload.slice(offset, offset + chunkSize);
      await device.transferOut(endpointOutNumber, slice);
    }

    try {
      await device.releaseInterface(targetInterfaceNumber);
      await device.close();
    } catch {
      // closed
    }

    return {
      success: true,
      message: `Successfully printed via USB cable to ${device.productName || 'USB Thermal Printer'}!`,
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'USB printer selection was cancelled.' };
    }
    return {
      success: false,
      message: `USB error: ${err.message || 'Could not communicate with USB printer.'}`,
    };
  }
}

// Persistent connection singletons so devices stay warm and connected across bills
let cachedSerialPort: any = null;
let cachedBluetoothDevice: any = null;
let cachedBluetoothCharacteristic: any = null;

export type PrintMethod = 'serial' | 'bluetooth' | 'system' | 'usb';

/**
 * Universal Printer Connection Manager
 * Remembers authorized COM ports (COM11) and paired Bluetooth devices (POS-58)
 * so bills print instantly with zero popups and zero confirmation dialogs!
 */
export const PrinterManager = {
  getPreferredMethod(): PrintMethod {
    try {
      return (localStorage.getItem('df_preferred_print_method') as PrintMethod) || 'serial';
    } catch {
      return 'serial';
    }
  },

  setPreferredMethod(method: PrintMethod): void {
    try {
      localStorage.setItem('df_preferred_print_method', method);
    } catch {}
  },

  getBaudRate(): number {
    try {
      const stored = localStorage.getItem('df_serial_baud');
      return stored ? Number(stored) : 9600;
    } catch {
      return 9600;
    }
  },

  setBaudRate(baud: number): void {
    try {
      localStorage.setItem('df_serial_baud', String(baud));
    } catch {}
  },

  async isSerialAuthorized(): Promise<boolean> {
    const nav = navigator as any;
    if (!nav?.serial) return false;
    try {
      if (cachedSerialPort) return true;
      const ports = await nav.serial.getPorts();
      return Boolean(ports && ports.length > 0);
    } catch {
      return false;
    }
  },

  isBluetoothConnected(): boolean {
    return Boolean(cachedBluetoothDevice && cachedBluetoothDevice.gatt?.connected);
  },

  /**
   * Prompts user once to authorize the Virtual COM Port (e.g. COM11)
   */
  async pairSerialPort(baudRate = 9600): Promise<{ success: boolean; message: string }> {
    const nav = navigator as any;
    if (!nav.serial) {
      return { success: false, message: 'Web Serial not supported in this browser (use Chrome or Edge).' };
    }
    try {
      cachedSerialPort = await nav.serial.requestPort();
      this.setBaudRate(baudRate);
      return { success: true, message: 'Virtual COM Port (COM11) paired successfully!' };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, message: 'Port selection cancelled.' };
      }
      return { success: false, message: `Serial pairing error: ${err.message || err}` };
    }
  },

  /**
   * Prompts user once to pair the Bluetooth printer (e.g. POS-58)
   */
  async pairBluetoothDevice(): Promise<{ success: boolean; message: string }> {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      return { success: false, message: 'Web Bluetooth not supported in this browser.' };
    }
    try {
      let device = null;
      try {
        device = await nav.bluetooth.requestDevice({
          filters: [
            ...BLUETOOTH_NAME_PREFIXES.map((prefix) => ({ namePrefix: prefix })),
            ...BLUETOOTH_THERMAL_SERVICES.map((s) => ({ services: [s] })),
          ],
          optionalServices: BLUETOOTH_THERMAL_SERVICES,
        });
      } catch {
        device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: BLUETOOTH_THERMAL_SERVICES,
        });
      }

      if (!device || !device.gatt) {
        throw new Error('Bluetooth device GATT unavailable');
      }

      cachedBluetoothDevice = device;
      const server = await device.gatt.connect();

      // Find characteristic
      cachedBluetoothCharacteristic = null;
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              cachedBluetoothCharacteristic = char;
              break;
            }
          }
        } catch {}
        if (cachedBluetoothCharacteristic) break;
      }

      return {
        success: true,
        message: `Paired successfully with ${device.name || 'POS-58'} via Bluetooth!`,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, message: 'Bluetooth pairing cancelled.' };
      }
      return { success: false, message: `Bluetooth pairing error: ${err.message || err}` };
    }
  },

  /**
   * One-touch instant print using the user's preferred method (NO POPUP!)
   * Triggered when clicking the primary button OR pressing the ENTER key!
   */
  async printWithActiveMethod(
    order: Order,
    settings: StoreSettings,
    widthMode: '58mm' | '80mm' = '58mm'
  ): Promise<{ success: boolean; message: string }> {
    const method = this.getPreferredMethod();
    if (method === 'serial') {
      return await printViaWebSerial(order, settings, widthMode, this.getBaudRate(), false);
    } else if (method === 'bluetooth') {
      return await printViaBluetooth(order, settings, widthMode, false);
    } else if (method === 'usb') {
      return await printViaWebUSB(order, settings, widthMode);
    } else {
      printReceiptViaBrowser('thermal-receipt-printable', widthMode);
      return { success: true, message: 'Sent to Windows system print spooler.' };
    }
  },
};

/**
 * Direct Web Serial Port ESC/POS Printer Driver
 * Uses remembered authorized port silently with ZERO POPUP prompts!
 */
export async function printViaWebSerial(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm',
  baudRate = 9600,
  forcePrompt = false
): Promise<{ success: boolean; message: string }> {
  const nav = navigator as any;
  if (!nav.serial) {
    return {
      success: false,
      message: 'Web Serial is not supported on this browser. Please use Chrome or Edge on PC/Mac/Linux.',
    };
  }

  try {
    let port = cachedSerialPort;

    // 1. Silent recall: Check if port was already granted by user (NO POPUP!)
    if (!port && !forcePrompt) {
      try {
        const ports = await nav.serial.getPorts();
        if (ports && ports.length > 0) {
          port = ports[0];
          cachedSerialPort = port;
        }
      } catch {}
    }

    // 2. Only if no port was ever granted or user requested re-pairing, prompt
    if (!port || forcePrompt) {
      port = await nav.serial.requestPort();
      cachedSerialPort = port;
    }

    // 3. Open port if not already open
    let closeAfter = false;
    if (!port.readable || !port.writable) {
      try {
        await port.open({ baudRate });
        closeAfter = true;
      } catch (openErr: any) {
        if (!openErr.message?.includes('already open')) {
          throw openErr;
        }
      }
    }

    const payload = buildEscPosPayload(order, settings, widthMode);
    const writer = port.writable.getWriter();
    await writer.write(payload);
    writer.releaseLock();

    if (closeAfter) {
      try {
        await port.close();
      } catch {}
    }

    return {
      success: true,
      message: 'Printed directly to Virtual COM Port (COM11)!',
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'Serial port selection cancelled.' };
    }
    return {
      success: false,
      message: `Serial port error: ${err.message || 'Failed to send data to COM port.'}`,
    };
  }
}

/**
 * Connects and streams ESC/POS commands to Bluetooth portable thermal printers
 * Reuses active Bluetooth device in memory with ZERO POPUP prompts!
 */
export async function printViaBluetooth(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm',
  forcePrompt = false
): Promise<{ success: boolean; message: string }> {
  const nav = navigator as any;

  if (!nav.bluetooth) {
    const device = detectDevice();
    if (device.isIOS) {
      return {
        success: false,
        message: 'iOS Safari requires the Bluefy browser for Web Bluetooth, or use "AirPrint / Share to iOS App".',
      };
    }
    return {
      success: false,
      message: 'Web Bluetooth is not supported on this browser. Try Google Chrome or Microsoft Edge.',
    };
  }

  try {
    let device = cachedBluetoothDevice;
    let characteristic = cachedBluetoothCharacteristic;

    // 1. Silent recall: Check if device is already connected (NO POPUP!)
    const isConnected = Boolean(device && device.gatt && device.gatt.connected && characteristic);

    if (!isConnected || forcePrompt) {
      // Try previously permitted devices if available in browser
      if (!device && !forcePrompt && typeof nav.bluetooth.getDevices === 'function') {
        try {
          const devices = await nav.bluetooth.getDevices();
          if (devices && devices.length > 0) {
            device = devices[0];
            cachedBluetoothDevice = device;
          }
        } catch {}
      }

      // If still not available or re-pairing requested, prompt user
      if (!device || forcePrompt) {
        try {
          device = await nav.bluetooth.requestDevice({
            filters: [
              ...BLUETOOTH_NAME_PREFIXES.map((prefix) => ({ namePrefix: prefix })),
              ...BLUETOOTH_THERMAL_SERVICES.map((s) => ({ services: [s] })),
            ],
            optionalServices: BLUETOOTH_THERMAL_SERVICES,
          });
        } catch {
          device = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: BLUETOOTH_THERMAL_SERVICES,
          });
        }
        cachedBluetoothDevice = device;
      }

      if (!device || !device.gatt) {
        throw new Error('Bluetooth device GATT connection unavailable');
      }

      const server = device.gatt.connected ? device.gatt : await device.gatt.connect();

      // Scan services for writable characteristic
      characteristic = null;
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              characteristic = char;
              cachedBluetoothCharacteristic = char;
              break;
            }
          }
        } catch {}
        if (characteristic) break;
      }
    }

    if (!characteristic) {
      throw new Error('Could not find a writable print channel on POS-58 printer.');
    }

    // Build binary ESC/POS payload
    const payload = buildEscPosPayload(order, settings, widthMode);

    // Send in chunks (BLE characteristic MTU is typically 100-512 bytes)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      // Small 20ms pause for cheap thermal microcontrollers to buffer
      await new Promise((r) => setTimeout(r, 20));
    }

    return {
      success: true,
      message: `Successfully printed to ${device.name || 'POS-58'} via Bluetooth!`,
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'Printer selection cancelled.' };
    }
    return {
      success: false,
      message: `Bluetooth error: ${err.message || 'Connection failed'}`,
    };
  }
}

/**
 * Triggers Android RawBT Thermal Printer service.
 * Connects directly to Bluetooth classic SPP & BLE thermal printers on Android.
 */
export function printViaAndroidRawBT(order: Order, settings: StoreSettings, widthMode: '58mm' | '80mm' = '58mm'): boolean {
  try {
    const text = generateReceiptText(order, settings, widthMode) + '\n\n\n\n';
    const base64 = btoa(unescape(encodeURIComponent(text)));
    const rawBtUrl = `rawbt:base64,${base64}`;

    window.location.href = rawBtUrl;
    return true;
  } catch {
    return false;
  }
}

/**
 * Renders the receipt onto an HTML5 Canvas at 203 DPI (thermal standard)
 * 58mm = 384 pixels width
 * 80mm = 576 pixels width
 */
export async function renderReceiptToCanvas(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm'
): Promise<HTMLCanvasElement> {
  const width = widthMode === '80mm' ? 576 : 384;
  const padding = 16;
  const contentWidth = width - padding * 2;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Pre-calculate height
  let estimatedHeight = 520 + order.items.length * 48;
  if (order.customer?.name) estimatedHeight += 30;
  if (order.discountAmount > 0) estimatedHeight += 24;
  if (order.taxAmount > 0) estimatedHeight += 24;

  canvas.width = width;
  canvas.height = estimatedHeight;

  // Background white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, estimatedHeight);

  // Black ink
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = padding;

  // Draw Logo if available
  const logoUrl = '/assets/aistudio/Fauget_Clothing_Mark_Stylist_Logo_-removebg-preview-Picsart-AiImageEnhancer_e92e9ecb.png';
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // continue if logo fails
      img.src = logoUrl;
    });

    if (img.width && img.height) {
      const maxLogoW = contentWidth * 0.75;
      const scale = maxLogoW / img.width;
      const logoH = Math.min(img.height * scale, 90);
      const logoW = img.width * (logoH / img.height);
      const logoX = (width - logoW) / 2;

      ctx.drawImage(img, logoX, y, logoW, logoH);
      y += logoH + 8;
    }
  } catch {
    // continue without logo
  }

  // Store Header
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(settings.storeName.toUpperCase(), width / 2, y);
  y += 26;

  ctx.font = '13px "Courier New", monospace';
  ctx.fillText(settings.tagline || 'Boutique Apparel & Tailoring', width / 2, y);
  y += 18;
  ctx.fillText(settings.address, width / 2, y);
  y += 18;
  ctx.fillText(`Tel: ${settings.phone}`, width / 2, y);
  y += 24;

  // Divider
  const drawDivider = (dashed = true) => {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    if (dashed) {
      ctx.setLineDash([4, 3]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 12;
  };

  drawDivider(true);

  // Bill Meta
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`INVOICE: #${order.orderNumber}`, padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(new Date(order.createdAt).toLocaleDateString(), width - padding, y);
  y += 18;

  ctx.textAlign = 'left';
  ctx.fillText(`Cashier: ${order.cashierName}`, padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(
    new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    width - padding,
    y
  );
  y += 18;

  if (order.customer?.name) {
    ctx.textAlign = 'left';
    ctx.fillText(`Customer: ${order.customer.name}`, padding, y);
    if (order.customer.phone) {
      ctx.textAlign = 'right';
      ctx.fillText(order.customer.phone, width - padding, y);
    }
    y += 18;
  }

  drawDivider(true);

  // Column Headers
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', padding, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', width / 2 + 30, y);
  ctx.textAlign = 'right';
  ctx.fillText('PRICE', width - padding, y);
  y += 18;

  drawDivider(false);

  // Items
  for (const item of order.items) {
    const variant = [item.selectedSize, item.selectedColor].filter(Boolean).join('/');
    const itemTitle = `${item.name}${variant ? ` (${variant})` : ''}`;
    const lineTotal = item.quantity * item.unitPrice;

    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(itemTitle.length > 22 ? itemTitle.substring(0, 20) + '..' : itemTitle, padding, y);

    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.quantity}`, width / 2 + 30, y);

    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(lineTotal, settings.currencySymbol), width - padding, y);
    y += 18;

    if (item.quantity > 1) {
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#444444';
      ctx.textAlign = 'right';
      ctx.fillText(`@ ${formatCurrency(item.unitPrice, settings.currencySymbol)}`, width - padding, y);
      ctx.fillStyle = '#000000';
      y += 16;
    }
  }

  drawDivider(true);

  // Subtotal & Financials
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal:', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatCurrency(order.subtotal, settings.currencySymbol), width - padding, y);
  y += 18;

  if (order.discountAmount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Discount (${order.discountPercent}%):`, padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-${formatCurrency(order.discountAmount, settings.currencySymbol)}`, width - padding, y);
    y += 18;
  }

  if (order.taxAmount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Tax (${order.taxPercent}%):`, padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(order.taxAmount, settings.currencySymbol), width - padding, y);
    y += 18;
  }

  // Net Total Box
  y += 4;
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 6;

  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL:', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatCurrency(order.total, settings.currencySymbol), width - padding, y);
  y += 24;

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 12;

  // Payment
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`PAID [${order.paymentMethod.toUpperCase()}]:`, padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatCurrency(order.tenderedAmount, settings.currencySymbol), width - padding, y);
  y += 18;

  if (order.changeAmount > 0) {
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CHANGE RETURNED:', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(order.changeAmount, settings.currencySymbol), width - padding, y);
    y += 18;
  }

  drawDivider(true);

  // Barcode representation
  ctx.textAlign = 'center';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`TOTAL PCS: ${order.items.reduce((s, i) => s + i.quantity, 0)}`, width / 2, y);
  y += 16;

  const barH = 26;
  const barCount = 38;
  const startX = (width - barCount * 6) / 2;
  for (let i = 0; i < barCount; i++) {
    if ((i * 3) % 4 !== 0) {
      ctx.fillRect(startX + i * 6, y, (i % 2 === 0 ? 3 : 1.5), barH);
    }
  }
  y += barH + 6;

  ctx.fillText(order.orderNumber, width / 2, y);
  y += 20;

  drawDivider(true);

  // Footer notes
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(settings.receiptFooterMessage, width / 2, y);
  y += 16;
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText('*** Thank You! Visit Again ***', width / 2, y);
  y += 24;

  // Trim canvas to actual final height
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = y;
  const fCtx = finalCanvas.getContext('2d');
  if (fCtx) {
    fCtx.drawImage(canvas, 0, 0);
    return finalCanvas;
  }

  return canvas;
}

/**
 * Creates a PNG Blob from the rendered receipt canvas
 */
export async function getReceiptBlob(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm'
): Promise<Blob> {
  const canvas = await renderReceiptToCanvas(order, settings, widthMode);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate receipt image'));
    }, 'image/png');
  });
}

/**
 * Native iOS & Mobile Share Handler:
 * Opens the iOS Action Sheet with the receipt PNG so the user can send it to:
 * - Bluetooth Thermal Printer companion apps (POS-Printer, XPrinter, Phomemo, PeriPage)
 * - AirPrint printers
 * - WhatsApp, Files, or Photos
 */
export async function shareReceiptImage(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm'
): Promise<{ success: boolean; message: string }> {
  try {
    const blob = await getReceiptBlob(order, settings, widthMode);
    const fileName = `Bill-${order.orderNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Bill #${order.orderNumber} - ${settings.storeName}`,
        text: `Receipt for Order #${order.orderNumber}`,
        files: [file],
      });
      return { success: true, message: 'Shared receipt successfully!' };
    } else if (navigator.share) {
      // Fallback share text
      await navigator.share({
        title: `Bill #${order.orderNumber}`,
        text: generateReceiptText(order, settings, widthMode),
      });
      return { success: true, message: 'Shared receipt text!' };
    } else {
      // Fallback: download file
      downloadReceiptImage(order, settings, widthMode);
      return { success: true, message: 'Downloaded receipt image for mobile printer app.' };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Share was dismissed.' };
    }
    return { success: false, message: `Share error: ${err.message || err}` };
  }
}

/**
 * Downloads the high-contrast receipt PNG for opening in any mobile thermal printer app
 */
export async function downloadReceiptImage(
  order: Order,
  settings: StoreSettings,
  widthMode: '58mm' | '80mm' = '58mm'
): Promise<void> {
  const blob = await getReceiptBlob(order, settings, widthMode);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt-${order.orderNumber}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Creates a WhatsApp share URL with the formatted digital receipt
 */
export function getWhatsAppReceiptUrl(phone: string, receiptText: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(receiptText);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
