import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Search, Package, Sparkles, X, Check, Tag, Image as ImageIcon } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/printer';

interface ProductManagerProps {
  products: Product[];
  settings: StoreSettings;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state (no images required when adding products)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Shirts',
    price: '',
    costPrice: '',
    stock: '',
    sku: '',
    barcode: '',
    sizes: 'S, M, L, XL',
    colors: 'Black, White',
    description: '',
  });

  const categories = ['All', 'Shirts', 'Dresses', 'Trousers', 'Polos', 'Accessories'];

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Shirts',
      price: '',
      costPrice: '',
      stock: '20',
      sku: `DF-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `${2000000 + Math.floor(Math.random() * 99999)}`,
      sizes: 'S, M, L, XL',
      colors: 'Standard',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      price: String(prod.price),
      costPrice: prod.costPrice ? String(prod.costPrice) : '',
      stock: String(prod.stock),
      sku: prod.sku,
      barcode: prod.barcode || '',
      sizes: prod.sizes.join(', '),
      colors: prod.colors.join(', '),
      description: prod.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setIsSubmitting(true);
    try {
      const parsedSizes = formData.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedColors = formData.colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const productPayload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price) || 0,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        stock: parseInt(formData.stock, 10) || 0,
        sku: formData.sku.trim() || `DF-${Date.now().toString().slice(-4)}`,
        barcode: formData.barcode.trim() || undefined,
        sizes: parsedSizes.length > 0 ? parsedSizes : ['Standard'],
        colors: parsedColors.length > 0 ? parsedColors : ['Default'],
        image: editingProduct?.image || '',
        description: formData.description.trim(),
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productPayload);
      } else {
        await onAddProduct(productPayload);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Product & Inventory Catalog</h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">· {products.length} Products</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage Deneth Fashion collection, stock levels, sizes, and pricing
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group flex flex-col"
          >
            {/* Image banner or Sleek Boutique Header */}
            {product.image ? (
              <div className="relative h-44 bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-neutral-200 border border-white/10">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md border ${
                      product.stock > 10
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/20'
                        : product.stock > 0
                        ? 'bg-amber-950/80 text-amber-400 border-amber-500/20'
                        : 'bg-red-950/80 text-red-400 border-red-500/20'
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3.5 bg-gradient-to-r from-neutral-50 to-neutral-100/70 dark:from-neutral-900 dark:to-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-xs">
                    {product.category}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    product.stock > 10
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : product.stock > 0
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500 mb-1">
                  <span>SKU: {product.sku}</span>
                  {product.barcode && <span>Bar: {product.barcode}</span>}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1 mb-1">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}

                {/* Sizes and colors */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
                  <span>Sizes:</span>
                  {product.sizes.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] text-neutral-700 dark:text-neutral-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price and controls */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Price</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatCurrency(product.price, settings.currencySymbol)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Stock adjuster */}
                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-300 dark:border-neutral-700">
                    <button
                      onClick={() =>
                        onUpdateProduct(product.id, { stock: Math.max(0, product.stock - 1) })
                      }
                      title="Decrease stock by 1"
                      className="px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
                    >
                      -1
                    </button>
                    <span className="text-[11px] font-mono px-1 text-neutral-900 dark:text-white font-bold tabular-nums">
                      {product.stock}
                    </span>
                    <button
                      onClick={() => onUpdateProduct(product.id, { stock: product.stock + 1 })}
                      title="Increase stock by 1"
                      className="px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
                    >
                      +1
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <Package className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">No products found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or add a new boutique fashion item to the catalog.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-auto transition-colors"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Boutique Item'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Classic Relaxed Linen Shirt"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="Shirts">Shirts</option>
                      <option value="Dresses">Dresses</option>
                      <option value="Trousers">Trousers</option>
                      <option value="Polos">Polos</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Special">Special Collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Selling Price ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 4800"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 tabular-nums transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="e.g. 2800"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 tabular-nums transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="20"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 tabular-nums transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="DF-MSH-01"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Sizes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Colors (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="Cream, Beige, Sage"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>


                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Fabric / Styling Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="100% pure organic breathable linen with camp collar..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
