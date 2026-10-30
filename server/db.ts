import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { Product, Order, StoreSettings, DBStatus, Employee, CalculatorPreset } from '../src/types';

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'deneth_pos.json');

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    fullName: 'Deneth Yasanjith',
    nic: '199418204910',
    phone: '+94 77 123 4567',
    email: 'deneth@fashion.lk',
    address: '142 Galle Road, Colombo 03',
    role: 'Store Manager & Head Tailor',
    salary: 85000,
    joinDate: '2023-01-15',
    status: 'active',
    emergencyContact: '+94 77 987 6543 (Brother)',
    notes: 'Founder & master tailor. Oversees store operations and bespoke alterations.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    fullName: 'Kaveesha Fernando',
    nic: '199854201132',
    phone: '+94 71 892 3410',
    email: 'kaveesha.f@denethfashion.com',
    address: '45/2 Station Road, Dehiwala',
    role: 'Senior Cashier & POS Lead',
    salary: 55000,
    joinDate: '2023-08-01',
    status: 'active',
    emergencyContact: '+94 71 223 9940 (Mother)',
    notes: 'Handles POS billing, terminal receipt printing, and daily cash closing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    fullName: 'Chamari Perera',
    nic: '199187309924',
    phone: '+94 76 430 8129',
    email: 'chamari.p@denethfashion.com',
    address: '78 Highlevel Road, Nugegoda',
    role: 'Alterations & Hemming Specialist',
    salary: 62000,
    joinDate: '2024-02-10',
    status: 'active',
    emergencyContact: '+94 76 908 1120 (Husband)',
    notes: 'Expert in trouser hemming, waist alterations, and custom garment fitting.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    fullName: 'Sandun Silva',
    nic: '200109403819',
    phone: '+94 72 319 4022',
    email: 'sandun.s@denethfashion.com',
    address: '12 Cross Street, Moratuwa',
    role: 'Fashion Sales Associate',
    salary: 48000,
    joinDate: '2024-06-20',
    status: 'active',
    emergencyContact: '+94 72 884 1029 (Father)',
    notes: 'Assists customers with boutique collections, size recommendations, and trials.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_PRESETS: CalculatorPreset[] = [
  { id: 'preset-1', label: 'Pant Hemming', price: 600, category: 'Alterations', productId: 'prod-alt-1' },
  { id: 'preset-2', label: 'Waist Alteration', price: 850, category: 'Alterations', productId: 'prod-alt-2' },
  { id: 'preset-3', label: 'Luxury Gift Box', price: 450, category: 'Packaging', productId: 'prod-pkg-1' },
  { id: 'preset-4', label: 'Custom Monogram', price: 1200, category: 'Services', productId: 'prod-emb-1' },
  { id: 'preset-5', label: 'Express Tailoring', price: 1500, category: 'Services', productId: 'prod-srv-1' },
  { id: 'preset-6', label: 'Rush Fitting Fee', price: 500, category: 'Services', productId: 'prod-srv-2' },
];

