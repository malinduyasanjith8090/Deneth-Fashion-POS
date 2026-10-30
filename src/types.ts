export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image?: string;
  barcode?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // product id or custom item id
  productId?: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  image?: string;
  discountPercent?: number; // item discount %
  isCustomItem?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. DF-10024
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'qr_pay';
  tenderedAmount: number;
  changeAmount: number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  cashierName: string;
  note?: string;
  status: 'completed' | 'refunded' | 'void';
  createdAt: string;
}

export interface CalculatorPreset {
  id: string;
  label: string;
  price: number;
  category?: string;
  productId?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  nic: string; // National Identity Card (NIC) number
  phone: string;
  email?: string;
  address: string;
  role: string; // e.g. Cashier, Store Manager, Tailor / Alterations, Sales Associate
  salary: number; // Monthly basic salary
  joinDate: string;
  status: 'active' | 'on_leave' | 'inactive';
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  receiptFooterMessage: string;
  receiptWidth: '58mm' | '80mm';
  enableSound: boolean;
  cashierName: string;
  calculatorPresets?: CalculatorPreset[];
}

export interface DBStatus {
  mode: 'mongodb' | 'embedded';
  connected: boolean;
  uri?: string;
  dbName?: string;
  productsCount: number;
  ordersCount: number;
  employeesCount?: number;
}
