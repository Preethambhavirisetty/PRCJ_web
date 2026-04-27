import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from '@/lib/router.jsx';
import Image from '@/lib/Image.jsx';
import { useParams } from '@/lib/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Sparkles, Star, ChevronLeft, ChevronRight, ZoomIn, Share2, Shield, Truck, RefreshCw, Award } from 'lucide-react';
import { productsAPI, cartAPI, wishlistAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { formatCurrency, getDiscountPercent } from '@/lib/utils';
import { LotusDivider, PaisleyBg, MandalaSpinner } from '@/components/brand';
import toast from 'react-hot-toast';
export default function ProductDetailPage() {
    const { slug } = useParams();
    const [activeImg, setActiveImg] = useState(0);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState('details');
    const { setCart } = useCartStore();
    const { has, toggle } = useWishlistStore();
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await productsAPI.get(slug);
            return res.data.data;
        },
    });
    const isWishlisted = has(product?.id ?? '');
    const addToCart = useMutation({
        mutationFn: () => cartAPI.add(product.id, qty, selectedVariant?.id),
        onSuccess: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            useCartStore.getState().setOpen(true);
            toast.success('Added to cart!');
        },
        onError: () => toast.error('Please login to add to cart'),
    });
    const toggleWishlist = useMutation({
        mutationFn: () => isWishlisted ? wishlistAPI.remove(product.id) : wishlistAPI.add(product.id),
        onSuccess: () => {
            toggle(product.id);
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist!');
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx(MandalaSpinner, { size: 64 }) }));
    }
    if (!product) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen gap-4", children: [_jsx("p", { className: "text-[#6B6560]", children: "Product not found" }), _jsx(Link, { href: "/shop", className: "btn-gold text-sm", children: "Back to Shop" })] }));
    }
    const images = product.images ?? [];
    const effectivePrice = selectedVariant
        ? product.price + selectedVariant.price_modifier
        : product.sale_price ?? product.price;
    const discount = product.sale_price && !selectedVariant
        ? getDiscountPercent(product.price, product.sale_price)
        : 0;
    const GUARANTEES = [
        { icon: _jsx(Shield, { size: 16 }), text: 'BIS Hallmarked — Guaranteed Purity' },
        { icon: _jsx(Truck, { size: 16 }), text: 'Free Shipping above ₹5,000' },
        { icon: _jsx(RefreshCw, { size: 16 }), text: '30-Day Easy Return Policy' },
        { icon: _jsx(Award, { size: 16 }), text: 'IGI/GIA Certified Stones' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-4", children: _jsxs("nav", { className: "text-xs text-[#9e9790] flex items-center gap-1", children: [_jsx(Link, { href: "/", className: "hover:text-[#C9933A]", children: "Home" }), _jsx("span", { children: "/" }), _jsx(Link, { href: "/shop", className: "hover:text-[#C9933A]", children: "Shop" }), _jsx("span", { children: "/" }), _jsx("span", { className: "text-[#1a0e0e]", children: product.name })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-16", children: [_jsxs("div", { className: "grid lg:grid-cols-2 gap-12", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "relative aspect-square rounded-2xl overflow-hidden bg-[#F8F4E8] cursor-zoom-in", onClick: () => setZoomOpen(true), children: [images.length > 0 ? (_jsx(Image, { src: images[activeImg]?.large_url ?? images[activeImg]?.url ?? '', alt: product.name, fill: true, className: "object-cover", sizes: "(max-width:1024px) 100vw, 50vw", priority: true })) : (_jsx("div", { className: "absolute inset-0 flex items-center justify-center text-6xl", children: "\uD83D\uDC8E" })), _jsx("button", { className: "absolute top-3 right-3 p-2 bg-white/80 rounded-lg text-[#6B6560] hover:text-[#C9933A]", children: _jsx(ZoomIn, { size: 18 }) }), images.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); setActiveImg((i) => Math.max(0, i - 1)); }, className: "absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full text-[#6B6560] hover:text-[#C9933A]", children: _jsx(ChevronLeft, { size: 18 }) }), _jsx("button", { onClick: (e) => { e.stopPropagation(); setActiveImg((i) => Math.min(images.length - 1, i + 1)); }, className: "absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full text-[#6B6560] hover:text-[#C9933A]", children: _jsx(ChevronRight, { size: 18 }) })] })), images[activeImg] && (_jsx("div", { className: "absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded text-[10px] text-white backdrop-blur-sm", children: images[activeImg].image_type?.replace(/_/g, ' ').toUpperCase() }))] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1", children: images.slice(0, 11).map((img, i) => (_jsx("button", { onClick: () => setActiveImg(i), className: `relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === activeImg ? 'border-[#C9933A]' : 'border-transparent hover:border-[#E8C97A]'}`, children: _jsx(Image, { src: img.thumbnail_url ?? img.url, alt: `View ${i + 1}`, fill: true, className: "object-cover", sizes: "64px" }) }, img.id))) })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [product.is_new_arrival && (_jsx("span", { className: "text-xs bg-[#C9933A] text-white px-3 py-1 rounded-full font-medium", children: "New Arrival" })), product.is_best_seller && (_jsx("span", { className: "text-xs bg-[#6B1E1E] text-[#E8C97A] px-3 py-1 rounded-full font-medium", children: "Best Seller" })), product.has_3d_model && (_jsxs(Link, { href: `/tryon/${product.slug}`, className: "text-xs bg-white border border-[#C9933A] text-[#C9933A] px-3 py-1 rounded-full font-medium flex items-center gap-1 hover:bg-[#FDF6E3]", children: [_jsx(Sparkles, { size: 10 }), "AR Try-On Available"] }))] }), _jsxs("div", { children: [_jsxs("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest font-medium mb-1", children: [product.metal_type, product.purity && ` · ${product.purity}`] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-semibold text-[#1a0e0e] leading-snug mb-2", style: { fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }, children: product.name }), _jsxs("p", { className: "text-xs text-[#9e9790]", children: ["SKU: ", product.sku] })] }), product.review_count > 0 && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex", children: [1, 2, 3, 4, 5].map((s) => (_jsx(Star, { size: 14, className: s <= Math.round(product.avg_rating) ? 'text-[#C9933A] fill-[#C9933A]' : 'text-[#E0D5C8]' }, s))) }), _jsxs("span", { className: "text-sm text-[#6B6560]", children: [product.avg_rating.toFixed(1), " (", product.review_count, " reviews)"] }), _jsx("button", { onClick: () => setActiveTab('reviews'), className: "text-sm text-[#C9933A] hover:underline", children: "See reviews" })] })), _jsx(LotusDivider, {}), _jsxs("div", { className: "flex items-baseline gap-3", children: [_jsx("span", { className: "text-3xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: formatCurrency(effectivePrice) }), discount > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-lg text-[#9e9790] line-through", children: formatCurrency(product.price) }), _jsxs("span", { className: "text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full", children: [discount, "% OFF"] })] }))] }), product.making_charges && (_jsxs("p", { className: "text-xs text-[#9e9790]", children: ["Includes making charges of ", formatCurrency(Number(product.making_charges))] })), product.variants.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-[#C9933A] uppercase tracking-wider mb-2", children: "Select Size / Variant" }), _jsx("div", { className: "flex flex-wrap gap-2", children: product.variants.map((v) => (_jsxs("button", { onClick: () => setSelectedVariant(v.id === selectedVariant?.id ? null : v), disabled: v.stock === 0, className: `px-3 py-2 text-sm rounded-lg border transition-all ${v.id === selectedVariant?.id
                                                        ? 'bg-[#6B1E1E] text-white border-[#6B1E1E]'
                                                        : v.stock === 0
                                                            ? 'border-[#E0D5C8] text-[#9e9790] opacity-50 cursor-not-allowed line-through'
                                                            : 'border-[#E8C97A]/50 text-[#1a0e0e] hover:border-[#C9933A]'}`, children: [v.label, v.price_modifier !== 0 && (_jsxs("span", { className: "ml-1 text-xs text-[#C9933A]", children: [v.price_modifier > 0 ? '+' : '', formatCurrency(Number(v.price_modifier))] }))] }, v.id))) })] })), _jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [_jsxs("div", { className: "flex items-center border border-[#E8C97A]/50 rounded-xl overflow-hidden", children: [_jsx("button", { onClick: () => setQty((q) => Math.max(1, q - 1)), className: "px-4 py-3 text-[#C9933A] hover:bg-[#FDF6E3] transition-colors", children: "\u2212" }), _jsx("span", { className: "px-4 py-3 text-sm font-medium text-[#1a0e0e] min-w-[3rem] text-center", children: qty }), _jsx("button", { onClick: () => setQty((q) => q + 1), className: "px-4 py-3 text-[#C9933A] hover:bg-[#FDF6E3] transition-colors", children: "+" })] }), _jsxs("button", { onClick: () => addToCart.mutate(), disabled: addToCart.isPending || product.stock === 0, className: "btn-crimson flex-1 flex items-center justify-center gap-2", children: [_jsx(ShoppingBag, { size: 16 }), product.stock === 0 ? 'Out of Stock' : addToCart.isPending ? 'Adding…' : 'Add to Cart'] }), _jsx("button", { onClick: () => toggleWishlist.mutate(), className: `p-3 rounded-xl border transition-all ${isWishlisted
                                                    ? 'bg-[#fde8e8] border-[#6B1E1E] text-[#6B1E1E]'
                                                    : 'border-[#E8C97A]/50 text-[#9e9790] hover:border-[#6B1E1E] hover:text-[#6B1E1E]'}`, children: _jsx(Heart, { size: 18, className: isWishlisted ? 'fill-[#6B1E1E]' : '' }) })] }), product.has_3d_model && (_jsxs(Link, { href: `/tryon/${product.slug}`, className: "btn-outline-gold w-full flex items-center justify-center gap-2", children: [_jsx(Sparkles, { size: 16 }), "Try On in 3D AR"] })), _jsx("div", { className: "grid grid-cols-2 gap-2 pt-2", children: GUARANTEES.map((g) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[#6B6560]", children: [_jsx("span", { className: "text-[#C9933A]", children: g.icon }), g.text] }, g.text))) }), product.short_description && (_jsx("p", { className: "text-sm text-[#6B6560] leading-relaxed border-t border-[#F0E8D5] pt-4", children: product.short_description }))] })] }), _jsx(LotusDivider, { className: "my-12" }), _jsxs("div", { children: [_jsx("div", { className: "flex border-b border-[#F0E8D5] mb-6", children: ['details', 'shipping', 'reviews'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab
                                        ? 'text-[#C9933A] border-[#C9933A]'
                                        : 'text-[#6B6560] border-transparent hover:text-[#C9933A]'}`, children: tab }, tab))) }), activeTab === 'details' && (_jsxs("div", { className: "grid sm:grid-cols-2 gap-8 max-w-2xl", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-[#1a0e0e] mb-3", style: { fontFamily: 'var(--font-cormorant)' }, children: "Description" }), _jsx("p", { className: "text-sm text-[#6B6560] leading-relaxed", children: product.description })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-[#1a0e0e] mb-3", style: { fontFamily: 'var(--font-cormorant)' }, children: "Specifications" }), _jsx("dl", { className: "space-y-2 text-sm", children: [
                                                    ['Metal', product.metal_type],
                                                    ['Purity', product.purity],
                                                    ['Weight', product.weight_gm ? `${product.weight_gm}g` : null],
                                                    ['Stone Details', product.stone_details],
                                                    ['SKU', product.sku],
                                                ].filter(([, v]) => v).map(([label, value]) => (_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("dt", { className: "text-[#9e9790] shrink-0", children: label }), _jsx("dd", { className: "text-[#1a0e0e] text-right", children: value })] }, label))) })] })] })), activeTab === 'shipping' && (_jsxs("div", { className: "max-w-lg space-y-4 text-sm text-[#6B6560]", children: [_jsx("p", { children: "\u2726 Free shipping on all orders above \u20B95,000 across India" }), _jsx("p", { children: "\u2726 Standard delivery: 4\u20137 business days" }), _jsx("p", { children: "\u2726 Express delivery: 1\u20132 business days (\u20B9199 extra)" }), _jsx("p", { children: "\u2726 All jewellery shipped in secure, tamper-proof packaging" }), _jsx("p", { children: "\u2726 30-day hassle-free return policy for unused items in original packaging" }), _jsx("p", { children: "\u2726 Exchange available for sizing issues within 15 days" })] })), activeTab === 'reviews' && (_jsx("div", { children: product.review_count === 0 ? (_jsx("p", { className: "text-[#6B6560] text-sm", children: "No reviews yet. Be the first to review!" })) : (_jsx("div", { className: "flex items-center gap-4 mb-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-4xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: product.avg_rating.toFixed(1) }), _jsx("div", { className: "flex justify-center mt-1", children: [1, 2, 3, 4, 5].map((s) => (_jsx(Star, { size: 14, className: s <= Math.round(product.avg_rating) ? 'text-[#C9933A] fill-[#C9933A]' : 'text-[#E0D5C8]' }, s))) }), _jsxs("p", { className: "text-xs text-[#9e9790] mt-1", children: [product.review_count, " reviews"] })] }) })) }))] })] }), _jsx(AnimatePresence, { children: zoomOpen && images[activeImg] && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4", onClick: () => setZoomOpen(false), children: _jsx("div", { className: "relative w-full max-w-3xl aspect-square", children: _jsx(Image, { src: images[activeImg].zoom_url ?? images[activeImg].large_url ?? images[activeImg].url, alt: product.name, fill: true, className: "object-contain", sizes: "800px" }) }) })) })] }));
}
