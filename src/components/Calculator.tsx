import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator as CalcIcon,
  Plus,
  Minus,
  Trash2,
  Percent,
  ShoppingBag,
  Delete,
  RefreshCw,
  Sparkles,
  Check,
  Printer,
  Sliders,
  DollarSign,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { CartItem, StoreSettings, CalculatorPreset, Order, Product } from '../types';
import { formatCurrency } from '../utils/printer';
import { ReceiptModal } from './ReceiptModal';

interface SelectedPresetItem {
  id: string;
  productId?: string;
  sku?: string;
  label: string;
  price: number;
  quantity: number;
  category?: string;
}

interface CalculatorProps {
  settings: StoreSettings;
  products?: Product[];
  onAddToCart: (item: CartItem) => void;
  activeCartTotal: number;
  onSaveOrder?: (orderData: any) => Promise<Order | null>;
  onNavigateToSettings?: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({
  settings,
  products = [],
  onAddToCart,
  activeCartTotal,
  onSaveOrder,
  onNavigateToSettings,
}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [customItemName, setCustomItemName] = useState('Custom Fee');
  const [justCalculated, setJustCalculated] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Selected Preset Items Accumulator
  const [selectedItems, setSelectedItems] = useState<SelectedPresetItem[]>([]);

  // Cash change calculator state
  const [cashTendered, setCashTendered] = useState<string>('');

  // In-page Receipt Preview Modal state (no page navigation required!)
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [isProcessingBill, setIsProcessingBill] = useState(false);

  // Dynamic presets configured through settings
  const presets: CalculatorPreset[] = settings.calculatorPresets || [];

  // Calculate sum of selected presets
  const selectedPresetsTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const totalItemsCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  // Combined active calculator total (presets + any manual calculator balance if not matching)
  const currentCalcValue = parseFloat(display) || 0;
  const effectiveTotal = selectedPresetsTotal > 0 ? selectedPresetsTotal : currentCalcValue;

  const cashHandedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashHandedNum - effectiveTotal);
  const isShort = cashHandedNum > 0 && cashHandedNum < effectiveTotal;
  const shortAmount = effectiveTotal - cashHandedNum;

  // Handle Preset Click with Automatic + Accumulator & Double-Click Support
  const handlePresetClick = (preset: CalculatorPreset) => {
    const matchedProduct = products.find(
      (p) =>
        (preset.productId && p.id === preset.productId) ||
        p.id === preset.id ||
        p.name.toLowerCase().trim() === preset.label.toLowerCase().trim() ||
        p.sku.toLowerCase().trim() === preset.label.toLowerCase().trim()
    );

    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === preset.id);
      let updated: SelectedPresetItem[];

      if (existingIdx > -1) {
        // If clicked again (or double-clicked), increment quantity & price automatically
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
      } else {
        // Add new item with quantity 1
        updated = [
          ...prev,
          {
            id: preset.id,
            productId: matchedProduct?.id || preset.productId,
            sku: matchedProduct?.sku,
            label: preset.label,
            price: preset.price,
            quantity: 1,
            category: preset.category || matchedProduct?.category,
          },
        ];
      }

      // Automatically recalculate and set calculator display to sum
      const newTotal = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setDisplay(String(newTotal));
      
      // Update expression to show the additive formula
      const expFormula = updated
        .map((i) => (i.quantity > 1 ? `${i.price}×${i.quantity}` : `${i.price}`))
        .join(' + ');
      setExpression(expFormula + ' =');
      setJustCalculated(true);

