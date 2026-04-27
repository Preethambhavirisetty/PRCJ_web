import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { GoldDivider, LotusDivider } from '@/components/brand';
import { Phone, Mail, MapPin } from 'lucide-react';
// Social icon components (lucide doesn't export these)
const InstagramIcon = () => (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5" }), _jsx("circle", { cx: "12", cy: "12", r: "5" }), _jsx("circle", { cx: "17.5", cy: "6.5", r: "1", fill: "currentColor", stroke: "none" })] }));
const FacebookIcon = () => (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }) }));
const YoutubeIcon = () => (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" }), _jsx("polygon", { points: "9.75 15.02 15.5 12 9.75 8.98 9.75 15.02", fill: "currentColor", stroke: "none" })] }));
const TwitterIcon = () => (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" }) }));
const FOOTER_LINKS = {
    'Shop': [
        { label: 'New Arrivals', href: '/shop?sort=newest' },
        { label: 'Best Sellers', href: '/shop?sort=popular' },
        { label: "Women's Jewellery", href: '/shop?gender=women' },
        { label: "Men's Jewellery", href: '/shop?gender=men' },
        { label: 'Bridal Collection', href: '/shop?collection=bridal' },
        { label: 'Virtual Try-On', href: '/tryon' },
    ],
    'Help': [
        { label: 'FAQs', href: '/help/faq' },
        { label: 'Size Guide', href: '/help/size-guide' },
        { label: 'Care Guide', href: '/help/care-guide' },
        { label: 'Track Order', href: '/account/orders' },
        { label: 'Returns & Exchange', href: '/help/returns' },
    ],
    'Company': [
        { label: 'About PRCJ', href: '/about' },
        { label: 'Our Craftsmen', href: '/craftsmen' },
        { label: 'Sustainability', href: '/sustainability' },
        { label: 'Press', href: '/press' },
        { label: 'Careers', href: '/careers' },
    ],
};
const SOCIAL = [
    { icon: _jsx(InstagramIcon, {}), href: '#', label: 'Instagram' },
    { icon: _jsx(FacebookIcon, {}), href: '#', label: 'Facebook' },
    { icon: _jsx(YoutubeIcon, {}), href: '#', label: 'YouTube' },
    { icon: _jsx(TwitterIcon, {}), href: '#', label: 'Twitter' },
];
const CERTIFICATIONS = ['BIS Hallmark', 'IGI Certified', 'GIA Certified', 'ISO 9001'];
export function Footer() {
    return (_jsxs("footer", { className: "bg-[#1a0e0e] text-[#F8F4E8]", children: [_jsx(GoldDivider, {}), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsx("h2", { className: "text-3xl font-bold mb-1 gold-text-static", style: { fontFamily: 'var(--font-display)' }, children: "PRCJ" }), _jsx("p", { className: "text-xs tracking-[0.3em] text-[#C9933A] uppercase mb-4", children: "Fine Jewellery" }), _jsx("p", { className: "text-sm text-[#9e9790] leading-relaxed mb-6 max-w-xs", children: "India's grandest online jewellery destination. Crafting timeless pieces with BIS hallmarked gold, certified diamonds, and heritage artisanal techniques since generations." }), _jsxs("div", { className: "space-y-2 text-sm text-[#9e9790]", children: [_jsxs("a", { href: "tel:+919999999999", className: "flex items-center gap-2 hover:text-[#C9933A] transition-colors", children: [_jsx(Phone, { size: 14, className: "text-[#C9933A]" }), " +91 99999 99999"] }), _jsxs("a", { href: "mailto:care@prcj.in", className: "flex items-center gap-2 hover:text-[#C9933A] transition-colors", children: [_jsx(Mail, { size: 14, className: "text-[#C9933A]" }), " care@prcj.in"] }), _jsxs("p", { className: "flex items-start gap-2", children: [_jsx(MapPin, { size: 14, className: "text-[#C9933A] mt-0.5 shrink-0" }), "Zaveri Bazaar, Mumbai \u2014 400003"] })] }), _jsx("div", { className: "flex gap-3 mt-6", children: SOCIAL.map((s) => (_jsx("a", { href: s.href, "aria-label": s.label, className: "w-9 h-9 rounded-full border border-[#C9933A]/30 flex items-center justify-center text-[#9e9790] hover:text-[#C9933A] hover:border-[#C9933A] transition-colors", children: s.icon }, s.label))) })] }), Object.entries(FOOTER_LINKS).map(([title, links]) => (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-[#C9933A] uppercase tracking-widest mb-4", children: title }), _jsx("ul", { className: "space-y-2.5", children: links.map((link) => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-sm text-[#9e9790] hover:text-[#E8C97A] transition-colors", children: link.label }) }, link.label))) })] }, title)))] }), _jsx("div", { className: "mt-10 p-6 rounded-xl border border-[#C9933A]/20 bg-white/5", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-base font-semibold text-[#E8C97A]", style: { fontFamily: 'var(--font-display)' }, children: "Join the PRCJ Circle" }), _jsx("p", { className: "text-sm text-[#9e9790]", children: "Get exclusive previews, styling tips, and member-only offers." })] }), _jsxs("div", { className: "flex gap-2 w-full sm:w-auto", children: [_jsx("input", { type: "email", placeholder: "your@email.com", className: "flex-1 sm:w-56 px-4 py-2.5 text-sm bg-white/10 border border-[#C9933A]/30 rounded-lg text-white placeholder:text-[#6B6560] outline-none focus:border-[#C9933A] transition-colors" }), _jsx("button", { className: "btn-gold text-sm px-4 py-2.5 whitespace-nowrap", children: "Subscribe" })] })] }) }), _jsx(LotusDivider, { className: "mt-10 mb-6" }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6560]", children: [_jsxs("p", { children: ["\u00A9 ", new Date().getFullYear(), " PRCJ Fine Jewellery. All rights reserved."] }), _jsx("div", { className: "flex items-center gap-2 flex-wrap justify-center", children: CERTIFICATIONS.map((cert) => (_jsx("span", { className: "px-2 py-1 border border-[#C9933A]/20 rounded text-[#C9933A] text-[10px] tracking-wider uppercase", children: cert }, cert))) }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Link, { href: "/privacy", className: "hover:text-[#C9933A] transition-colors", children: "Privacy" }), _jsx(Link, { href: "/terms", className: "hover:text-[#C9933A] transition-colors", children: "Terms" })] })] })] })] }));
}
