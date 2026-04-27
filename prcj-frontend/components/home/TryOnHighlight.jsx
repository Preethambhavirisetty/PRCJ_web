import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Smartphone, ArrowRight } from 'lucide-react';
import { PaisleyBg } from '@/components/brand';
const FEATURES = [
    {
        icon: _jsx(Camera, { size: 20 }),
        title: 'Live AR Try-On',
        desc: 'Use your webcam or front camera for real-time jewelry overlay',
    },
    {
        icon: _jsx(Sparkles, { size: 20 }),
        title: 'Precise 3D Rendering',
        desc: 'MediaPipe AI tracks 468 face landmarks for pixel-perfect placement',
    },
    {
        icon: _jsx(Smartphone, { size: 20 }),
        title: 'Works on Any Device',
        desc: 'Desktop, tablet, or mobile — all browsers supported',
    },
];
export function TryOnHighlight() {
    return (_jsx(PaisleyBg, { className: "bg-[#1a0e0e] py-20", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs(motion.div, { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, children: [_jsxs("p", { className: "text-xs tracking-[0.4em] text-[#C9933A] uppercase mb-3 flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-px bg-[#C9933A]" }), "Virtual Try-On"] }), _jsxs("h2", { className: "heading-xl text-white mb-4", style: { fontFamily: 'var(--font-cormorant)' }, children: ["Try Before You", ' ', _jsx("span", { className: "gold-text", children: "Buy" })] }), _jsx("p", { className: "text-[#9e9790] leading-relaxed mb-8 max-w-lg", children: "Our cutting-edge AR technology lets you see exactly how any jewellery piece looks on you \u2014 from necklaces to maang tikkas \u2014 with stunning 8K 3D detail before you place your order." }), _jsx("div", { className: "space-y-4 mb-8", children: FEATURES.map((f) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-[#C9933A]/20 border border-[#C9933A]/30 flex items-center justify-center text-[#C9933A] shrink-0", children: f.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[#E8C97A]", children: f.title }), _jsx("p", { className: "text-xs text-[#6B6560] mt-0.5", children: f.desc })] })] }, f.title))) }), _jsxs(Link, { href: "/tryon", className: "btn-gold flex items-center gap-2 w-fit", children: [_jsx(Sparkles, { size: 16 }), "Try Jewellery Now", _jsx(ArrowRight, { size: 16 })] })] }), _jsx(motion.div, { initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 }, className: "flex justify-center", children: _jsxs("div", { className: "relative w-72 h-72", children: [_jsx("div", { className: "absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2a1212] to-[#3D1010] border-2 border-[#C9933A]/40 flex items-center justify-center shadow-2xl", children: _jsxs("div", { className: "text-center p-6", children: [_jsx("div", { className: "w-24 h-24 mx-auto rounded-full border-2 border-[#C9933A]/50 flex items-center justify-center mb-4 bg-[#1a0e0e]", style: { animation: 'mandala-spin 8s linear infinite' }, children: _jsx("img", { src: "/motifs/mandala.svg", alt: "", className: "w-full h-full" }) }), _jsx("p", { className: "text-xs text-[#C9933A] tracking-widest uppercase mb-1", children: "Live Preview" }), _jsx("p", { className: "text-sm text-[#E8C97A] font-medium", style: { fontFamily: 'var(--font-cormorant)' }, children: "Kundan Necklace Set" }), _jsx("div", { className: "mt-3 flex justify-center gap-1", children: [1, 2, 3].map((d) => (_jsx("div", { className: "w-2 h-2 rounded-full bg-[#C9933A] opacity-60", style: { animation: `pulse-gold 1.5s ease-in-out ${d * 0.3}s infinite` } }, d))) })] }) }), _jsx("div", { className: "absolute -inset-4 rounded-3xl border border-[#C9933A]/10 animate-pulse" }), _jsx("div", { className: "absolute -inset-8 rounded-3xl border border-[#C9933A]/5" }), _jsx("div", { className: "absolute -top-4 -right-4 bg-[#C9933A] text-white text-xs font-bold px-3 py-1.5 rounded-full", children: "3D AR" })] }) })] }) }) }));
}
