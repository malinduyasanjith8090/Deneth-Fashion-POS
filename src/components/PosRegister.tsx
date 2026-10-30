import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  User,
  Phone,
  Tag,
  CheckCircle,
  Receipt,
  Scan,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Product, CartItem, Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils/printer';

interface PosRegisterProps {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCompleteSale: (orderData: any) => Promise<Order | null>;
  onOpenCalculator: () => void;
}

export const PosRegister: React.FC<PosRegisterProps> = ({
  products,
  settings,
  cart,
  setCart,
  onCompleteSale,
  onOpenCalculator,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size: string; color: string }>>({});
  
  // Checkout & Customer state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'qr_pay'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Shirts', 'Dresses', 'Trousers', 'Polos', 'Accessories'];

  // Initialize default sizes & colors for products
  useEffect(() => {
    const initialMap: Record<string, { size: string; color: string }> = {};
    products.forEach((p) => {
      initialMap[p.id] = {
        size: p.sizes?.[0] || 'Standard',
        color: p.colors?.[0] || 'Default',
      };
    });
    setSelectedVariants((prev) => ({ ...initialMap, ...prev }));
  }, [products]);

  // Barcode / SKU Hardware Scanner Listener
  useEffect(() => {
    let scannedBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        scannedBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (scannedBuffer.length >= 3) {
          const matched = products.find(
            (p) =>
              p.barcode?.toLowerCase() === scannedBuffer.toLowerCase() ||
              p.sku.toLowerCase() === scannedBuffer.toLowerCase()
          );
          if (matched) {
            handleAddToCart(matched);
            scannedBuffer = '';
          }
        }
      } else if (e.key.length === 1) {
        scannedBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        size,
      },
    }));
  };

  const handleSelectColor = (productId: string, color: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        color,
      },
    }));
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const variant = selectedVariants[product.id] || {
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Default',
    };

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === variant.size &&
          item.selectedColor === variant.color
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        if (newQty <= product.stock) {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${variant.size}-${variant.color}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: product.price,
          quantity: 1,
          selectedSize: variant.size,
          selectedColor: variant.color,
          image: product.image,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setTenderedAmount('');
    setCustomerName('');
    setCustomerPhone('');
  };

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((discountedSubtotal * settings.taxRatePercent) / 100);
  const grandTotal = discountedSubtotal + taxAmount;

  const currentTenderedNum =
    paymentMethod === 'cash'
      ? parseFloat(tenderedAmount) || grandTotal
      : grandTotal;
  const changeDue = Math.max(0, currentTenderedNum - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        items: cart,
        subtotal,
        discountAmount,
        discountPercent,
        taxAmount,
        taxPercent: settings.taxRatePercent,
        total: grandTotal,
        paymentMethod,
        tenderedAmount: currentTenderedNum,
        changeAmount: changeDue,
        customer: {
          name: customerName.trim() || undefined,
          phone: customerPhone.trim() || undefined,
        },
        cashierName: settings.cashierName || 'Cashier 01',
      };

      const result = await onCompleteSale(orderPayload);
      if (result) {
        handleClearCart();
        setIsMobileCartOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const totalCartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto pb-16">
      {/* LEFT: Product Catalog & Search (lg:col-span-8 or 7) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {/* Top Controls: Search & Category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search garments, SKU, or scan barcode..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const currentVariant = selectedVariants[product.id] || {
              size: product.sizes?.[0] || 'Standard',
              color: product.colors?.[0] || 'Default',
            };
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="bg-neutral-900 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-700 transition-all group"
              >
                {/* Product Photo or Clean Boutique Tag Header */}
                {product.image ? (
                  <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-950/80 backdrop-blur-md text-neutral-300 font-medium">
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-md ${
                          product.stock > 5
                            ? 'bg-neutral-950/80 text-neutral-300'
                            : product.stock > 0
                            ? 'bg-amber-950/90 text-amber-400'
                            : 'bg-red-950/90 text-red-400'
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} pcs` : 'Sold out'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-950/60 border-b border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Tag className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
                        {product.category}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-medium ${
                        product.stock > 5
                          ? 'bg-neutral-800 text-neutral-300'
                          : product.stock > 0
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {product.stock > 0 ? `${product.stock} pcs` : 'Sold out'}
                    </span>
                  </div>
                )}

                {/* Details & Variant selection */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">{product.sku}</div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 mb-2">
                      {product.name}
                    </h3>

                    {/* Sizes Selection */}
                    {product.sizes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mb-2.5">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => handleSelectSize(product.id, size)}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                              currentVariant.size === size
                                ? 'bg-amber-500 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white tabular-nums">
                        {formatCurrency(product.price, settings.currencySymbol)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-semibold text-xs rounded-xl active:scale-95 transition-all shadow-sm shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Order Register (Desktop Sidebar) */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
        <div className="sticky top-20 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
          {/* Cart Header */}
          <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Current Register</h2>
              <span className="text-xs text-neutral-400">· {totalCartItemsCount} items</span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    {item.selectedColor && <span>· {item.selectedColor}</span>}
                    {item.isCustomItem && <span className="text-amber-400 font-medium">Custom Fee</span>}
                  </div>
                  <div className="text-neutral-300 font-mono tabular-nums mt-0.5">
                    {formatCurrency(item.unitPrice, settings.currencySymbol)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 border border-neutral-700">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-neutral-500 flex flex-col items-center">
                <Receipt className="w-8 h-8 stroke-1 text-neutral-600 mb-2" />
                <p className="text-xs font-medium text-neutral-400">Cart is empty</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Click apparel cards or use the real-time calculator to add fees
                </p>
                <button
                  onClick={onOpenCalculator}
                  className="mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Open Alteration / Service Calculator</span>
                </button>
              </div>
            )}
          </div>

          {/* Checkout Controls & Financials */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/95 space-y-3 shrink-0">
              {/* Customer details input */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile (WhatsApp)"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cart Discount:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        discountPercent === pct
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'qr_pay', label: 'QR Pay', icon: QrCode },
                  { id: 'bank_transfer', label: 'Bank', icon: Building },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash tendered & change calculation (if cash chosen) */}
              {paymentMethod === 'cash' && (
                <div className="space-y-1.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Cash Handed:</span>
                    <input
                      type="number"
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      placeholder={grandTotal.toString()}
                      className="w-28 text-right bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {currentTenderedNum >= grandTotal && changeDue > 0 && (
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                      <span>Change Due:</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(changeDue, settings.currencySymbol)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs pt-1 border-t border-neutral-800">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-mono">{formatCurrency(subtotal, settings.currencySymbol)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Discount ({discountPercent}%):</span>
                    <span className="tabular-nums font-mono text-emerald-400">
                      -{formatCurrency(discountAmount, settings.currencySymbol)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-neutral-800">
                  <span>Grand Total:</span>
                  <span className="text-amber-400 font-mono tabular-nums">
                    {formatCurrency(grandTotal, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Primary Complete & Print CTA */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 text-neutral-950" />
                <span>{isSubmitting ? 'Processing Bill...' : 'Charge & Print Thermal Bill'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM BAR / DRAWER (for iPhone / Android screens) */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 p-3 z-30 pointer-events-none">
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-sm shadow">
                {totalCartItemsCount}
              </div>
              <div>
                <div className="text-[10px] text-neutral-400">Total Payable</div>
                <div className="text-sm font-bold text-white font-mono tabular-nums">
                  {formatCurrency(grandTotal, settings.currencySymbol)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md"
            >
              <span>View Cart & Bill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Mobile Cart Sheet Modal */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Sheet Header */}
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Cart & Checkout ({totalCartItemsCount})</h3>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        {item.selectedSize && `Size: ${item.selectedSize}`} · {formatCurrency(item.unitPrice, settings.currencySymbol)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-0.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-white"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Checkout Footer */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-900 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile / WhatsApp"
                    className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>Grand Total:</span>
                  <span className="text-amber-400 font-mono tabular-nums">
                    {formatCurrency(grandTotal, settings.currencySymbol)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95"
                >
                  {isSubmitting ? 'Processing Bill...' : 'Charge & Print Thermal Bill'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
