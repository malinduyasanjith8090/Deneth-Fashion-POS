import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { dbManager } from './db';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

// Health & Database Status
app.get('/api/health', async (_req: Request, res: Response) => {
  const status = await dbManager.getStatus();
  res.json({
    status: 'ok',
    app: 'Deneth Fashion POS',
    time: new Date().toISOString(),
    db: status,
  });
});

app.get('/api/status', async (_req: Request, res: Response) => {
  const status = await dbManager.getStatus();
  res.json(status);
});

// Products CRUD
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await dbManager.getProducts();
    const category = req.query.category as string | undefined;
    const search = req.query.q as string | undefined;

    let filtered = products;
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await dbManager.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { name, category, price, stock, sku, sizes, colors, image, barcode, description, costPrice } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }
    const product = await dbManager.addProduct({
      name: String(name).trim(),
      category: String(category).trim(),
      price: Number(price) || 0,
      costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
      stock: Number(stock) || 0,
      sku: sku ? String(sku).trim() : `DF-${Date.now().toString().slice(-4)}`,
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['Standard'],
      colors: Array.isArray(colors) && colors.length > 0 ? colors : ['Default'],
      image: image ? String(image).trim() : '',
      barcode: barcode ? String(barcode).trim() : undefined,
      description: description ? String(description).trim() : '',
    });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const updated = await dbManager.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const success = await dbManager.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders & Bills
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await dbManager.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { items, subtotal, discountAmount, discountPercent, taxAmount, taxPercent, total, paymentMethod, tenderedAmount, changeAmount, customer, cashierName, note } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items cannot be empty' });
    }

    const order = await dbManager.addOrder({
      items,
      subtotal: Number(subtotal) || 0,
      discountAmount: Number(discountAmount) || 0,
      discountPercent: Number(discountPercent) || 0,
      taxAmount: Number(taxAmount) || 0,
      taxPercent: Number(taxPercent) || 0,
      total: Number(total) || 0,
      paymentMethod: paymentMethod || 'cash',
      tenderedAmount: Number(tenderedAmount) || Number(total) || 0,
      changeAmount: Number(changeAmount) || 0,
      customer: customer || {},
      cashierName: cashierName || 'Cashier 01',
      note: note || '',
      status: 'completed',
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Store Settings
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await dbManager.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req: Request, res: Response) => {
  try {
    const updated = await dbManager.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employees Endpoints
app.get('/api/employees', async (_req: Request, res: Response) => {
  try {
    const employees = await dbManager.getEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await dbManager.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    const { fullName, nic, phone, email, address, role, salary, joinDate, status, emergencyContact, notes } = req.body;
    if (!fullName || !nic || !phone) {
      return res.status(400).json({ error: 'Full name, NIC number, and contact phone are required' });
    }
    const created = await dbManager.addEmployee({
      fullName: String(fullName).trim(),
      nic: String(nic).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      address: String(address || '').trim(),
      role: String(role || 'Sales Associate').trim(),
      salary: Number(salary) || 0,
      joinDate: joinDate || new Date().toISOString().slice(0, 10),
      status: status || 'active',
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const updated = await dbManager.updateEmployee(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const success = await dbManager.deleteEmployee(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reseed default data
app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    await dbManager.seedDefault();
    const products = await dbManager.getProducts();
    res.json({ message: 'Reseeded successfully', productsCount: products.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
