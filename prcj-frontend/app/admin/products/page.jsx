import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Package, X } from 'lucide-react';
import { adminAPI, categoriesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { GoldDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
import { Link } from '@/lib/router.jsx';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-orange-100 text-orange-600',
  out_of_stock: 'bg-red-100 text-red-600',
};

const STATUS_OPTIONS = ['draft', 'active', 'archived', 'out_of_stock'];
const METAL_OPTIONS = [
  '22K Gold', '18K Gold', '14K Gold', 'Diamond', 'Silver',
  'Platinum', 'Kundan', 'Polki', 'Jadau', 'Meenakari',
  'Temple Gold', 'Rose Gold', 'Antique Gold', 'Oxidised Silver', 'Navratna',
];

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  short_description: '',
  category_id: '',
  price: '',
  sale_price: '',
  metal_type: '22K Gold',
  weight_gm: '',
  purity: '',
  stone_details: '',
  making_charges: '',
  stock: '0',
  low_stock_threshold: '5',
  status: 'draft',
  is_featured: false,
  is_new_arrival: false,
  is_best_seller: false,
  meta_title: '',
  meta_description: '',
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function flattenCategories(nodes, acc = []) {
  for (const node of nodes || []) {
    acc.push({ id: node.id, name: node.name, slug: node.slug });
    if (node.children?.length) {
      flattenCategories(node.children, acc);
    }
  }
  return acc;
}

function parseError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(', ');
  }
  return 'Request failed';
}

