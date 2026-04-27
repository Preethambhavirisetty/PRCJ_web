import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { LotusDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
const FETCHERS = {
    featured: productsAPI.getFeatured,
    new: productsAPI.getNewArrivals,
    bestsellers: productsAPI.getBestSellers,
};
export function FeaturedProducts({ title, subtitle, type, viewAllHref }) {
    const { data, isLoading } = useQuery({
        queryKey: ['products', type],
        queryFn: async () => {
            const res = await FETCHERS[type]();
            return res.data.data.items ?? [];
        },
    });
    return (_jsxs("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-16", children: [_jsxs("div", { className: "flex items-end justify-between mb-8", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs tracking-[0.4em] text-[#C9933A] uppercase mb-2", children: subtitle ?? '' }), _jsx("h2", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: title })] }), _jsxs(Link, { href: viewAllHref, className: "hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#C9933A] hover:text-[#A8771F] transition-colors", children: ["View All ", _jsx(ArrowRight, { size: 14 })] })] }), _jsx(LotusDivider, { className: "mb-8" }), isLoading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(MandalaSpinner, { size: 48 }) })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6", children: (data ?? []).map((product) => (_jsx(ProductCard, { product: product }, product.id))) })), _jsx("div", { className: "mt-8 text-center sm:hidden", children: _jsxs(Link, { href: viewAllHref, className: "btn-outline-gold text-sm", children: ["View All ", _jsx(ArrowRight, { size: 14, className: "inline ml-1" })] }) })] }));
}
