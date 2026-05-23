import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense } from 'react';
import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { LotusDivider, MandalaSpinner, PaisleyBg } from '@/components/brand';
import { formatCurrency } from '@/lib/utils';
const METAL_TYPES = [
    '22K Gold', '18K Gold', '14K Gold', 'Diamond', 'Silver',
    'Platinum', 'Kundan', 'Polki', 'Jadau', 'Meenakari',
    'Temple Gold', 'Rose Gold', 'Antique Gold', 'Oxidised Silver',
];
const SORT_OPTIONS = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Most Popular', value: 'popular' },
];
function ShopContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 500000]);
    const [selectedMetals, setSelectedMetals] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const q = searchParams.get('q') ?? '';
    const isFeatured = searchParams.get('featured') === 'true';
    const params = {
        q: q || undefined,
        is_featured: isFeatured || undefined,
        sort_by: sort,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 500000 ? priceRange[1] : undefined,
        metal_type: selectedMetals.length === 1 ? selectedMetals[0] : undefined,
        category_slug: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        page,
        page_size: 20,
    };
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const res = await productsAPI.list(params);
            return res.data;
        },
    });
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await categoriesAPI.tree();
            return res.data.data ?? [];
        },
    });
    const products = productsData?.items ?? [];
    const totalPages = productsData?.total_pages ?? 1;
    const toggleMetal = (metal) => {
        setSelectedMetals((prev) => prev.includes(metal) ? prev.filter((m) => m !== metal) : [...prev, metal]);
        setPage(1);
    };
    const toggleCategory = (slug) => {
        setSelectedCategories((prev) => prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]);
        setPage(1);
    };
    const clearAll = () => {
        setSelectedMetals([]);
        setSelectedCategories([]);
        setPriceRange([0, 500000]);
        setPage(1);
    };
    const activeFilters = selectedMetals.length + selectedCategories.length +
        (priceRange[0] > 0 || priceRange[1] < 500000 ? 1 : 0);
    const Sidebar = () => (_jsxs("aside", { className: "w-72 shrink-0 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Filters" }), activeFilters > 0 && (_jsxs("button", { onClick: clearAll, className: "text-xs text-[#C9933A] hover:text-[#A8771F] flex items-center gap-1", children: ["Clear all (", activeFilters, ")"] }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-[#C9933A] uppercase tracking-widest mb-3", children: "Category" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto pr-1", children: (categories ?? []).slice(0, 12).map((cat) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: selectedCategories.includes(cat.slug), onChange: () => toggleCategory(cat.slug), className: "w-4 h-4 rounded accent-[#C9933A]" }), _jsx("span", { className: "text-sm text-[#1a0e0e] group-hover:text-[#C9933A] transition-colors", children: cat.name })] }, cat.slug))) })] }), _jsx(LotusDivider, {}), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-[#C9933A] uppercase tracking-widest mb-3", children: "Metal Type" }), _jsx("div", { className: "flex flex-wrap gap-2", children: METAL_TYPES.map((metal) => (_jsx("button", { onClick: () => toggleMetal(metal), className: `px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedMetals.includes(metal)
                                ? 'bg-[#C9933A] text-white border-[#C9933A]'
                                : 'border-[#E8C97A]/50 text-[#6B6560] hover:border-[#C9933A] hover:text-[#C9933A]'}`, children: metal }, metal))) })] }), _jsx(LotusDivider, {}), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-[#C9933A] uppercase tracking-widest mb-3", children: "Price Range" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between text-xs text-[#6B6560]", children: [_jsx("span", { children: formatCurrency(priceRange[0]) }), _jsx("span", { children: formatCurrency(priceRange[1]) })] }), _jsx("input", { type: "range", min: 0, max: 500000, step: 5000, value: priceRange[1], onChange: (e) => setPriceRange([priceRange[0], Number(e.target.value)]), className: "w-full accent-[#C9933A]" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [10000, 25000, 50000, 100000, 200000].map((price) => (_jsxs("button", { onClick: () => setPriceRange([0, price]), className: `text-xs py-1.5 px-2 rounded border transition-colors ${priceRange[1] === price && priceRange[0] === 0
                                        ? 'bg-[#C9933A] text-white border-[#C9933A]'
                                        : 'border-[#E8C97A]/50 text-[#6B6560] hover:border-[#C9933A]'}`, children: ["Under ", formatCurrency(price)] }, price))) })] })] })] }));
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-10", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 text-center", children: [_jsx("p", { className: "text-xs tracking-[0.4em] text-[#C9933A] uppercase mb-2", children: "PRCJ Collection" }), _jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: q ? `Results for "${q}"` : 'All Jewellery' }), productsData && (_jsxs("p", { className: "text-sm text-[#6B6560] mt-2", children: [productsData.total, " pieces"] }))] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6 flex-wrap gap-3", children: [_jsxs("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "flex items-center gap-2 px-4 py-2 border border-[#E8C97A]/50 rounded-lg text-sm text-[#1a0e0e] hover:border-[#C9933A] hover:text-[#C9933A] transition-colors", children: [_jsx(SlidersHorizontal, { size: 14 }), "Filters", activeFilters > 0 && (_jsx("span", { className: "bg-[#C9933A] text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold", children: activeFilters }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-[#6B6560]", children: "Sort by:" }), _jsx("select", { value: sort, onChange: (e) => { setSort(e.target.value); setPage(1); }, className: "text-sm border border-[#E8C97A]/50 rounded-lg px-3 py-2 text-[#1a0e0e] outline-none focus:border-[#C9933A] bg-white", children: SORT_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] })] }), activeFilters > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: selectedMetals.map((m) => (_jsxs("span", { className: "flex items-center gap-1 px-3 py-1 bg-[#FDF6E3] border border-[#C9933A]/40 rounded-full text-xs text-[#C9933A]", children: [m, _jsx("button", { onClick: () => toggleMetal(m), children: _jsx(X, { size: 10 }) })] }, m))) })), _jsxs("div", { className: "flex gap-8", children: [_jsx("div", { className: "hidden lg:block sticky top-24 h-fit", children: _jsx(Sidebar, {}) }), _jsx("div", { className: "flex-1", children: isLoading ? (_jsx("div", { className: "flex justify-center py-24", children: _jsx(MandalaSpinner, { size: 56 }) })) : products.length === 0 ? (_jsxs("div", { className: "text-center py-24", children: [_jsx("p", { className: "text-[#6B6560] mb-4", children: "No jewellery found matching your filters" }), _jsx("button", { onClick: clearAll, className: "btn-outline-gold text-sm", children: "Clear Filters" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) }), totalPages > 1 && (_jsxs("div", { className: "flex justify-center gap-2 mt-10", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "px-4 py-2 text-sm border border-[#E8C97A]/50 rounded-lg disabled:opacity-40 hover:border-[#C9933A] transition-colors", children: "Previous" }), Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (_jsx("button", { onClick: () => setPage(p), className: `w-9 h-9 text-sm rounded-lg border transition-colors ${page === p
                                                        ? 'bg-[#C9933A] text-white border-[#C9933A]'
                                                        : 'border-[#E8C97A]/50 hover:border-[#C9933A]'}`, children: p }, p))), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "px-4 py-2 text-sm border border-[#E8C97A]/50 rounded-lg disabled:opacity-40 hover:border-[#C9933A] transition-colors", children: "Next" })] }))] })) })] })] }), sidebarOpen && (_jsxs("div", { className: "fixed inset-0 z-40 lg:hidden", children: [_jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setSidebarOpen(false) }), _jsxs(motion.aside, { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, className: "absolute inset-y-0 left-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto", children: [_jsx("div", { className: "flex justify-end mb-4", children: _jsx("button", { onClick: () => setSidebarOpen(false), children: _jsx(X, { size: 20, className: "text-[#6B6560]" }) }) }), _jsx(Sidebar, {})] })] }))] }));
}
export default function ShopPage() {
    return (_jsx(Suspense, { fallback: _jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx(MandalaSpinner, { size: 56 }) }), children: _jsx(ShopContent, {}) }));
}
