import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { GoldDivider, LotusDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
import { Link } from '@/lib/router.jsx';
const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-orange-100 text-orange-600',
    out_of_stock: 'bg-red-100 text-red-600',
};
export default function AdminProductsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin-products', search, page],
        queryFn: async () => {
            const res = await adminAPI.products.list({ search: search || undefined, page, size: 20 });
            return res.data.data;
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => adminAPI.products.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product deleted');
        },
        onError: () => toast.error('Could not delete product'),
    });
    const products = data?.items ?? [];
    return (_jsxs("div", { className: "p-6 space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest mb-1", children: "Catalogue" }), _jsx("h1", { className: "text-2xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Products" })] }), _jsxs("button", { className: "btn-gold flex items-center gap-2 text-sm", children: [_jsx(Plus, { size: 16 }), "Add Product"] })] }), _jsx(GoldDivider, {}), _jsxs("div", { className: "relative max-w-sm", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, placeholder: "Search products\u2026", className: "w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]" })] }), isLoading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx(MandalaSpinner, { size: 56 }) })) : (_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[#F8F4E8] text-left", children: _jsxs("tr", { className: "text-xs text-[#9e9790] uppercase tracking-wider", children: [_jsx("th", { className: "px-4 py-3", children: "Product" }), _jsx("th", { className: "px-4 py-3", children: "SKU" }), _jsx("th", { className: "px-4 py-3", children: "Price" }), _jsx("th", { className: "px-4 py-3", children: "Stock" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "3D" }), _jsx("th", { className: "px-4 py-3", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-[#F8F4E8]", children: products.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "py-12 text-center", children: [_jsx(Package, { size: 36, className: "text-[#E8C97A] mx-auto mb-2" }), _jsx("p", { className: "text-[#9e9790]", children: "No products found" })] }) })) : (products.map((p) => (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "hover:bg-[#FEFDF9] transition-colors", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("p", { className: "font-medium text-[#1a0e0e] line-clamp-1", style: { fontFamily: 'var(--font-cormorant)' }, children: p.name }), _jsx("p", { className: "text-xs text-[#C9933A]", children: p.metal_type })] }), _jsx("td", { className: "px-4 py-3 font-mono text-xs text-[#6B6560]", children: p.sku }), _jsxs("td", { className: "px-4 py-3 font-semibold text-[#1a0e0e]", children: [formatCurrency(p.sale_price ?? p.price), p.sale_price && _jsx("span", { className: "ml-1 text-xs text-[#9e9790] line-through", children: formatCurrency(p.price) })] }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= p.low_stock_threshold ? 'text-orange-500' : 'text-[#1a0e0e]'}`, children: p.stock }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`, children: p.status }) }), _jsx("td", { className: "px-4 py-3 text-center", children: p.has_3d_model ? (_jsx("span", { className: "text-xs text-[#C9933A] font-bold", children: "\u2713" })) : (_jsx("span", { className: "text-xs text-[#D0C8C0]", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { href: `/shop/${p.slug}`, className: "p-1.5 text-[#9e9790] hover:text-[#C9933A] transition-colors", target: "_blank", children: _jsx(Eye, { size: 14 }) }), _jsx("button", { className: "p-1.5 text-[#9e9790] hover:text-[#6B1E1E] transition-colors", children: _jsx(Edit, { size: 14 }) }), _jsx("button", { onClick: () => {
                                                                if (confirm(`Delete "${p.name}"?`))
                                                                    deleteMutation.mutate(p.id);
                                                            }, className: "p-1.5 text-[#9e9790] hover:text-red-600 transition-colors", children: _jsx(Trash2, { size: 14 }) })] }) })] }, p.id)))) })] }) }), (data?.pages ?? 1) > 1 && (_jsx("div", { className: "flex justify-center gap-2 p-4 border-t border-[#F0E8D5]", children: Array.from({ length: data.pages }, (_, i) => i + 1).slice(0, 10).map((p) => (_jsx("button", { onClick: () => setPage(p), className: `w-8 h-8 text-xs rounded-lg border transition-colors ${page === p ? 'bg-[#C9933A] text-white border-[#C9933A]' : 'border-[#E8C97A]/50 hover:border-[#C9933A]'}`, children: p }, p))) }))] }))] }));
}
