import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
const CATEGORIES = [
    {
        title: "Women's Collection",
        subtitle: 'Necklaces · Earrings · Bangles · Rings',
        href: '/shop?gender=women',
        bg: 'from-[#1a0e0e] to-[#3D1010]',
        emoji: '👑',
        accent: '#E8C97A',
    },
    {
        title: "Men's Collection",
        subtitle: 'Chains · Kadas · Rings · Bracelets',
        href: '/shop?gender=men',
        bg: 'from-[#0e1a1a] to-[#0e2b2b]',
        emoji: '⚜️',
        accent: '#C9933A',
    },
    {
        title: 'Bridal Sets',
        subtitle: 'Necklace Sets · Maang Tikka · Nath · Payal',
        href: '/shop?collection=bridal',
        bg: 'from-[#1a0e18] to-[#2d1030]',
        emoji: '🌸',
        accent: '#E8C97A',
        featured: true,
    },
    {
        title: 'Kids Jewellery',
        subtitle: 'Anklets · Small Rings · Chains · Bangles',
        href: '/shop?gender=kids',
        bg: 'from-[#1a150e] to-[#2d2210]',
        emoji: '✨',
        accent: '#C9933A',
    },
];
export function ShopByGender() {
    return (_jsxs("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-16", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("p", { className: "text-xs tracking-[0.4em] text-[#C9933A] uppercase mb-2", children: "For Everyone" }), _jsx("h2", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Shop by Collection" })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: CATEGORIES.map((cat, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.1 }, children: _jsxs(Link, { href: cat.href, className: `group block relative rounded-2xl overflow-hidden bg-gradient-to-br ${cat.bg} p-6 h-48 transition-transform duration-300 hover:-translate-y-1`, style: { boxShadow: cat.featured ? `0 8px 32px rgba(201,147,58,0.3)` : 'none' }, children: [cat.featured && (_jsx("div", { className: "absolute top-3 right-3", children: _jsx("span", { className: "text-[10px] bg-[#C9933A] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", children: "Grand" }) })), _jsx("div", { className: "text-3xl mb-3", children: cat.emoji }), _jsx("h3", { className: "text-base font-semibold text-white mb-1 leading-tight", style: { fontFamily: 'var(--font-cormorant)', color: cat.accent }, children: cat.title }), _jsx("p", { className: "text-xs text-white/50 leading-relaxed mb-4", children: cat.subtitle }), _jsxs("div", { className: "flex items-center gap-1 text-xs font-medium transition-colors", style: { color: cat.accent }, children: ["Shop Now", _jsx(ArrowRight, { size: 12, className: "transition-transform duration-200 group-hover:translate-x-1" })] }), _jsx("div", { className: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl", style: { boxShadow: `inset 0 0 40px rgba(201,147,58,0.15)` } })] }) }, cat.title))) })] }));
}
