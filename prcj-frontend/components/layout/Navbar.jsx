import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Sparkles, Crown, Gem } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
const NAV_ITEMS = [
    {
        label: 'Women',
        href: '/shop?gender=women',
        icon: _jsx(Gem, { size: 14 }),
        mega: [
            { heading: 'Necklaces', links: ['Chokers', 'Long Naans', 'Chains', 'Pendants', 'Mangalsutra'] },
            { heading: 'Earrings', links: ['Jhumkas', 'Studs', 'Hoops', 'Chandbalis', 'Danglers'] },
            { heading: 'Bangles & Bracelets', links: ['Gold Bangles', 'Kadas', 'Bracelets', 'Haathphool'] },
            { heading: 'Rings', links: ['Cocktail Rings', 'Stacking Rings', 'Adjustable'] },
        ],
    },
    {
        label: 'Men',
        href: '/shop?gender=men',
        icon: _jsx(Crown, { size: 14 }),
        mega: [
            { heading: 'Chains', links: ['Gold Chains', 'Silver Chains', 'Rudraksha'] },
            { heading: 'Bracelets', links: ['Kadas', 'Leather Bracelets', 'Gold Bracelets'] },
            { heading: 'Rings', links: ['Gold Rings', 'Silver Rings', 'Gemstone Rings'] },
        ],
    },
    {
        label: 'Bridal',
        href: '/shop?collection=bridal',
        icon: _jsx(Sparkles, { size: 14 }),
        mega: [
            { heading: 'Bridal Sets', links: ['Necklace Sets', 'Choker Sets', 'Temple Sets', 'Polki Sets'] },
            { heading: 'Head Jewellery', links: ['Maang Tikka', 'Matha Patti', 'Passa', 'Jhoomar'] },
            { heading: 'Nose Jewellery', links: ['Nath', 'Nose Pins', 'Nose Rings'] },
            { heading: 'Waist & Feet', links: ['Kamarband', 'Payals', 'Bichiya'] },
        ],
    },
    {
        label: 'Collections',
        href: '/shop',
        mega: [
            { heading: 'By Metal', links: ['22K Gold', 'Diamond', 'Silver', 'Kundan', 'Polki', 'Jadau'] },
            { heading: 'By Occasion', links: ['Wedding', 'Engagement', 'Festival', 'Daily Wear', 'Office'] },
            { heading: 'New Arrivals', links: [] },
            { heading: 'Best Sellers', links: [] },
        ],
    },
    { label: 'Try-On AR', href: '/tryon', badge: '3D', mega: null },
];
export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const cartCount = useCartStore((s) => s.cart?.item_count ?? 0);
    const { isAuthenticated, user } = useAuthStore();
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-[#6B1E1E] text-[#F9E8B5] text-center text-xs py-2 tracking-widest uppercase overflow-hidden", children: _jsx("div", { className: "inline-flex gap-16 animate-[marquee_30s_linear_infinite]", children: Array(3).fill(0).map((_, i) => (_jsxs("span", { className: "flex items-center gap-8 whitespace-nowrap", children: [_jsx("span", { children: "\u2726 Free Shipping on Orders Above \u20B95,000" }), _jsx("span", { children: "\u2726 BIS Hallmarked Jewellery \u2014 Guaranteed Purity" }), _jsx("span", { children: "\u2726 30-Day Easy Returns" }), _jsx("span", { children: "\u2726 EMI Available on All Orders" })] }, i))) }) }), _jsxs("nav", { className: cn('sticky top-0 z-50 w-full transition-all duration-300', scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[#E8C97A]/20'
                    : 'bg-white border-b border-[#F0E8D5]'), children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "flex items-center justify-between h-16 md:h-20", children: [_jsxs(Link, { href: "/", className: "flex flex-col items-center leading-none shrink-0", children: [_jsx("span", { className: "text-2xl md:text-3xl font-bold tracking-wider gold-text-static", style: { fontFamily: 'var(--font-display)' }, children: "PRCJ" }), _jsx("span", { className: "text-[10px] tracking-[0.3em] text-[#6B6560] uppercase", children: "Fine Jewellery" })] }), _jsx("div", { className: "hidden lg:flex items-center gap-1", children: NAV_ITEMS.map((item) => (_jsxs("div", { className: "relative", onMouseEnter: () => setActiveMenu(item.label), onMouseLeave: () => setActiveMenu(null), children: [_jsxs(Link, { href: item.href, className: cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors', 'text-[#1a0e0e] hover:text-[#C9933A]'), children: [item.icon, item.label, item.mega && _jsx(ChevronDown, { size: 12, className: cn('transition-transform duration-200', activeMenu === item.label && 'rotate-180') }), item.badge && (_jsx("span", { className: "ml-1 text-[10px] font-bold bg-[#6B1E1E] text-white px-1.5 py-0.5 rounded-full", children: item.badge }))] }), item.mega && (_jsx(AnimatePresence, { children: activeMenu === item.label && (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.2 }, className: "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] bg-white border border-[#E8C97A]/30 rounded-xl shadow-xl p-6 grid grid-cols-4 gap-4", children: [item.mega.map((col) => (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-[#C9933A] uppercase tracking-widest mb-2", children: col.heading }), _jsxs("ul", { className: "space-y-1.5", children: [col.links.map((link) => (_jsx("li", { children: _jsx(Link, { href: `/shop?q=${link.toLowerCase()}`, className: "text-sm text-[#1a0e0e] hover:text-[#C9933A] transition-colors", children: link }) }, link))), col.links.length === 0 && (_jsx("li", { children: _jsx(Link, { href: `/shop?sort=${col.heading.toLowerCase().replace(' ', '_')}`, className: "text-sm text-[#C9933A] font-medium hover:underline", children: "View All \u2192" }) }))] })] }, col.heading))), _jsx("div", { className: "col-span-4 mt-2 pt-3 border-t border-[#F0E8D5] flex justify-center", children: _jsxs(Link, { href: item.href, className: "text-xs text-[#C9933A] font-medium tracking-wider uppercase hover:underline", children: ["View All ", item.label, " Jewellery \u2192"] }) })] })) }))] }, item.label))) }), _jsxs("div", { className: "flex items-center gap-1 md:gap-2", children: [_jsx("button", { onClick: () => setSearchOpen(true), className: "p-2 rounded-md text-[#1a0e0e] hover:text-[#C9933A] hover:bg-[#FDF6E3] transition-colors", "aria-label": "Search", children: _jsx(Search, { size: 20 }) }), _jsx(Link, { href: "/account/wishlist", className: "p-2 rounded-md text-[#1a0e0e] hover:text-[#C9933A] hover:bg-[#FDF6E3] transition-colors hidden sm:block", "aria-label": "Wishlist", children: _jsx(Heart, { size: 20 }) }), _jsxs("button", { onClick: () => useCartStore.getState().setOpen(true), className: "relative p-2 rounded-md text-[#1a0e0e] hover:text-[#C9933A] hover:bg-[#FDF6E3] transition-colors", "aria-label": "Cart", children: [_jsx(ShoppingBag, { size: 20 }), cartCount > 0 && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#6B1E1E] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1", children: cartCount > 99 ? '99+' : cartCount }))] }), _jsx(Link, { href: isAuthenticated ? '/account' : '/auth/login', className: "p-2 rounded-md text-[#1a0e0e] hover:text-[#C9933A] hover:bg-[#FDF6E3] transition-colors hidden sm:block", "aria-label": "Account", children: _jsx(User, { size: 20 }) }), isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin') && (_jsxs(Link, { href: "/admin", className: "hidden md:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#6B1E1E] text-[#F9E8B5] rounded-full hover:bg-[#5A1818] transition-colors", children: [_jsx(Crown, { size: 12 }), "Admin"] })), _jsx("button", { onClick: () => setMobileOpen(true), className: "p-2 rounded-md text-[#1a0e0e] lg:hidden", "aria-label": "Menu", children: _jsx(Menu, { size: 22 }) })] })] }) }), _jsx(AnimatePresence, { children: searchOpen && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4", onClick: () => setSearchOpen(false), children: _jsxs(motion.div, { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 }, onClick: (e) => e.stopPropagation(), className: "w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-[#F0E8D5]", children: [_jsx(Search, { size: 20, className: "text-[#C9933A]" }), _jsx("input", { autoFocus: true, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                                        window.location.href = `/shop?q=${encodeURIComponent(searchQuery)}`;
                                                    }
                                                }, placeholder: "Search for necklaces, rings, bangles\u2026", className: "flex-1 text-base outline-none text-[#1a0e0e] placeholder:text-[#9e9790]" }), _jsx("button", { onClick: () => setSearchOpen(false), className: "text-[#9e9790] hover:text-[#1a0e0e]", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-xs text-[#9e9790] mb-2 uppercase tracking-wider", children: "Popular Searches" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['Gold Necklace', 'Diamond Ring', 'Kundan Set', 'Silver Bangles', 'Jhumkas', 'Maang Tikka'].map((term) => (_jsx(Link, { href: `/shop?q=${encodeURIComponent(term)}`, onClick: () => setSearchOpen(false), className: "px-3 py-1.5 text-sm bg-[#F8F4E8] text-[#1a0e0e] rounded-full hover:bg-[#E8C97A]/30 hover:text-[#C9933A] transition-colors", children: term }, term))) })] })] }) })) })] }), _jsx(AnimatePresence, { children: mobileOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 bg-black/50", onClick: () => setMobileOpen(false) }), _jsxs(motion.aside, { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, transition: { type: 'tween', duration: 0.3 }, className: "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-5 border-b border-[#F0E8D5]", children: [_jsx("span", { className: "text-xl font-bold gold-text-static", style: { fontFamily: 'var(--font-display)' }, children: "PRCJ" }), _jsx("button", { onClick: () => setMobileOpen(false), children: _jsx(X, { size: 22, className: "text-[#6B6560]" }) })] }), _jsx("nav", { className: "flex-1 overflow-y-auto p-4 space-y-1", children: NAV_ITEMS.map((item) => (_jsxs(Link, { href: item.href, onClick: () => setMobileOpen(false), className: "flex items-center gap-3 px-4 py-3 rounded-lg text-[#1a0e0e] hover:bg-[#FDF6E3] hover:text-[#C9933A] transition-colors font-medium", children: [item.icon, item.label, item.badge && (_jsx("span", { className: "ml-auto text-[10px] font-bold bg-[#6B1E1E] text-white px-2 py-0.5 rounded-full", children: item.badge }))] }, item.label))) }), _jsxs("div", { className: "p-4 border-t border-[#F0E8D5] space-y-2", children: [_jsxs(Link, { href: isAuthenticated ? '/account' : '/auth/login', onClick: () => setMobileOpen(false), className: "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-[#1a0e0e] hover:bg-[#FDF6E3]", children: [_jsx(User, { size: 16 }), isAuthenticated ? 'My Account' : 'Login / Register'] }), _jsxs(Link, { href: "/account/wishlist", onClick: () => setMobileOpen(false), className: "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-[#1a0e0e] hover:bg-[#FDF6E3]", children: [_jsx(Heart, { size: 16 }), "Wishlist"] })] })] })] })) })] }));
}
