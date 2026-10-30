import React from 'react';
import { Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils/printer';

interface ThermalReceiptProps {
  order: Order;
  settings: StoreSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, settings }) => {
  const is80mm = settings.receiptWidth === '80mm';

  return (
    <div
      id="thermal-receipt-printable"
      data-width={is80mm ? '80mm' : '58mm'}
      className={`mx-auto bg-white text-black p-3.5 font-mono-receipt text-[11px] leading-tight select-text ${
        is80mm ? 'printer-width-80mm w-[80mm] max-w-[80mm]' : 'w-[58mm] max-w-[58mm]'
      }`}
    >
      {/* Brand Header */}
      <div className="text-center pb-2 flex flex-col items-center">
        <img
          src="/assets/aistudio/Fauget_Clothing_Mark_Stylist_Logo_-removebg-preview-Picsart-AiImageEnhancer_e92e9ecb.png"
          alt="Deneth Fashion"
          className="w-44 sm:w-48 max-w-[90%] h-auto max-h-24 object-contain mx-auto mb-1.5 grayscale contrast-150"
        />
        <p className="text-[10px] text-neutral-600 tracking-tight mt-0.5">
          {settings.tagline}
        </p>
        <p className="text-[10px] text-neutral-800 mt-0.5 leading-snug">
          {settings.address}
        </p>
        <p className="text-[10px] text-neutral-800">
          Tel: {settings.phone}
        </p>
      </div>

      <div className="border-t border-dashed border-neutral-700 my-1.5" />

      {/* Bill Meta */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span className="font-bold">INVOICE: #{order.orderNumber}</span>
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Cashier: {order.cashierName}</span>
          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {order.customer?.name && (
          <div className="pt-0.5 flex justify-between">
            <span className="text-neutral-600">Customer:</span>
            <span className="font-semibold">{order.customer.name}</span>
          </div>
        )}
        {order.customer?.phone && (
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>Phone:</span>
            <span>{order.customer.phone}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-neutral-700 my-1.5" />

      {/* Column Headers */}
      <div className="flex justify-between text-[10px] font-bold pb-1 uppercase">
        <span className="w-1/2">Item Description</span>
        <span className="w-1/6 text-center">Qty</span>
        <span className="w-1/3 text-right">Price</span>
      </div>

      <div className="border-t border-dotted border-neutral-400 my-1" />

      {/* Items List - Single Price Display (Never Doubled) */}
      <div className="space-y-1.5 text-[10.5px]">
        {order.items.map((item, idx) => {
          const variant = [item.selectedSize, item.selectedColor].filter(Boolean).join('/');
          const lineTotal = item.quantity * item.unitPrice;

          return (
            <div key={idx} className="leading-tight">
              <div className="font-medium text-neutral-900 break-words">
                {item.name}
                {variant && <span className="text-[9.5px] text-neutral-600"> [{variant}]</span>}
              </div>
              <div className="flex justify-between items-center text-[10px] text-neutral-700">
                <span className="w-1/2 text-[9px] text-neutral-500 truncate">{item.sku || 'ITEM'}</span>
                <span className="w-1/6 text-center font-medium tabular-nums">
                  {item.quantity}
                </span>
                <span className="w-1/3 text-right font-semibold tabular-nums">
                  {formatCurrency(lineTotal, settings.currencySymbol)}
                </span>
              </div>
              {item.quantity > 1 && (
                <div className="text-[9px] text-neutral-500 pl-1 text-right">
                  ({item.quantity} pcs @ {formatCurrency(item.unitPrice, settings.currencySymbol)})
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-neutral-700 my-2" />

      {/* Financials & Totals */}
      <div className="space-y-0.5 text-[10.5px]">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal:</span>
          <span className="tabular-nums">{formatCurrency(order.subtotal, settings.currencySymbol)}</span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between text-neutral-700">
            <span>Discount ({order.discountPercent}%):</span>
            <span className="tabular-nums font-medium">-{formatCurrency(order.discountAmount, settings.currencySymbol)}</span>
          </div>
        )}

        {order.taxAmount > 0 && (
          <div className="flex justify-between text-neutral-700">
            <span>Govt Tax / VAT ({order.taxPercent}%):</span>
            <span className="tabular-nums">{formatCurrency(order.taxAmount, settings.currencySymbol)}</span>
          </div>
        )}

        <div className="border-t-2 border-black my-1" />

        <div className="flex justify-between text-xs font-bold py-0.5">
          <span>NET TOTAL:</span>
          <span className="text-sm font-extrabold tabular-nums">
            {formatCurrency(order.total, settings.currencySymbol)}
          </span>
        </div>

        <div className="border-t-2 border-black my-1" />

        <div className="flex justify-between text-[10px]">
          <span className="capitalize">Paid via {order.paymentMethod.replace('_', ' ')}:</span>
          <span className="tabular-nums font-semibold">{formatCurrency(order.tenderedAmount, settings.currencySymbol)}</span>
        </div>

        {order.changeAmount > 0 && (
          <div className="flex justify-between text-[10px] font-bold">
            <span>CHANGE GIVEN:</span>
            <span className="tabular-nums">{formatCurrency(order.changeAmount, settings.currencySymbol)}</span>
          </div>
        )}
      </div>

      {/* Item count & Barcode */}
      <div className="border-t border-dashed border-neutral-700 my-2" />

      <div className="text-center space-y-1.5 py-1">
        <p className="text-[10px] font-bold">
          TOTAL PCS: {order.items.reduce((s, i) => s + i.quantity, 0)}
        </p>

        {/* CSS Barcode representation */}
        <div className="flex justify-center items-center gap-[1px] h-7 my-1 px-4 overflow-hidden">
          {Array.from({ length: 44 }).map((_, i) => (
            <div
              key={i}
              className="bg-black h-full"
              style={{
                width: i % 4 === 0 ? '3px' : i % 2 === 0 ? '1.5px' : '1px',
                opacity: (i * 7) % 5 === 0 ? 0 : 1,
              }}
            />
          ))}
        </div>
        <p className="text-[9px] tracking-widest">{order.orderNumber}</p>
      </div>

      <div className="border-t border-dashed border-neutral-700 my-1.5" />

      {/* Footer Notes */}
      <div className="text-center text-[9px] leading-tight text-neutral-600 space-y-0.5 pt-1">
        <p>{settings.receiptFooterMessage}</p>
        <p className="font-semibold text-neutral-800">*** Thank You! Visit Again ***</p>
      </div>
    </div>
  );
};
