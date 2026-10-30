import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Printer,
  Database,
  Save,
  Check,
  RefreshCw,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  X,
  Cable,
  Bluetooth,
  Cpu,
} from 'lucide-react';
import { StoreSettings, DBStatus, CalculatorPreset, Product, Order } from '../types';
import {
  printReceiptViaBrowser,
  formatCurrency,
  createSampleTestOrder,
  printViaWebUSB,
  printViaBluetooth,
  printViaWebSerial,
  PrinterManager,
  PrintMethod,
} from '../utils/printer';
import { ThermalReceipt } from './ThermalReceipt';

interface SettingsViewProps {
  settings: StoreSettings;
  products?: Product[];
  dbStatus: DBStatus | null;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onReseedData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  products = [],
  dbStatus,
  onUpdateSettings,
  onReseedData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  // Presets management state
  const [presets, setPresets] = useState<CalculatorPreset[]>(settings.calculatorPresets || []);
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetForm, setPresetForm] = useState({
    label: '',
    price: '',
    category: 'Alterations',
    productId: '',
  });

  useEffect(() => {
    setFormData(settings);
    if (settings.calculatorPresets) {
      setPresets(settings.calculatorPresets);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        ...formData,
        calculatorPresets: presets,
      };
      await onUpdateSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const [testOrder, setTestOrder] = useState<Order | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [preferredMethod, setPreferredMethod] = useState<PrintMethod>(() => PrinterManager.getPreferredMethod());
  const [baudRate, setBaudRate] = useState<number>(() => PrinterManager.getBaudRate());

  const handleTestPrint = () => {
    const sample = createSampleTestOrder(formData);
    setTestOrder(sample);
    setTimeout(() => {
      const res = printReceiptViaBrowser('thermal-receipt-printable', formData.receiptWidth || '58mm');
      if (!res.success && res.message) {
        setTestStatus(res.message);
        setTimeout(() => setTestStatus(null), 5000);
      }
    }, 50);
  };

  const handleTestUsbPrint = async () => {
    const sample = createSampleTestOrder(formData);
    setTestStatus('Connecting to USB thermal printer (WebUSB)...');
    const res = await printViaWebUSB(sample, formData, formData.receiptWidth || '58mm');
    setTestStatus(res.message);
    setTimeout(() => setTestStatus(null), 6000);
  };

  const handleTestBtPrint = async () => {
    const sample = createSampleTestOrder(formData);
    setTestStatus('Scanning for Bluetooth thermal printer...');
    const res = await printViaBluetooth(sample, formData, formData.receiptWidth || '58mm');
    setTestStatus(res.message);
    setTimeout(() => setTestStatus(null), 6000);
  };

  const handleTestSerialPrint = async () => {
    const sample = createSampleTestOrder(formData);
    setTestStatus('Connecting to Virtual COM Port (e.g. COM11)...');
    const res = await printViaWebSerial(sample, formData, formData.receiptWidth || '58mm', 9600);
    setTestStatus(res.message);
    setTimeout(() => setTestStatus(null), 6000);
  };

  const handleReseed = async () => {
    if (confirm('Reseed catalog with default Deneth Fashion boutique inventory?')) {
      setIsReseeding(true);
      await onReseedData();
      setIsReseeding(false);
    }
  };

  // Preset Handlers
  const handleOpenAddPreset = () => {
    setEditingPresetId(null);
    setPresetForm({
      label: '',
      price: '',
      category: 'Alterations',
      productId: '',
    });
    setIsAddPresetModalOpen(true);
  };

  const handleOpenEditPreset = (preset: CalculatorPreset) => {
    setEditingPresetId(preset.id);
    setPresetForm({
      label: preset.label,
      price: String(preset.price),
      category: preset.category || 'Alterations',
      productId: preset.productId || '',
    });
    setIsAddPresetModalOpen(true);
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetForm.label.trim() || !presetForm.price) return;

    const priceNum = parseFloat(presetForm.price) || 0;
    let updatedList: CalculatorPreset[];

    if (editingPresetId) {
      updatedList = presets.map((p) =>
        p.id === editingPresetId
          ? {
              ...p,
              label: presetForm.label.trim(),
              price: priceNum,
              category: presetForm.category.trim() || 'Services',
              productId: presetForm.productId ? presetForm.productId : undefined,
            }
          : p
      );
    } else {
      const newPreset: CalculatorPreset = {
        id: `preset-${Date.now()}`,
        label: presetForm.label.trim(),
        price: priceNum,
        category: presetForm.category.trim() || 'Services',
        productId: presetForm.productId ? presetForm.productId : undefined,
      };
      updatedList = [...presets, newPreset];
    }

    setPresets(updatedList);
    setFormData((prev) => ({ ...prev, calculatorPresets: updatedList }));
    setIsAddPresetModalOpen(false);

    // Auto-save presets to settings
    try {
      await onUpdateSettings({ calculatorPresets: updatedList });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAddProductPreset = async (product: Product) => {
    // Check if preset already exists for this product
    if (presets.some((p) => p.productId === product.id || p.label.toLowerCase() === product.name.toLowerCase())) {
      alert(`"${product.name}" is already configured in presets.`);
      return;
    }

    const newPreset: CalculatorPreset = {
      id: `preset-${Date.now()}`,
      label: product.name,
      price: product.price,
      category: product.category,
      productId: product.id,
    };

    const updatedList = [...presets, newPreset];
    setPresets(updatedList);
    setFormData((prev) => ({ ...prev, calculatorPresets: updatedList }));

    try {
      await onUpdateSettings({ calculatorPresets: updatedList });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePreset = async (id: string) => {
    const updatedList = presets.filter((p) => p.id !== id);
    setPresets(updatedList);
    setFormData((prev) => ({ ...prev, calculatorPresets: updatedList }));
    try {
      await onUpdateSettings({ calculatorPresets: updatedList });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDefaultPresets = async () => {
    const defaultList: CalculatorPreset[] = [
      { id: 'preset-1', label: 'Pant Hemming', price: 600, category: 'Alterations', productId: 'prod-alt-1' },
      { id: 'preset-2', label: 'Waist Alteration', price: 850, category: 'Alterations', productId: 'prod-alt-2' },
      { id: 'preset-3', label: 'Luxury Gift Box', price: 450, category: 'Packaging', productId: 'prod-pkg-1' },
      { id: 'preset-4', label: 'Custom Monogram', price: 1200, category: 'Services', productId: 'prod-emb-1' },
      { id: 'preset-5', label: 'Express Tailoring', price: 1500, category: 'Services', productId: 'prod-srv-1' },
      { id: 'preset-6', label: 'Rush Fitting Fee', price: 500, category: 'Services', productId: 'prod-srv-2' },
    ];
    setPresets(defaultList);
    setFormData((prev) => ({ ...prev, calculatorPresets: defaultList }));
    await onUpdateSettings({ calculatorPresets: defaultList });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">POS Configuration & Hardware Settings</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Store branding, fee presets customization, portable printer format, and MongoDB persistence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Settings Saved!</span>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Presets Customization Section (Requested by User) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Calculator & Fee Presets</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Items configured here appear in the Presets section of Calculator & Fees
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultPresets}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleOpenAddPreset}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preset Item</span>
              </button>
            </div>
          </div>

          {/* Quick Add from Inventory Section */}
          {products.length > 0 && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                  Quick Link from Product Inventory
                </span>
                <span className="text-[11px] text-neutral-500">
                  Select any catalog product to immediately create a synchronized one-tap preset in Calculator
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      handleQuickAddProductPreset(prod);
                      e.target.value = '';
                    }
                  }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="" disabled>
                    + Pick product to add as preset...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formData.currencySymbol} {p.price.toLocaleString()} · Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Presets List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => {
              const matchedProduct = products.find(
                (p) =>
                  (preset.productId && p.id === preset.productId) ||
                  p.id === preset.id ||
                  p.name.toLowerCase().trim() === preset.label.toLowerCase().trim() ||
                  (p.sku && p.sku.toLowerCase().trim() === preset.label.toLowerCase().trim())
              );

              return (
                <div
                  key={preset.id}
                  className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {preset.label}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                        {formatCurrency(preset.price, formData.currencySymbol)}
                      </span>
                      {preset.category && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                          · {preset.category}
                        </span>
                      )}
                    </div>
                    {matchedProduct ? (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">Syncs with stock: {matchedProduct.stock} pcs</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Custom service fee
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPreset(preset)}
                      className="p-1.5 text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 bg-neutral-200/60 dark:bg-neutral-900 rounded-lg cursor-pointer"
                      title="Edit preset"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 bg-neutral-200/60 dark:bg-neutral-900 rounded-lg cursor-pointer"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {presets.length === 0 && (
              <div className="col-span-full py-8 text-center bg-neutral-50 dark:bg-neutral-950 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                <Sparkles className="w-6 h-6 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">No presets added yet</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Click "Add Preset Item" or select an inventory product to configure presets.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <Store className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Deneth Fashion Store Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="Rs."
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Default Cashier Name</label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={formData.receiptFooterMessage}
              onChange={(e) => setFormData({ ...formData, receiptFooterMessage: e.target.value })}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Portable Terminal Printer Setup */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Portable Terminal Thermal Printer</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleTestSerialPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Test Virtual COM Port (COM11)"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Test COM11</span>
              </button>
              <button
                type="button"
                onClick={handleTestUsbPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Test plugged USB thermal printer via direct WebUSB"
              >
                <Cable className="w-3.5 h-3.5" />
                <span>Test USB Cable</span>
              </button>
              <button
                type="button"
                onClick={handleTestBtPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Test Bluetooth thermal printer"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Test Bluetooth</span>
              </button>
              <button
                type="button"
                onClick={handleTestPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 rounded-lg border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
                title="Test via system printer driver"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>System Spooler</span>
              </button>
            </div>
          </div>

          {testStatus && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <Printer className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
              <span>{testStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Paper Width Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptWidth: '58mm' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                    formData.receiptWidth === '58mm'
                      ? 'bg-amber-500/15 border-amber-500/50 text-neutral-900 dark:text-white shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  <div className="font-bold text-neutral-900 dark:text-white">58mm (2-Inch)</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Portable Bluetooth mini roll (MPT-II, POS-58, GOOJPRT)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptWidth: '80mm' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                    formData.receiptWidth === '80mm'
                      ? 'bg-amber-500/15 border-amber-500/50 text-neutral-900 dark:text-white shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  <div className="font-bold text-neutral-900 dark:text-white">80mm (3-Inch)</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Standard desktop thermal roll (Epson, Sunmi, Xprinter)
                  </div>
                </button>
              </div>
            </div>

            {/* Active Auto-Print Mode Selection & Baud Rate */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Default Auto-Print Method (Triggered by Enter key)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredMethod('serial');
                      PrinterManager.setPreferredMethod('serial');
                    }}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      preferredMethod === 'serial'
                        ? 'bg-amber-500/15 border-amber-500/50 text-neutral-900 dark:text-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-neutral-900 dark:text-white">
                      <Cpu className="w-3.5 h-3.5 text-amber-500" />
                      <span>COM11 Serial</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Direct Virtual COM
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreferredMethod('bluetooth');
                      PrinterManager.setPreferredMethod('bluetooth');
                    }}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      preferredMethod === 'bluetooth'
                        ? 'bg-blue-500/15 border-blue-500/50 text-neutral-900 dark:text-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-neutral-900 dark:text-white">
                      <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
                      <span>Bluetooth</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      POS-58 Wireless
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreferredMethod('system');
                      PrinterManager.setPreferredMethod('system');
                    }}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      preferredMethod === 'system'
                        ? 'bg-neutral-900/10 dark:bg-neutral-700/30 border-neutral-400 text-neutral-900 dark:text-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-neutral-900 dark:text-white">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Windows Spooler</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      POS-58 Driver
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Virtual COM Baud Rate (Default 9600 for YHD-5808L)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={baudRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setBaudRate(rate);
                      PrinterManager.setBaudRate(rate);
                    }}
                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value={9600}>9600 (Standard YHD-5808L / POS-58)</option>
                    <option value={115200}>115200 (High Speed)</option>
                    <option value={38400}>38400</option>
                    <option value={19200}>19200</option>
                  </select>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Auto-reconnects to COM11 without dialog popups.
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Printing Guide */}
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Multi-Device One Printer Compatibility</span>
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                <li><strong className="text-neutral-900 dark:text-neutral-200">iPhone / iPad:</strong> Tap "Print Bill" to route via AirPrint or Bluetooth print app with zero driver installation.</li>
                <li><strong className="text-neutral-900 dark:text-neutral-200">Android:</strong> Supports both Browser Print service and direct Web Bluetooth ESC/POS pairing.</li>
                <li><strong className="text-neutral-900 dark:text-neutral-200">Laptop / Desktop:</strong> USB thermal or Bluetooth wireless printing with standard ESC/POS paper cutting.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* MongoDB Backend Status & Cloud Persistence */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">MongoDB Backend Architecture</h3>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                dbStatus?.mode === 'mongodb'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
              }`}
            >
              {dbStatus?.mode === 'mongodb' ? 'Connected to MongoDB Atlas' : 'Embedded MongoDB Store (Active)'}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-xs space-y-2">
            <p className="text-neutral-700 dark:text-neutral-300">
              The POS backend is engineered with dual-engine persistence:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="font-semibold text-neutral-900 dark:text-white mb-1">Local / AI Studio Environment</div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Automatically persists products and orders in an ACID-safe JSON collection file. Zero configuration required to test and run.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="font-semibold text-neutral-900 dark:text-white mb-1">Vercel / Cloud Deployment</div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Add <code className="text-amber-600 dark:text-amber-400 font-mono">MONGODB_URI</code> to your Vercel Project Environment Variables to sync live across all staff devices.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReseed}
              disabled={isReseeding}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
              <span>Reseed Deneth Fashion Catalog</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Add / Edit Preset Modal */}
      <AnimatePresence>
        {isAddPresetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl max-w-md w-full p-5 shadow-2xl my-auto transition-colors"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {editingPresetId ? 'Edit Fee Preset' : 'Add New Fee Preset'}
                </h3>
                <button
                  onClick={() => setIsAddPresetModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePreset} className="space-y-4">
                {products.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Link to Inventory Product (Optional)
                    </label>
                    <select
                      value={presetForm.productId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const matched = products.find((p) => p.id === selectedId);
                        if (matched) {
                          setPresetForm({
                            ...presetForm,
                            productId: matched.id,
                            label: matched.name,
                            price: String(matched.price),
                            category: matched.category,
                          });
                        } else {
                          setPresetForm({
                            ...presetForm,
                            productId: '',
                          });
                        }
                      }}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- No linked product (Independent custom fee) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock} pcs · {formData.currencySymbol} {p.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Linking a product guarantees its stock count automatically decreases when checked out via Calculator.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Preset Label / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={presetForm.label}
                    onChange={(e) => setPresetForm({ ...presetForm, label: e.target.value })}
                    placeholder="e.g. Pant Hemming, Custom Stitching"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Price ({formData.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={presetForm.price}
                    onChange={(e) => setPresetForm({ ...presetForm, price: e.target.value })}
                    placeholder="e.g. 600"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 tabular-nums transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={presetForm.category}
                    onChange={(e) => setPresetForm({ ...presetForm, category: e.target.value })}
                    placeholder="e.g. Alterations, Packaging, Tailoring"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsAddPresetModalOpen(false)}
                    className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    {editingPresetId ? 'Save Changes' : 'Add Preset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden test receipt rendered for test printing */}
      {testOrder && (
        <div className="hidden print:block">
          <ThermalReceipt order={testOrder} settings={formData} />
        </div>
      )}
    </div>
  );
};
