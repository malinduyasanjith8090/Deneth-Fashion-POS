import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Bluetooth,
  Share2,
  Copy,
  Check,
  X,
  PlusCircle,
  Download,
  Smartphone,
  Radio,
  Cable,
  Cpu,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Info,
  CornerDownLeft,
  Settings2,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { ThermalReceipt } from './ThermalReceipt';
import {
  detectDevice,
  printReceiptViaBrowser,
  printViaWebUSB,
  printViaWebSerial,
  printViaBluetooth,
  printViaAndroidRawBT,
  shareReceiptImage,
  downloadReceiptImage,
  generateReceiptText,
  getWhatsAppReceiptUrl,
  PrinterManager,
  PrintMethod,
} from '../utils/printer';

interface ReceiptModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  onClose,
  onNewSale,
}) => {
  const [copied, setCopied] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [rollWidth, setRollWidth] = useState<'58mm' | '80mm'>(settings.receiptWidth || '58mm');
  const [baudRate, setBaudRate] = useState<number>(() => PrinterManager.getBaudRate());
  const [activeMethod, setActiveMethod] = useState<PrintMethod>(() => PrinterManager.getPreferredMethod());
  const [isSerialPaired, setIsSerialPaired] = useState<boolean>(false);
  const [isBtPaired, setIsBtPaired] = useState<boolean>(false);
  const [showDeviceTips, setShowDeviceTips] = useState(false);

  const device = detectDevice();

  useEffect(() => {
    if (settings.receiptWidth) {
      setRollWidth(settings.receiptWidth);
    }
  }, [settings.receiptWidth]);

  // Check persistent authorizations on mount
  useEffect(() => {
    PrinterManager.isSerialAuthorized().then((authorized) => {
      setIsSerialPaired(authorized);
    });
    setIsBtPaired(PrinterManager.isBluetoothConnected());
  }, []);

  if (!order) return null;

  // Active settings with user-selected roll width
  const currentSettings: StoreSettings = {
    ...settings,
    receiptWidth: rollWidth,
  };

  /**
   * One-Touch Print handler (Runs on Click or pressing the ENTER key)
   * Uses cached/remembered device with ZERO browser popup dialogs!
   */
  const handleOneTouchPrint = useCallback(async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      if (activeMethod === 'serial') {
        setPrintStatus(`Sending receipt to Virtual COM (COM11 @ ${baudRate} baud)...`);
        const result = await printViaWebSerial(order, currentSettings, rollWidth, baudRate, false);
        setPrintStatus(result.message);
        if (result.success) {
          setIsSerialPaired(true);
        }
      } else if (activeMethod === 'bluetooth') {
        setPrintStatus('Sending receipt to POS-58 via Bluetooth...');
        const result = await printViaBluetooth(order, currentSettings, rollWidth, false);
        setPrintStatus(result.message);
        if (result.success) {
          setIsBtPaired(true);
        }
      } else if (activeMethod === 'usb') {
        setPrintStatus('Sending receipt via Direct USB Cable...');
        const result = await printViaWebUSB(order, currentSettings, rollWidth);
        setPrintStatus(result.message);
      } else {
        // System Spooler
        setPrintStatus('Opening Windows Print dialog for "POS-58"...');
        const result = printReceiptViaBrowser('thermal-receipt-printable', rollWidth);
        if (!result.success && result.message) {
          setPrintStatus(result.message);
        } else {
          setPrintStatus('Print job sent to Windows printer spooler!');
        }
      }
    } catch (err: any) {
      setPrintStatus(`Print error: ${err.message || err}`);
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintStatus(null), 5500);
    }
  }, [activeMethod, baudRate, currentSettings, isPrinting, order, rollWidth]);

  /**
   * KEYBOARD SHORTCUT:
   * Pressing ENTER anywhere in the Bill Completed modal prints automatically!
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused on a select or input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleOneTouchPrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOneTouchPrint]);

  /**
   * Switches default print method and persists to localStorage
   */
  const handleSelectMethod = (method: PrintMethod) => {
    setActiveMethod(method);
    PrinterManager.setPreferredMethod(method);
  };

  /**
   * Force pairing dialog if user wants to select a new COM port or re-pair Bluetooth
   */
  const handleForcePair = async () => {
    if (activeMethod === 'serial') {
      setPrintStatus('Select your Virtual COM Port (e.g. COM11)...');
      const res = await PrinterManager.pairSerialPort(baudRate);
      setPrintStatus(res.message);
      if (res.success) setIsSerialPaired(true);
    } else if (activeMethod === 'bluetooth') {
      setPrintStatus('Select your POS-58 Bluetooth printer...');
      const res = await PrinterManager.pairBluetoothDevice();
      setPrintStatus(res.message);
      if (res.success) setIsBtPaired(true);
    }
    setTimeout(() => setPrintStatus(null), 5000);
  };

  /**
   * Android RawBT
   */
  const handleAndroidRawBtPrint = () => {
    const success = printViaAndroidRawBT(order, currentSettings, rollWidth);
    if (!success) {
      setPrintStatus('Could not launch RawBT. Please install RawBT from Google Play.');
      setTimeout(() => setPrintStatus(null), 5000);
    }
  };

  /**
   * iOS Share
   */
  const handleShareToPrinterApp = async () => {
    setIsSharing(true);
    const result = await shareReceiptImage(order, currentSettings, rollWidth);
    setIsSharing(false);
    if (!result.success && result.message !== 'Share was dismissed.') {
      setPrintStatus(result.message);
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  /**
   * Download PNG Image
   */
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      await downloadReceiptImage(order, currentSettings, rollWidth);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Copy Plain Text
   */
  const handleCopyText = async () => {
    const text = generateReceiptText(order, currentSettings, rollWidth);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * WhatsApp Share
   */
  const handleWhatsAppShare = () => {
    const text = generateReceiptText(order, currentSettings, rollWidth);
    const phone = order.customer?.phone || '';
    const url = getWhatsAppReceiptUrl(phone, text);
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col transition-colors"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Bill Completed</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    POS-58 (YHD-5808L)
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Order #{order.orderNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                    {currentSettings.currencySymbol} {order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Roll Width Switcher */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setRollWidth('58mm')}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    rollWidth === '58mm'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                  title="58mm (2-inch standard roll for YHD-5808L / POS-58)"
                >
                  58mm Roll
                </button>
                <button
                  type="button"
                  onClick={() => setRollWidth('80mm')}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    rollWidth === '80mm'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                  title="80mm (3-inch roll)"
                >
                  80mm
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Thermal Paper Preview */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center">
            {/* Status notification banner */}
            {printStatus && (
              <div className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-center flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 animate-pulse shrink-0" />
                <span>{printStatus}</span>
              </div>
            )}

            {/* Iframe sandbox notice banner (with 1-click standalone tab button) */}
            {device.isInIframe && (
              <div className="w-full max-w-lg mb-2.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-500" />
                  <span>
                    Preview pane blocks Windows print dialogs. For Windows <strong>POS-58</strong> spooler:
                  </span>
                </div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs whitespace-nowrap shrink-0 flex items-center gap-1 shadow-xs ml-auto sm:ml-0"
                >
                  <span>Open Full Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Simulated 58mm Thermal Paper Container */}
            <div
              className={`relative shadow-2xl rounded-sm transition-all overflow-hidden border border-neutral-300 dark:border-neutral-700/60 bg-white ${
                rollWidth === '80mm' ? 'w-[340px] max-w-full' : 'w-[280px] max-w-full'
              }`}
            >
              {/* Jagged paper top */}
              <div className="h-2 bg-white w-full border-b border-dashed border-neutral-300" />

              <ThermalReceipt order={order} settings={currentSettings} />

              {/* Jagged paper bottom (Manual tear bar for YHD-5808L) */}
              <div className="h-4 bg-white w-full border-t border-dashed border-neutral-300 relative flex justify-between items-center px-2">
                <span className="text-[8px] text-neutral-400 font-mono tracking-widest">
                  ✂ --- [TEAR BAR] --- ✂
                </span>
              </div>
            </div>

            {/* Quick helper toggle */}
            <button
              type="button"
              onClick={() => setShowDeviceTips(!showDeviceTips)}
              className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{showDeviceTips ? 'Hide connection tips' : 'How does zero-popup Enter key printing work?'}</span>
            </button>

            {showDeviceTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full max-w-lg mt-2 p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs space-y-2.5 text-neutral-600 dark:text-neutral-300 shadow-md"
              >
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Fast Checkout & Zero-Popup Printing:</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p>
                    • <strong>Pair Once:</strong> Once you grant permission to your Virtual COM port (COM11) or Bluetooth (POS-58), the browser remembers it forever on this computer.
                  </p>
                  <p>
                    • <strong>Instant Enter Key:</strong> Select your preferred mode below (e.g. <strong>Virtual COM11</strong>). Whenever a bill finishes, simply press the <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono font-bold">Enter</kbd> key on your keyboard to print immediately with zero popups!
                  </p>
                  <p>
                    • <strong>Switch Mode Anytime:</strong> You can switch between Virtual COM (COM11) and Bluetooth (POS-58) by clicking the tabs below.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions: Active Method Switcher + Primary Enter Button */}
          <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shrink-0 flex flex-col gap-2.5">
            {/* Mode Selector Tabs (User chooses which connection is active) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Choose Active Auto-Print Method:</span>
                </span>
                <button
                  type="button"
                  onClick={handleForcePair}
                  className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer"
                  title="Authorize new port or repair device"
                >
                  Pair / Change Port
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
                {/* Method 1: Virtual COM (COM11) */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('serial')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeMethod === 'serial'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Virtual COM11</span>
                  {isSerialPaired && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Paired" />}
                </button>

                {/* Method 2: Bluetooth (POS-58) */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('bluetooth')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeMethod === 'bluetooth'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Bluetooth (POS-58)</span>
                  {isBtPaired && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Paired" />}
                </button>

                {/* Method 3: Windows Spooler */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('system')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeMethod === 'system'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Windows ("POS-58")</span>
                </button>
              </div>
            </div>

            {/* BIG PRIMARY AUTO-PRINT BUTTON (TRIGGERED BY ENTER KEY) */}
            <button
              type="button"
              onClick={handleOneTouchPrint}
              disabled={isPrinting}
              className={`w-full flex items-center justify-between px-4 py-3 text-white font-bold text-sm rounded-xl active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                activeMethod === 'serial'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500'
                  : activeMethod === 'bluetooth'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {activeMethod === 'serial' ? (
                  <Cpu className="w-5 h-5 shrink-0 text-neutral-950" />
                ) : activeMethod === 'bluetooth' ? (
                  <Bluetooth className="w-5 h-5 shrink-0 text-white" />
                ) : (
                  <Printer className="w-5 h-5 shrink-0" />
                )}
                <div className="text-left">
                  <div className="leading-tight">
                    {isPrinting
                      ? 'Printing Bill to YHD-5808L...'
                      : activeMethod === 'serial'
                      ? 'Print Bill to Virtual COM (COM11)'
                      : activeMethod === 'bluetooth'
                      ? 'Print Bill to POS-58 (Bluetooth)'
                      : 'Print Bill to Windows Spooler ("POS-58")'}
                  </div>
                  <div
                    className={`text-[10px] font-normal leading-tight opacity-90 ${
                      activeMethod === 'serial' ? 'text-neutral-800' : ''
                    }`}
                  >
                    Direct zero-popup print · Formatted for 58mm roll
                  </div>
                </div>
              </div>

              {/* Keyboard Enter indicator badge */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-tight shadow-xs shrink-0 ${
                  activeMethod === 'serial'
                    ? 'bg-neutral-950 text-amber-400'
                    : 'bg-white/20 text-white'
                }`}
              >
                <span>Enter</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Secondary Hardware & Platform Tools */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              {/* Direct WebUSB */}
              <button
                type="button"
                onClick={async () => {
                  setIsPrinting(true);
                  setPrintStatus('Selecting USB thermal printer (WebUSB)...');
                  const res = await printViaWebUSB(order, currentSettings, rollWidth);
                  setIsPrinting(false);
                  setPrintStatus(res.message);
                  setTimeout(() => setPrintStatus(null), 5000);
                }}
                disabled={isPrinting}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-500/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Direct USB Cable connection"
              >
                <Cable className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct USB Cable</span>
              </button>

              {/* Android: RawBT Thermal Print */}
              {device.isAndroid ? (
                <button
                  type="button"
                  onClick={handleAndroidRawBtPrint}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-500/20 text-xs font-medium transition-colors cursor-pointer"
                  title="Direct print to POS-58 via Android RawBT app"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Android RawBT</span>
                </button>
              ) : device.isIOS ? (
                /* iOS: Share to Bluetooth Printer App */
                <button
                  type="button"
                  onClick={handleShareToPrinterApp}
                  disabled={isSharing}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-500/20 text-xs font-medium transition-colors cursor-pointer"
                  title="Send receipt to iOS Bluetooth printer apps"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isSharing ? 'Preparing...' : 'Share to iOS App'}</span>
                </button>
              ) : (
                /* Desktop: Open Standalone Tab */
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors cursor-pointer"
                  title="Open in full standalone tab (outside iframe) for 1-click Windows print"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Open Full Tab</span>
                </a>
              )}

              {/* Save High-Res Receipt Image */}
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors cursor-pointer"
                title="Download 203 DPI receipt PNG image for printing or archiving"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Saving...' : 'Save PNG'}</span>
              </button>

              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-medium transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Bill</span>
              </button>
            </div>

            {/* Bottom Row: Copy Text + Next Customer */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800/60">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied plain text' : 'Copy Plain Text'}</span>
              </button>

              <button
                type="button"
                onClick={onNewSale}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-colors ml-auto shadow-xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Next Customer</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
