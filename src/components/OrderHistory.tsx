import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Banknote,
  Download,
  Filter,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils/printer';

interface OrderHistoryProps {
  orders: Order[];
  settings: StoreSettings;
  onSelectOrder: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  settings,
  onSelectOrder,
}) => {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

  // Extract available unique months from orders
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();

    // Always include current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthKey);

    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthsSet.add(monthKey);
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [orders]);

  // Format month key YYYY-MM into friendly string (e.g. "October 2026")
  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter orders by search, payment method, and selected entire month
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Month filter
      if (selectedMonth !== 'all') {
        const d = new Date(o.createdAt);
        const orderMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (orderMonthKey !== selectedMonth) {
          return false;
        }
      }

      // Search query
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        new Date(o.createdAt).toLocaleDateString().includes(q);

      // Payment method
      const matchesMethod =
        filterMethod === 'all' || o.paymentMethod.toLowerCase() === filterMethod.toLowerCase();

      return matchesSearch && matchesMethod;
    });
  }, [orders, selectedMonth, search, filterMethod]);

  // Summary Metrics based on filtered month
  const totalSalesRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  const totalItemsSold = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
  }, [filteredOrders]);

  const averageTicket = useMemo(() => {
    return filteredOrders.length > 0 ? totalSalesRevenue / filteredOrders.length : 0;
  }, [filteredOrders, totalSalesRevenue]);

  // Payment Breakdown for the month
  const paymentBreakdown = useMemo(() => {
    const stats: Record<string, number> = { cash: 0, card: 0, qr_pay: 0, bank_transfer: 0 };
    filteredOrders.forEach((o) => {
      if (stats[o.paymentMethod] !== undefined) {
        stats[o.paymentMethod] += o.total;
      }
    });
    return stats;
  }, [filteredOrders]);

  // Export filtered bills to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = [
      'Invoice #',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Items Count',
      'Items Description',
      'Payment Method',
      'Subtotal',
      'Tax',
      'Total',
      'Cashier',
    ];

    const rows = filteredOrders.map((o) => {
      const d = new Date(o.createdAt);
      const dateStr = d.toISOString().slice(0, 10);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const itemsDesc = o.items.map((i) => `${i.name} (x${i.quantity})`).join('; ');
      const totalCount = o.items.reduce((s, i) => s + i.quantity, 0);

      return [
        `"${o.orderNumber}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${o.customer?.name || 'Walk-in'}"`,
        `"${o.customer?.phone || ''}"`,
        totalCount,
        `"${itemsDesc}"`,
        `"${o.paymentMethod}"`,
        o.subtotal,
        o.taxAmount,
        o.total,
        `"${o.cashierName}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `deneth_fashion_sales_${selectedMonth !== 'all' ? selectedMonth : 'all_months'}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Month Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              {selectedMonth === 'all'
                ? 'All Past Bills & Sales Reports'
                : `${formatMonthName(selectedMonth)} Bills & Monthly Report`}
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">· {filteredOrders.length} Invoices</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            View daily invoices, filter by entire calendar month, analyze revenue, and reprint bills
          </p>
        </div>

        {/* Month Selector Filter & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                All Months / All Time
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-40 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Export Month CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {selectedMonth === 'all' ? 'Total Revenue' : `${formatMonthName(selectedMonth)} Revenue`}
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
              {formatCurrency(totalSalesRevenue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>{filteredOrders.length} Paid Bills</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Garments / Items Sold</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
              {totalItemsSold} pcs
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              {selectedMonth === 'all' ? 'All historical sales' : `During ${formatMonthName(selectedMonth)}`}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Average Bill Size</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
              {formatCurrency(averageTicket, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Per customer receipt
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex flex-col justify-between transition-colors">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">Payment Method Split</div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
              <span>Cash:</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {formatCurrency(paymentBreakdown.cash, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
              <span>Card / Digital:</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {formatCurrency(
                  paymentBreakdown.card + paymentBreakdown.qr_pay + paymentBreakdown.bank_transfer,
                  settings.currencySymbol
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Method & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date (YYYY-MM-DD), invoice #, customer name, or phone..."
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-sm">
          {['all', 'cash', 'card', 'qr_pay', 'bank_transfer'].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap cursor-pointer ${
                filterMethod === m
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table with Dedicated Date & Time Columns */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/90 text-neutral-600 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Time</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items / Description</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5 text-center">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
              {filteredOrders.map((order) => {
                const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
                const orderDate = new Date(order.createdAt);
                const dateFormatted = !isNaN(orderDate.getTime())
                  ? orderDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A';
                const timeFormatted = !isNaN(orderDate.getTime())
                  ? orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'N/A';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="px-4 py-3.5 font-bold font-mono text-neutral-900 dark:text-white whitespace-nowrap">
                      #{order.orderNumber}
                    </td>

                    {/* Dedicated Date Column */}
                    <td className="px-4 py-3.5 font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap font-mono">
                      {dateFormatted}
                    </td>

                    {/* Dedicated Time Column */}
                    <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                      {timeFormatted}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {order.customer?.name || 'Walk-in Customer'}
                      </div>
                      {order.customer?.phone && (
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                          {order.customer.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-neutral-800 dark:text-neutral-300">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                      <div className="text-[10px] text-neutral-500 truncate max-w-[160px]">
                        {order.items.map((i) => i.name).join(', ')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 font-medium">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-neutral-900 dark:text-white font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(order.total, settings.currencySymbol)}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 border border-neutral-200 dark:border-transparent rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-neutral-500">
                    <Receipt className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      No invoices found for {selectedMonth === 'all' ? 'this query' : formatMonthName(selectedMonth)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Completed bills in this calendar month will appear here with detailed date, revenue, and reprint controls.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