function ProductModal({
  open,
  mode,
  categories,
  loading,
  value,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-[#F0E8D5] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0E8D5]">
          <h2 className="text-xl font-semibold text-[#1a0e0e]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {mode === 'create' ? 'Add Product' : 'Edit Product'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8F4E8]">
            <X size={18} />
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Name *</span>
              <input
                value={value.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>SKU *</span>
              <input
                value={value.sku}
                onChange={(e) => onChange('sku', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
                required
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Slug *</span>
              <input
                value={value.slug}
                onChange={(e) => onChange('slug', slugify(e.target.value))}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Category *</span>
              <select
                value={value.category_id}
                onChange={(e) => onChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A] bg-white"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <label className="space-y-1 text-sm text-[#6B6560] sm:col-span-2">
              <span>Metal Type *</span>
              <select
                value={value.metal_type}
                onChange={(e) => onChange('metal_type', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A] bg-white"
                required
              >
                {METAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Price *</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={value.price}
                onChange={(e) => onChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Sale Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.sale_price}
                onChange={(e) => onChange('sale_price', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Stock *</span>
              <input
                type="number"
                min="0"
                value={value.stock}
                onChange={(e) => onChange('stock', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Low Stock</span>
              <input
                type="number"
                min="0"
                value={value.low_stock_threshold}
                onChange={(e) => onChange('low_stock_threshold', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Weight (gm)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.weight_gm}
                onChange={(e) => onChange('weight_gm', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
              />
            </label>
            <label className="space-y-1 text-sm text-[#6B6560]">
              <span>Status *</span>
              <select
                value={value.status}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A] bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-1 text-sm text-[#6B6560] block">
            <span>Short Description</span>
            <textarea
              rows={2}
              value={value.short_description}
              onChange={(e) => onChange('short_description', e.target.value)}
              className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
            />
          </label>

          <label className="space-y-1 text-sm text-[#6B6560] block">
            <span>Description</span>
            <textarea
              rows={4}
              value={value.description}
              onChange={(e) => onChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A]"
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[#1a0e0e]">
              <input
                type="checkbox"
                checked={value.is_featured}
                onChange={(e) => onChange('is_featured', e.target.checked)}
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#1a0e0e]">
              <input
                type="checkbox"
                checked={value.is_new_arrival}
                onChange={(e) => onChange('is_new_arrival', e.target.checked)}
              />
              New Arrival
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#1a0e0e]">
              <input
                type="checkbox"
                checked={value.is_best_seller}
                onChange={(e) => onChange('is_best_seller', e.target.checked)}
              />
              Best Seller
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline-gold text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-crimson text-sm disabled:opacity-60">
              {loading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const res = await adminAPI.products.list({
        search: search || undefined,
        page,
        page_size: 20,
      });
      return res.data;
    },
  });

  const { data: categoryTree } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await categoriesAPI.tree();
      return res.data.data ?? [];
    },
  });

  const categories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const createMutation = useMutation({
    mutationFn: (payload) => adminAPI.products.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created');
      setModalOpen(false);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminAPI.products.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      setModalOpen(false);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-product-detail', editingId],
    enabled: Boolean(editingId && mode === 'edit' && modalOpen),
    queryFn: async () => {
      const res = await adminAPI.products.get(editingId);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const p = detailQuery.data;
    setForm({
      name: p.name ?? '',
      slug: p.slug ?? '',
      sku: p.sku ?? '',
      description: p.description ?? '',
      short_description: p.short_description ?? '',
      category_id: p.category?.id ?? '',
      price: p.price ?? '',
      sale_price: p.sale_price ?? '',
      metal_type: p.metal_type ?? '22K Gold',
      weight_gm: p.weight_gm ?? '',
      purity: p.purity ?? '',
      stone_details: p.stone_details ?? '',
      making_charges: p.making_charges ?? '',
      stock: p.stock ?? '0',
      low_stock_threshold: p.low_stock_threshold ?? '5',
      status: p.status ?? 'draft',
      is_featured: Boolean(p.is_featured),
      is_new_arrival: Boolean(p.is_new_arrival),
      is_best_seller: Boolean(p.is_best_seller),
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
    });
  }, [detailQuery.data]);

  const products = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const resetAndOpenCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (id) => {
    setMode('edit');
    setEditingId(id);
    setModalOpen(true);
  };

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && mode === 'create') {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const makePayload = () => ({
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim(),
    description: form.description || null,
    short_description: form.short_description || null,
    category_id: form.category_id,
    price: Number(form.price),
    sale_price: form.sale_price === '' ? null : Number(form.sale_price),
    metal_type: form.metal_type,
    weight_gm: form.weight_gm === '' ? null : Number(form.weight_gm),
    purity: form.purity || null,
    stone_details: form.stone_details || null,
    making_charges: form.making_charges === '' ? null : Number(form.making_charges),
    stock: Number(form.stock || 0),
    low_stock_threshold: Number(form.low_stock_threshold || 0),
    status: form.status,
    is_featured: Boolean(form.is_featured),
    is_new_arrival: Boolean(form.is_new_arrival),
    is_best_seller: Boolean(form.is_best_seller),
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
  });

  const handleSubmit = () => {
    const payload = makePayload();
    if (mode === 'create') {
      createMutation.mutate(payload);
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const modalLoading = saving || detailQuery.isLoading;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-[#C9933A] uppercase tracking-widest mb-1">Catalogue</p>
          <h1 className="text-2xl font-bold text-[#1a0e0e]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Products
          </h1>
        </div>
        <button onClick={resetAndOpenCreate} className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <GoldDivider />

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <MandalaSpinner size={56} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F0E8D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F4E8] text-left">
                <tr className="text-xs text-[#9e9790] uppercase tracking-wider">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">3D</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F4E8]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Package size={36} className="text-[#E8C97A] mx-auto mb-2" />
                      <p className="text-[#9e9790]">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#FEFDF9] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1a0e0e] line-clamp-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
                          {p.name}
                        </p>
                        <p className="text-xs text-[#C9933A]">{p.metal_type}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B6560]">{p.sku}</td>
                      <td className="px-4 py-3 font-semibold text-[#1a0e0e]">
                        {formatCurrency(p.sale_price ?? p.price)}
                        {p.sale_price && <span className="ml-1 text-xs text-[#9e9790] line-through">{formatCurrency(p.price)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= p.low_stock_threshold ? 'text-orange-500' : 'text-[#1a0e0e]'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.has_3d_model ? <span className="text-xs text-[#C9933A] font-bold">✓</span> : <span className="text-xs text-[#D0C8C0]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/shop/${p.slug}`} className="p-1.5 text-[#9e9790] hover:text-[#C9933A] transition-colors" target="_blank">
                            <Eye size={14} />
                          </Link>
                          <button onClick={() => openEdit(p.id)} className="p-1.5 text-[#9e9790] hover:text-[#6B1E1E] transition-colors">
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${p.name}"?`)) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            className="p-1.5 text-[#9e9790] hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-[#F0E8D5]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                    page === p ? 'bg-[#C9933A] text-white border-[#C9933A]' : 'border-[#E8C97A]/50 hover:border-[#C9933A]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ProductModal
        open={modalOpen}
        mode={mode}
        categories={categories}
        loading={modalLoading}
        value={form}
        onClose={() => setModalOpen(false)}
        onChange={setField}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