      return updated;
    });
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const updated = prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedPresetItem[];

      const newTotal = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setDisplay(String(newTotal));
      if (updated.length > 0) {
        const expFormula = updated
          .map((i) => (i.quantity > 1 ? `${i.price}×${i.quantity}` : `${i.price}`))
          .join(' + ');
        setExpression(expFormula + ' =');
      } else {
        setExpression('');
      }
      return updated;
    });
  };

  const handleRemoveItem = (id: string) => {
    handleUpdateItemQty(id, -9999);
  };

  const handleClearPresets = () => {
    setSelectedItems([]);
    setDisplay('0');
    setExpression('');
    setCashTendered('');
  };

  // Standard Keypad handlers with functional updaters
  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      if (justCalculated) {
        setJustCalculated(false);
        return digit === '.' ? '0.' : digit;
      }
      if (prev === '0' && digit !== '.') {
        return digit;
      }
      if (digit === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + digit;
    });
  };

  const handleOperator = (op: string) => {
    setDisplay((currentDisplay) => {
      // If user typed an operator, but hasn't entered a new number and presses another operator, replace operator
      if (expression && (currentDisplay === '0' || currentDisplay === '')) {
        setExpression((prevExp) => {
          const trimmed = prevExp.trim();
          const lastOpMatch = trimmed.match(/[+\-*/]$/);
          if (lastOpMatch) {
            return `${trimmed.slice(0, -1).trim()} ${op} `;
          }
          return `${trimmed} ${op} `;
        });
        return '0';
      }

      // If there is an existing expression, compute intermediate value
      if (expression) {
        try {
          const fullExp = expression + currentDisplay;
          const sanitized = fullExp.replace(/[^0-9+\-*/.]/g, '');
          if (sanitized) {
            // eslint-disable-next-line no-eval
            const intermediate = Function(`'use strict'; return (${sanitized})`)();
            const rounded = Math.round(Number(intermediate) * 100) / 100;
            setExpression(`${rounded} ${op} `);
            return '0';
          }
        } catch {
          // fallback
        }
      }

      setExpression(`${currentDisplay} ${op} `);
      return '0';
    });
    setJustCalculated(false);
  };

  const handleEquals = () => {
    setDisplay((currentDisplay) => {
      try {
        const fullExp = expression + currentDisplay;
        const sanitized = fullExp.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return currentDisplay;
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        const rounded = Math.round(Number(result) * 100) / 100;
        setExpression('');
        setJustCalculated(true);
        return String(rounded);
      } catch {
        setExpression('');
        setJustCalculated(true);
        return 'Error';
      }
    });
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setSelectedItems([]);
    setCashTendered('');
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error') {
        return '0';
      }
      return prev.slice(0, -1);
    });
  };

  const handlePercent = () => {
    setDisplay((prev) => {
      const val = parseFloat(prev);
      if (!isNaN(val)) {
        return String(val / 100);
      }
      return prev;
    });
  };

  const handleDiscountQuick = (percent: number) => {
    const base = parseFloat(display) || effectiveTotal;
    const discounted = base - (base * percent) / 100;
    setDisplay(String(Math.round(discounted * 100) / 100));
    setJustCalculated(true);
  };

  const handleAddCustomToCart = () => {
    const amount = parseFloat(display);
    if (isNaN(amount) || amount <= 0) return;

    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim() || 'Custom Boutique Charge',
      sku: 'DF-CUSTOM',
      category: 'Services',
      unitPrice: amount,
      quantity: 1,
      isCustomItem: true,
    };

    onAddToCart(customItem);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  // Keyboard Event Listener: Allows using laptop / desktop physical number keyboard & USB numpads
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      // If in-page receipt modal is open, don't capture calculator keys
      if (previewOrder) return;

      if (isInput) {
        // If typing in the cash input and hits Enter, proceed to print bill
        if (e.key === 'Enter') {
          e.preventDefault();
          if (effectiveTotal > 0) {
            handlePrintBill();
          }
        }
        return;
      }

      const key = e.key;
      const code = e.code || '';

      // Digits (0-9 from top row or numeric keypad)
      if (/^[0-9]$/.test(key) || (code.startsWith('Numpad') && /^[0-9]$/.test(code.slice(6)))) {
        e.preventDefault();
        const digit = /^[0-9]$/.test(key) ? key : code.slice(6);
        handleDigit(digit);
      } else if (key === '.' || key === ',' || code === 'NumpadDecimal') {
        e.preventDefault();
        handleDigit('.');
      } else if (key === '+' || code === 'NumpadAdd') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-' || code === 'NumpadSubtract') {
        e.preventDefault();
        handleOperator('-');
      } else if (key === '*' || key.toLowerCase() === 'x' || code === 'NumpadMultiply') {
        e.preventDefault();
        handleOperator('*');
      } else if (key === '/' || code === 'NumpadDivide') {
        e.preventDefault();
        handleOperator('/');
      } else if (key === 'Enter' || key === '=' || code === 'NumpadEnter') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key.toLowerCase() === 'c' || key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (key === '%') {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOrder, effectiveTotal, expression, justCalculated]);

  // Direct Print Bill & Popup Preview inside Calculator (No page navigation!)
  const handlePrintBill = async () => {
    if (effectiveTotal <= 0 || isProcessingBill) return;

    setIsProcessingBill(true);

    try {
      // Build cart items array from selected presets
      let billItems: CartItem[] = [];

      if (selectedItems.length > 0) {
        billItems = selectedItems.map((item) => {
          const matched = products.find(
            (p) =>
              (item.productId && p.id === item.productId) ||
              p.id === item.id ||
              p.name.toLowerCase().trim() === item.label.toLowerCase().trim() ||
              (item.sku && p.sku.toLowerCase().trim() === item.sku.toLowerCase().trim())
          );
          return {
            id: `fee-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            productId: matched?.id || item.productId,
            name: item.label,
            sku: matched?.sku || item.sku || 'DF-PRESET',
            category: item.category || matched?.category || 'Services',
            unitPrice: item.price,
            quantity: item.quantity,
            isCustomItem: !matched,
          };
        });
      } else {
        billItems = [
          {
            id: `fee-calc-${Date.now()}`,
            name: customItemName.trim() || 'Custom Alteration / Fee',
            sku: 'DF-CUSTOM',
            category: 'Services',
            unitPrice: effectiveTotal,
            quantity: 1,
            isCustomItem: true,
          },
        ];
      }

      const orderPayload = {
        items: billItems,
        subtotal: effectiveTotal,
        discountAmount: 0,
        discountPercent: 0,
        taxAmount: 0,
        taxPercent: 0,
        total: effectiveTotal,
        paymentMethod: 'cash' as const,
        tenderedAmount: cashHandedNum >= effectiveTotal ? cashHandedNum : effectiveTotal,
        changeAmount: changeDue,
        customer: {
          name: 'Direct Counter / Alteration',
        },
        cashierName: settings.cashierName || 'Cashier 01',
      };

      let createdOrder: Order | null = null;

      if (onSaveOrder) {
        createdOrder = await onSaveOrder(orderPayload);
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
        createdOrder = await res.json();
      }

      if (createdOrder) {
        // Open the in-page receipt modal immediately
        setPreviewOrder(createdOrder);
      }
    } catch (err) {
      console.error('Error generating bill:', err);
    } finally {
      setIsProcessingBill(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto pb-12">
      {/* LEFT: Calculator Display & Keypad */}
      <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <CalcIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">POS Real-Time Calculator</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded border border-neutral-200 dark:border-neutral-700">
                  ⌨ Keyboard ready
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Type with number keys or click presets to accumulate prices automatically
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-neutral-200 dark:border-transparent"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 mb-4 text-right flex flex-col justify-end min-h-[105px] shadow-inner transition-colors">
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 min-h-[1.25rem] tracking-wider overflow-hidden text-ellipsis">
            {expression || ' '}
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-neutral-900 dark:text-white tracking-tight break-all">
            {display}
          </div>
          {selectedItems.length > 0 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} accumulated in sum
            </div>
          )}
        </div>

        {/* Quick Discount Presets */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Quick Percentage Discount:</span>
            {effectiveTotal > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                Total: {formatCurrency(effectiveTotal, settings.currencySymbol)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 50].map((pct) => (
              <button
                key={pct}
                onClick={() => handleDiscountQuick(pct)}
                className="py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 active:scale-95 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700/60 transition-all text-center cursor-pointer"
              >
                -{pct}% Off
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          <button
            onClick={handleClear}
            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-500/20 active:scale-95 transition-all text-sm cursor-pointer"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all flex items-center justify-center text-sm cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={handlePercent}
            className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all text-sm cursor-pointer"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('/')}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/25 active:scale-95 transition-all text-base cursor-pointer"
          >
            ÷
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n)}
              className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleOperator('*')}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/25 active:scale-95 transition-all text-base cursor-pointer"
          >
            ×
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n)}
              className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/25 active:scale-95 transition-all text-base cursor-pointer"
          >
            −
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n)}
              className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleOperator('+')}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/25 active:scale-95 transition-all text-base cursor-pointer"
          >
            +
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            onClick={() => handleDigit('00')}
            className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            00
          </button>
          <button
            onClick={() => handleDigit('.')}
            className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg rounded-xl border border-neutral-200 dark:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="p-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xl rounded-xl active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            =
          </button>
        </div>

        {/* Add custom calculated item directly to main POS Register cart */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-2.5 items-stretch">
          <input
            type="text"
            value={customItemName}
            onChange={(e) => setCustomItemName(e.target.value)}
            placeholder="Custom Item / Service Name"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 placeholder-neutral-400 dark:placeholder-neutral-600 transition-colors"
          />
          <button
            onClick={handleAddCustomToCart}
            disabled={effectiveTotal <= 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-40 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white font-semibold text-xs rounded-xl active:scale-95 transition-all shrink-0 border border-neutral-300 dark:border-neutral-700 cursor-pointer"
          >
            {addedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sent to Register!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>Add to Main Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Presets & Real-Time Tender & Change Section */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Customizable Presets Section (Managed through Settings) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Configured Presets</h3>
            </div>
            {onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="text-xs text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Customize presets in Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize in Settings</span>
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Click an item to add; click again to automatically add (+) into previous price.
          </p>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const selectedItem = selectedItems.find((i) => i.id === preset.id);
              const qty = selectedItem?.quantity || 0;

              const matchedProduct = products.find(
                (p) =>
                  (preset.productId && p.id === preset.productId) ||
                  p.id === preset.id ||
                  p.name.toLowerCase().trim() === preset.label.toLowerCase().trim() ||
                  (p.sku && p.sku.toLowerCase().trim() === preset.label.toLowerCase().trim())
              );
              const currentStock = matchedProduct ? matchedProduct.stock : undefined;

              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className={`p-3 rounded-xl text-left transition-all relative border active:scale-[0.98] group cursor-pointer flex flex-col justify-between ${
                    qty > 0
                      ? 'bg-amber-500/15 border-amber-500/50 text-neutral-950 dark:text-white shadow-sm'
                      : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {/* Quantity badge if selected */}
                  {qty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-extrabold flex items-center justify-center shadow">
                      {qty}
                    </span>
                  )}

                  <div>
                    <div className="text-xs font-semibold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {preset.label}
                    </div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                      {formatCurrency(preset.price, settings.currencySymbol)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/50 text-[10px]">
                    <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
                      {preset.category || 'Preset'}
                    </span>
                    {currentStock !== undefined && (
                      <span
                        className={`font-mono font-medium tabular-nums ${
                          currentStock <= 0
                            ? 'text-red-500 font-bold'
                            : currentStock <= 5
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {currentStock <= 0
                          ? 'Out of Stock'
                          : qty > 0
                          ? `Stock: ${currentStock - qty}`
                          : `Stock: ${currentStock}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {presets.length === 0 && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-800 text-center">
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">No presets configured</p>
              <p className="text-[11px] text-neutral-500 mt-1 mb-2">
                Add alteration or tailoring presets in the Settings section.
              </p>
              {onNavigateToSettings && (
                <button
                  onClick={onNavigateToSettings}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Open Settings to Add Presets
                </button>
              )}
            </div>
          )}

          {/* Selected Items Breakdown List */}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                <span>Selected Fees Breakdown ({totalItemsCount} pcs):</span>
                <button
                  onClick={handleClearPresets}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-[11px] cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-neutral-900 dark:text-white truncate">{item.label}</div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {item.quantity} × {formatCurrency(item.price, settings.currencySymbol)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                      <div className="flex items-center bg-neutral-200 dark:bg-neutral-800 rounded p-0.5">
                        <button
                          onClick={() => handleUpdateItemQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-bold text-neutral-900 dark:text-white text-[11px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateItemQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Tender & Change Section with Direct Print Bill Button */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Real-Time Tender & Change</h3>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Total of Selected Items */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  Total of Selected Items
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono tabular-nums mt-0.5">
                  {formatCurrency(effectiveTotal, settings.currencySymbol)}
                </div>
              </div>
              <div className="text-right text-[11px] text-neutral-500">
                {selectedItems.length > 0 ? `${totalItemsCount} fee items` : 'Keypad total'}
              </div>
            </div>

            {/* Customer Handover Cash Input */}
            <div>
              <div className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-300 mb-1.5">
                <label className="font-medium">Customer Handover Cash:</label>
                {effectiveTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashTendered(String(effectiveTotal))}
                    className="text-[11px] text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Exact Amount
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="Enter cash given by customer..."
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-3.5 py-2.5 text-base font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 tabular-nums placeholder-neutral-400 dark:placeholder-neutral-600 transition-colors"
                />
              </div>

              {/* Quick Bill Cash Shortcuts */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(String(amt))}
                    className="py-1.5 px-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700/60 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* How Many Should Given (Change to Return) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isShort
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : cashHandedNum >= effectiveTotal && effectiveTotal > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold opacity-80">
                    {isShort ? 'Remaining Due (Short)' : 'How Many Should Given (Change)'}
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-0.5">
                    {isShort
                      ? formatCurrency(shortAmount, settings.currencySymbol)
                      : formatCurrency(changeDue, settings.currencySymbol)}
                  </div>
                </div>

                {cashHandedNum >= effectiveTotal && effectiveTotal > 0 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready to Print</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIRECT PRINT BILL BUTTON (Popup Preview, No page navigation!) */}
          <div className="mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handlePrintBill}
              disabled={effectiveTotal <= 0 || isProcessingBill}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-40 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-xl cursor-pointer"
            >
              <Printer className="w-4 h-4 text-neutral-950" />
              <span>
                {isProcessingBill
                  ? 'Generating Bill...'
                  : `Print Bill (${formatCurrency(effectiveTotal, settings.currencySymbol)})`}
              </span>
            </button>
            <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400 mt-2">
              Opens instant bill preview with terminal printer and Bluetooth print options
            </p>
          </div>
        </div>
      </div>

      {/* In-Page Receipt Modal Preview (No navigation to other pages required!) */}
      {previewOrder && (
        <ReceiptModal
          order={previewOrder}
          settings={settings}
          onClose={() => setPreviewOrder(null)}
          onNewSale={() => {
            setPreviewOrder(null);
            handleClearPresets();
          }}
        />
      )}
    </div>
  );
};
