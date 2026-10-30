/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator as CalcIcon,
  Package,
  Users,
  Receipt,
  Settings as SettingsIcon,
  Printer,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { Product, CartItem, Order, StoreSettings, DBStatus, Employee } from './types';
import { Calculator } from './components/Calculator';
import { ProductManager } from './components/ProductManager';
import { EmployeeManager } from './components/EmployeeManager';
import { OrderHistory } from './components/OrderHistory';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { ThermalReceipt } from './components/ThermalReceipt';
import { formatCurrency } from './utils/printer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'products' | 'employees' | 'orders' | 'settings'>('calculator');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'Deneth Fashion',
    tagline: 'Contemporary Apparel & Boutique Collection',
    address: '142 Galle Road, Colombo 03, Sri Lanka',
    phone: '+94 77 123 4567 / +94 11 234 5678',
    email: 'denethfashion@gmail.com',
    currency: 'LKR',
    currencySymbol: 'Rs.',
    taxRatePercent: 0,
    receiptFooterMessage: 'Thank you for shopping at Deneth Fashion! Exchange within 7 days with bill.',
    receiptWidth: '58mm',
    enableSound: true,
    cashierName: 'Cashier 01',
    calculatorPresets: [
      { id: 'preset-1', label: 'Pant Hemming', price: 600, category: 'Alterations', productId: 'prod-alt-1' },
      { id: 'preset-2', label: 'Waist Alteration', price: 850, category: 'Alterations', productId: 'prod-alt-2' },
      { id: 'preset-3', label: 'Luxury Gift Box', price: 450, category: 'Packaging', productId: 'prod-pkg-1' },
      { id: 'preset-4', label: 'Custom Monogram', price: 1200, category: 'Embroidery', productId: 'prod-emb-1' },
      { id: 'preset-5', label: 'Express Tailoring', price: 1500, category: 'Services', productId: 'prod-srv-1' },
      { id: 'preset-6', label: 'Rush Fitting Fee', price: 500, category: 'Services', productId: 'prod-srv-2' },
    ],
  });
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Theme state: light vs dark
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('df_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('df_theme', nextTheme);
    } catch {}
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Fetch initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, ordersRes, settingsRes, statusRes, empRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => null),
        fetch('/api/orders').then((r) => r.json()).catch(() => null),
        fetch('/api/settings').then((r) => r.json()).catch(() => null),
        fetch('/api/status').then((r) => r.json()).catch(() => null),
        fetch('/api/employees').then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(prodRes) && prodRes.length > 0) {
        setProducts(prodRes);
        localStorage.setItem('df_cached_products', JSON.stringify(prodRes));
      } else {
        const cached = localStorage.getItem('df_cached_products');
        if (cached) setProducts(JSON.parse(cached));
      }

      if (Array.isArray(ordersRes)) {
        setOrders(ordersRes);
        localStorage.setItem('df_cached_orders', JSON.stringify(ordersRes));
      } else {
        const cached = localStorage.getItem('df_cached_orders');
        if (cached) setOrders(JSON.parse(cached));
      }

      if (Array.isArray(empRes) && empRes.length > 0) {
        setEmployees(empRes);
        localStorage.setItem('df_cached_employees', JSON.stringify(empRes));
      } else {
        const cached = localStorage.getItem('df_cached_employees');
        if (cached) setEmployees(JSON.parse(cached));
      }

      if (settingsRes && !settingsRes.error) {
        setSettings(settingsRes);
      }
      if (statusRes && !statusRes.error) {
        setDbStatus(statusRes);
      }
    } catch (err) {
      console.warn('API error, using cached state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Product Handlers
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const created = await res.json();
      if (created.id) {
        setProducts((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      if (updated.id) {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Employee Handlers
  const handleAddEmployee = async (empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData),
      });
      const created = await res.json();
      if (created.id) {
        setEmployees((prev) => [created, ...prev]);
        localStorage.setItem('df_cached_employees', JSON.stringify([created, ...employees]));
      }
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      if (updated.id) {
        setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      }
    } catch (err) {
      console.error('Error updating employee:', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  // Order Handlers
  const handleCompleteSale = async (orderPayload: any): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const newOrder = await res.json();
      if (newOrder.id) {
        setOrders((prev) => [newOrder, ...prev]);
        setActiveReceiptOrder(newOrder);

        // Optimistically deduct stock counts in local products state immediately
        setProducts((prev) => {
          let updated = [...prev];
          for (const item of newOrder.items || []) {
            const qty = Number(item.quantity) || 1;
            const prodIdx = updated.findIndex(
              (p) =>
                (item.productId && p.id === item.productId) ||
                p.id === item.id ||
                p.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim() ||
                (item.sku && p.sku.toLowerCase().trim() === item.sku.toLowerCase().trim())
            );

            if (prodIdx > -1) {
              const currentStock = updated[prodIdx].stock;
              const newStock = Math.max(0, currentStock - qty);
              updated[prodIdx] = {
                ...updated[prodIdx],
                stock: newStock,
                updatedAt: new Date().toISOString(),
              };
            }
          }
          try {
            localStorage.setItem('df_cached_products', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // Re-fetch fresh products list from server to ensure complete sync
        fetch('/api/products')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setProducts(data);
              try {
                localStorage.setItem('df_cached_products', JSON.stringify(data));
              } catch {}
            }
          })
          .catch(() => {});

        return newOrder;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
    return null;
  };

  const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const updated = await res.json();
      if (updated) {
        setSettings(updated);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleReseedData = async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadAllData();
    } catch (err) {
      console.error('Reseed error:', err);
    }
  };

  const handleAddToCartFromCalculator = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className={`min-h-screen bg-stone-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-200 ${settings.receiptWidth === '80mm' ? 'printer-width-80mm' : ''}`}>
      {/* Main App Container */}
      <div id="app-root-shell" className="flex-1 flex flex-col no-print">
        {/* Top Bar Contract (Strict 3-zone layout) */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Official Brand Logo & Wordmark (Prominent & Clear) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('calculator')}
                className="flex items-center gap-2.5 text-left group py-1"
                aria-label="Deneth Fashion Home"
              >
                <img
                  src="/assets/aistudio/Fauget_Clothing_Mark_Stylist_Logo_-removebg-preview-Picsart-AiImageEnhancer_e92e9ecb.png"
                  alt="Deneth Fashion"
                  className="h-14 sm:h-16 md:h-18 w-auto max-w-[240px] object-contain logo-adaptive transition-transform group-hover:scale-105"
                />
              </button>
            </div>

            {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'calculator'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Calculator & Billing
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'products'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Products & Stock
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'employees'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'orders'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Past Bills & Reports
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'settings'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Terminal Settings
              </button>
            </nav>

            {/* Zone 3: 1 Primary Action & Theme Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle light and dark theme"
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300/80 dark:hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-700" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('calculator')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Bill</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8">
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-white">Loading Deneth Fashion POS...</p>
            </div>
          ) : (
            <>
              {activeTab === 'calculator' && (
                <Calculator
                  settings={settings}
                  products={products}
                  onAddToCart={handleAddToCartFromCalculator}
                  activeCartTotal={cartTotal}
                  onSaveOrder={handleCompleteSale}
                  onNavigateToSettings={() => setActiveTab('settings')}
                />
              )}

              {activeTab === 'products' && (
                <ProductManager
                  products={products}
                  settings={settings}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {activeTab === 'employees' && (
                <EmployeeManager
                  employees={employees}
                  settings={settings}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              )}

              {activeTab === 'orders' && (
                <OrderHistory
                  orders={orders}
                  settings={settings}
                  onSelectOrder={(order) => setActiveReceiptOrder(order)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  products={products}
                  dbStatus={dbStatus}
                  onUpdateSettings={handleUpdateSettings}
                  onReseedData={handleReseedData}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (optimized for iPhone / Android touch with light & dark mode) */}
        <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around px-2 z-40 transition-colors shadow-lg">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
              activeTab === 'calculator'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CalcIcon className="w-4 h-4 mb-1" />
            <span>Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 mb-1" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
              activeTab === 'employees'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mb-1" />
            <span>Employees</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 mb-1" />
            <span>Bills</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <SettingsIcon className="w-4 h-4 mb-1" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Bill Completed Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          settings={settings}
          onClose={() => setActiveReceiptOrder(null)}
          onNewSale={() => {
            setActiveReceiptOrder(null);
            setCart([]);
            setActiveTab('calculator');
          }}
        />
      )}
    </div>
  );
}