const DEFAULT_SETTINGS: StoreSettings = {
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
  calculatorPresets: DEFAULT_PRESETS,
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'DF-MSH-01',
    name: "Classic Relaxed Linen Shirt - Cream White",
    category: 'Shirts',
    price: 4800,
    costPrice: 2800,
    stock: 24,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Cream White', 'Beige', 'Sage'],
    image: '/src/assets/images/deneth_linen_shirt_1792783696168.jpg',
    barcode: '2001001',
    description: '100% pure organic breathable linen with camp collar and pearl buttons.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sku: 'DF-WDR-05',
    name: 'Emerald Silk Evening Midi Dress',
    category: 'Dresses',
    price: 8900,
    costPrice: 5200,
    stock: 12,
    sizes: ['S', 'M', 'L'],
    colors: ['Emerald Green', 'Black', 'Wine'],
    image: '/src/assets/images/deneth_silk_dress_1792783696613.jpg',
    barcode: '2001002',
    description: 'High-waisted tailored silhouette with satin silk drape and belted waist.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    sku: 'DF-MTR-02',
    name: 'Tailored Cotton Chino Trousers - Beige',
    category: 'Trousers',
    price: 5400,
    costPrice: 3100,
    stock: 18,
    sizes: ['30', '32', '34', '36'],
    colors: ['Beige', 'Navy', 'Olive'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001003',
    description: 'Comfort stretch cotton twill with tapered leg and reinforced stitching.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    sku: 'DF-MPL-09',
    name: 'Textured Knit Luxury Polo Shirt - Navy',
    category: 'Polos',
    price: 3900,
    costPrice: 2200,
    stock: 30,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Navy Blue', 'Off-White', 'Rust'],
    image: '/src/assets/images/deneth_polo_tee_1792783697096.jpg',
    barcode: '2001004',
    description: 'Waffle textured breathable cotton knit with ribbed collar and placket.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    sku: 'DF-MSH-07',
    name: 'Italian Oxford Button-Down Shirt',
    category: 'Shirts',
    price: 4500,
    costPrice: 2600,
    stock: 20,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Sky Blue', 'White', 'Pink'],
    image: '/src/assets/images/deneth_linen_shirt_1792783696168.jpg',
    barcode: '2001005',
    description: 'Crisp pinpoint oxford weave tailored for smart casual workwear.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    sku: 'DF-ACC-01',
    name: 'Artisan Braided Leather Belt - Cognac',
    category: 'Accessories',
    price: 2200,
    costPrice: 1100,
    stock: 35,
    sizes: ['One Size'],
    colors: ['Cognac Brown', 'Dark Brown', 'Black'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001006',
    description: 'Full-grain genuine hand-braided leather belt with solid brass buckle.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    sku: 'DF-WDR-08',
    name: 'Pastel Floral Linen Wrap Dress',
    category: 'Dresses',
    price: 6700,
    costPrice: 3800,
    stock: 15,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Pastel Blue', 'Lavender'],
    image: '/src/assets/images/deneth_silk_dress_1792783696613.jpg',
    barcode: '2001007',
    description: 'Flattering wrap waistline with flared flutter hem and side-tie sash.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    sku: 'DF-ACC-04',
    name: 'Deneth Boutique Heavy Canvas Shopper Tote',
    category: 'Accessories',
    price: 1800,
    costPrice: 900,
    stock: 40,
    sizes: ['One Size'],
    colors: ['Natural Ecru', 'Charcoal'],
    image: '/src/assets/images/deneth_polo_tee_1792783697096.jpg',
    barcode: '2001008',
    description: 'Heavyweight organic cotton tote with double straps and interior zip pocket.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-alt-1',
    sku: 'DF-ALT-01',
    name: 'Pant Hemming',
    category: 'Alterations',
    price: 600,
    costPrice: 200,
    stock: 50,
    sizes: ['Standard'],
    colors: ['Universal'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001009',
    description: 'Precision trouser and denim length shortening with reinforced hem stitching.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-alt-2',
    sku: 'DF-ALT-02',
    name: 'Waist Alteration',
    category: 'Alterations',
    price: 850,
    costPrice: 250,
    stock: 40,
    sizes: ['Standard'],
    colors: ['Universal'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001010',
    description: 'Custom trouser waist taking in or letting out for ideal waist fitting.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pkg-1',
    sku: 'DF-PKG-01',
    name: 'Luxury Gift Box',
    category: 'Packaging',
    price: 450,
    costPrice: 150,
    stock: 60,
    sizes: ['One Size'],
    colors: ['Gold / Black'],
    image: '/src/assets/images/deneth_linen_shirt_1792783696168.jpg',
    barcode: '2001011',
    description: 'Signature Deneth Fashion embossed luxury gift box with satin ribbon wrap.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-emb-1',
    sku: 'DF-EMB-01',
    name: 'Custom Monogram',
    category: 'Services',
    price: 1200,
    costPrice: 400,
    stock: 30,
    sizes: ['Custom'],
    colors: ['Gold', 'Silver', 'Navy'],
    image: '/src/assets/images/deneth_linen_shirt_1792783696168.jpg',
    barcode: '2001012',
    description: 'Bespoke embroidered initials on cuffs, collar, or pocket.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-srv-1',
    sku: 'DF-SRV-01',
    name: 'Express Tailoring',
    category: 'Services',
    price: 1500,
    costPrice: 500,
    stock: 25,
    sizes: ['Standard'],
    colors: ['Standard'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001013',
    description: 'Same-day rush tailoring and custom adjustments turnaround guarantee.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-srv-2',
    sku: 'DF-SRV-02',
    name: 'Rush Fitting Fee',
    category: 'Services',
    price: 500,
    costPrice: 150,
    stock: 35,
    sizes: ['Standard'],
    colors: ['Standard'],
    image: '/src/assets/images/deneth_casual_pants_1792783697455.jpg',
    barcode: '2001014',
    description: 'Priority fitting room styling consultation and immediate measurements.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class DatabaseManager {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private isConnectedToMongo = false;
  private memoryData: {
    products: Product[];
    orders: Order[];
    settings: StoreSettings;
    employees: Employee[];
  } = {
    products: [],
    orders: [],
    settings: DEFAULT_SETTINGS,
    employees: [],
  };

  constructor() {
    this.initLocalStore();
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        let productsList: Product[] = parsed.products || INITIAL_PRODUCTS;

        // Ensure all default preset products exist in the catalog
        for (const initP of INITIAL_PRODUCTS) {
          if (!productsList.some(p => p.id === initP.id || p.name.toLowerCase().trim() === initP.name.toLowerCase().trim())) {
            productsList.push(initP);
          }
        }

        const currentPresets: CalculatorPreset[] = parsed.settings?.calculatorPresets && parsed.settings.calculatorPresets.length > 0
          ? parsed.settings.calculatorPresets
          : DEFAULT_PRESETS;

        // Ensure presets have productId attached if matching product exists
        const enrichedPresets = currentPresets.map((pr: CalculatorPreset) => {
          if (pr.productId) return pr;
          const match = productsList.find(p => p.id === pr.id || p.name.toLowerCase().trim() === pr.label.toLowerCase().trim());
          return match ? { ...pr, productId: match.id } : pr;
        });

        this.memoryData = {
          products: productsList,
          orders: parsed.orders || [],
          employees: (parsed.employees && parsed.employees.length > 0) ? parsed.employees : INITIAL_EMPLOYEES,
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
            calculatorPresets: enrichedPresets,
          },
        };
        this.persistLocalStore();
      } else {
        this.memoryData = {
          products: INITIAL_PRODUCTS,
          orders: [],
          employees: INITIAL_EMPLOYEES,
          settings: DEFAULT_SETTINGS,
        };
        this.persistLocalStore();
      }
    } catch (err) {
      console.warn('Error reading local data file, falling back to initial data:', err);
      this.memoryData = {
        products: INITIAL_PRODUCTS,
        orders: [],
        employees: INITIAL_EMPLOYEES,
        settings: DEFAULT_SETTINGS,
      };
    }
  }

  private persistLocalStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to local data file:', err);
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnectedToMongo && this.mongoClient) {
      return;
    }

    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      console.log('⚡ No MONGODB_URI provided. Running on embedded persistent storage engine (MongoDB compatible).');
      return;
    }

    try {
      console.log('Connecting to MongoDB cluster...');
      this.mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await this.mongoClient.connect();
      this.db = this.mongoClient.db('deneth_pos');
      this.isConnectedToMongo = true;
      console.log('✅ Connected to MongoDB database: deneth_pos');

      const productsCollection = this.db.collection<Product>('products');
      const count = await productsCollection.countDocuments();
      if (count === 0) {
        console.log('Seeding initial products into MongoDB...');
        await productsCollection.insertMany(INITIAL_PRODUCTS as any);
        await this.db.collection('settings').insertOne({ ...DEFAULT_SETTINGS, id: 'global_settings' } as any);
      } else {
        // Ensure all initial preset items (alterations, packaging, etc.) exist in MongoDB
        for (const initP of INITIAL_PRODUCTS) {
          const exists = await productsCollection.findOne({
            $or: [{ id: initP.id }, { name: initP.name }],
          });
          if (!exists) {
            await productsCollection.insertOne(initP as any);
          }
        }
      }

      const employeesCollection = this.db.collection<Employee>('employees');
      const empCount = await employeesCollection.countDocuments();
      if (empCount === 0) {
        console.log('Seeding initial employees into MongoDB...');
        await employeesCollection.insertMany(INITIAL_EMPLOYEES as any);
      }
    } catch (err) {
      console.error('⚠️ MongoDB connection attempt failed. Falling back to persistent storage:', (err as Error).message);
      this.isConnectedToMongo = false;
      this.mongoClient = null;
      this.db = null;
    }
  }

  public async getStatus(): Promise<DBStatus> {
    const products = await this.getProducts();
    const orders = await this.getOrders();
    const employees = await this.getEmployees();
    return {
      mode: this.isConnectedToMongo ? 'mongodb' : 'embedded',
      connected: true,
      uri: process.env.MONGODB_URI ? 'Configured (MongoDB Atlas / Cluster)' : undefined,
      dbName: 'deneth_pos',
      productsCount: products.length,
      ordersCount: orders.length,
      employeesCount: employees.length,
    };
  }

  public async getProducts(): Promise<Product[]> {
    if (this.isConnectedToMongo && this.db) {
      try {
        const docs = await this.db.collection<Product>('products').find().toArray();
        return docs.map(d => {
          const { _id, ...rest } = d as any;
          return { id: rest.id || _id.toString(), ...rest };
        });
      } catch (err) {
        console.warn('MongoDB query error, returning memory fallback:', err);
      }
    }
    return this.memoryData.products;
  }

  public async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id || p.sku === id || p.barcode === id) || null;
  }

  public async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('products').insertOne(newProduct as any);
      } catch (err) {
        console.error('MongoDB insert error:', err);
      }
    }

    this.memoryData.products.unshift(newProduct);
    this.persistLocalStore();
    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt: now };

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('products').updateOne(
          { id },
          { $set: updatedFields }
        );
      } catch (err) {
        console.error('MongoDB update error:', err);
      }
    }

    const index = this.memoryData.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.memoryData.products[index] = {
        ...this.memoryData.products[index],
        ...updatedFields,
      };
      this.persistLocalStore();
      return this.memoryData.products[index];
    }
    return null;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('products').deleteOne({ id });
      } catch (err) {
        console.error('MongoDB delete error:', err);
      }
    }

    const initialLen = this.memoryData.products.length;
    this.memoryData.products = this.memoryData.products.filter(p => p.id !== id);
    this.persistLocalStore();
    return this.memoryData.products.length < initialLen;
  }

  public async getOrders(): Promise<Order[]> {
    if (this.isConnectedToMongo && this.db) {
      try {
        const docs = await this.db.collection<Order>('orders').find().sort({ createdAt: -1 }).toArray();
        return docs.map(d => {
          const { _id, ...rest } = d as any;
          return { id: rest.id || _id.toString(), ...rest };
        });
      } catch (err) {
        console.warn('MongoDB query error for orders:', err);
      }
    }
    return [...this.memoryData.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async addOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DF-${randomSuffix}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${timestamp}`,
      orderNumber,
      createdAt: dateStr,
    };

    // Auto deduct inventory stock for all sold items (catalog products, presets & fees)
    for (const item of newOrder.items) {
      const qtyToDeduct = Number(item.quantity) || 1;
      let product: Product | null = null;

      if (item.productId) {
        product = await this.getProductById(item.productId);
      }
      if (!product && item.name) {
        const allProducts = await this.getProducts();
        product = allProducts.find(
          p => p.id === item.id ||
               p.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
               (item.sku && p.sku.toLowerCase().trim() === item.sku.toLowerCase().trim())
        ) || null;
      }

      if (product) {
        const newStock = Math.max(0, product.stock - qtyToDeduct);
        await this.updateProduct(product.id, { stock: newStock });
      } else if (item.name && item.unitPrice !== undefined) {
        // Preset item not yet in catalog: auto-add with tracked baseline stock and deduct sold count
        const initialStock = 50;
        const newStock = Math.max(0, initialStock - qtyToDeduct);
        await this.addProduct({
          name: item.name,
          category: item.category || 'Services',
          price: Number(item.unitPrice) || 0,
          stock: newStock,
          sku: item.sku && item.sku !== 'DF-CUSTOM' && item.sku !== 'DF-FEE' ? item.sku : `DF-PR-${Date.now().toString().slice(-4)}`,
          sizes: ['Standard'],
          colors: ['Default'],
          image: '/src/assets/images/deneth_linen_shirt_1792783696168.jpg',
          description: `Boutique preset service/product: ${item.name}`,
        });
      }
    }

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('orders').insertOne(newOrder as any);
      } catch (err) {
        console.error('MongoDB insert order error:', err);
      }
    }

    this.memoryData.orders.unshift(newOrder);
    this.persistLocalStore();
    return newOrder;
  }

  public async getSettings(): Promise<StoreSettings> {
    if (this.isConnectedToMongo && this.db) {
      try {
        const doc = await this.db.collection('settings').findOne({ id: 'global_settings' });
        if (doc) {
          const { _id, id, ...rest } = doc as any;
          return { ...DEFAULT_SETTINGS, ...rest };
        }
      } catch (err) {
        console.warn('MongoDB get settings error:', err);
      }
    }
    return this.memoryData.settings;
  }

  public async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('settings').updateOne(
          { id: 'global_settings' },
          { $set: updated },
          { upsert: true }
        );
      } catch (err) {
        console.error('MongoDB update settings error:', err);
      }
    }

    this.memoryData.settings = updated;
    this.persistLocalStore();
    return updated;
  }

  public async getEmployees(): Promise<Employee[]> {
    if (this.isConnectedToMongo && this.db) {
      try {
        const docs = await this.db.collection<Employee>('employees').find().toArray();
        if (docs.length > 0) {
          return docs.map(d => {
            const { _id, ...rest } = d as any;
            return { id: rest.id || _id.toString(), ...rest };
          });
        }
        await this.db.collection('employees').insertMany(INITIAL_EMPLOYEES as any);
        return INITIAL_EMPLOYEES;
      } catch (err) {
        console.warn('MongoDB query error for employees:', err);
      }
    }
    return this.memoryData.employees || [];
  }

  public async getEmployeeById(id: string): Promise<Employee | null> {
    const list = await this.getEmployees();
    return list.find(e => e.id === id || e.nic === id) || null;
  }

  public async addEmployee(empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const newEmp: Employee = {
      ...empData,
      id: 'emp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('employees').insertOne(newEmp as any);
      } catch (err) {
        console.error('MongoDB insert employee error:', err);
      }
    }

    if (!this.memoryData.employees) this.memoryData.employees = [];
    this.memoryData.employees.unshift(newEmp);
    this.persistLocalStore();
    return newEmp;
  }

  public async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt: now };

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('employees').updateOne(
          { id },
          { $set: updatedFields }
        );
      } catch (err) {
        console.error('MongoDB update employee error:', err);
      }
    }

    const index = this.memoryData.employees.findIndex(e => e.id === id);
    if (index !== -1) {
      this.memoryData.employees[index] = {
        ...this.memoryData.employees[index],
        ...updatedFields,
      };
      this.persistLocalStore();
      return this.memoryData.employees[index];
    }
    return null;
  }

  public async deleteEmployee(id: string): Promise<boolean> {
    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('employees').deleteOne({ id });
      } catch (err) {
        console.error('MongoDB delete employee error:', err);
      }
    }

    const initialLen = this.memoryData.employees.length;
    this.memoryData.employees = this.memoryData.employees.filter(e => e.id !== id);
    this.persistLocalStore();
    return this.memoryData.employees.length < initialLen;
  }

  public async seedDefault(): Promise<void> {
    this.memoryData.products = [...INITIAL_PRODUCTS];
    this.memoryData.orders = [];
    this.memoryData.employees = [...INITIAL_EMPLOYEES];
    this.memoryData.settings = { ...DEFAULT_SETTINGS };
    this.persistLocalStore();

    if (this.isConnectedToMongo && this.db) {
      try {
        await this.db.collection('products').deleteMany({});
        await this.db.collection('products').insertMany(INITIAL_PRODUCTS as any);
        await this.db.collection('employees').deleteMany({});
        await this.db.collection('employees').insertMany(INITIAL_EMPLOYEES as any);
        await this.db.collection('settings').updateOne(
          { id: 'global_settings' },
          { $set: DEFAULT_SETTINGS },
          { upsert: true }
        );
      } catch (err) {
        console.error('MongoDB reseed error:', err);
      }
    }
  }
}

export const dbManager = new DatabaseManager();
