import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import Image from '@/lib/Image.jsx';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Sparkles, Star } from 'lucide-react';
import { formatCurrency, getDiscountPercent, getImageUrl, getThumbUrl } from '@/lib/utils';
import { cartAPI, wishlistAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
export function ProductCard({ product, className }) {
    const [hovered, setHovered] = useState(false);
    const [imgIdx, setImgIdx] = useState(0);
    const { setCart } = useCartStore();
    const { has, toggle } = useWishlistStore();
    const isWishlisted = has(product.id);
    const images = product.images ?? [];
    const primaryImg = getImageUrl(product);
    const secondImg = images[1]?.medium_url ?? images[1]?.url ?? primaryImg;
    const discountPct = product.sale_price && product.sale_price < product.price
        ? getDiscountPercent(product.price, product.sale_price)
        : 0;
    const addToCart = useMutation({
        mutationFn: () => cartAPI.add(product.id, 1),
        onSuccess: async () => {
            const { data: cartData } = await cartAPI.get();
            setCart(cartData.data);
            toast.success('Added to cart!');
        },
        onError: () => toast.error('Please login to add to cart'),
    });
    const toggleWishlist = useMutation({
        mutationFn: () => isWishlisted
            ? wishlistAPI.remove(product.id)
            : wishlistAPI.add(product.id),
        onSuccess: () => {
            toggle(product.id);
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
        },
        onError: () => toast.error('Please login to save items'),
    });
    const effectivePrice = product.sale_price ?? product.price;
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4 }, className: cn('product-card group relative bg-white rounded-2xl overflow-hidden border border-[#F0E8D5] gold-border-hover', className), onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), children: [_jsxs(Link, { href: `/shop/${product.slug}`, className: "block relative aspect-square overflow-hidden bg-[#F8F4E8]", children: [_jsx(Image, { src: hovered && images.length > 1 ? secondImg : primaryImg, alt: product.name, fill: true, className: "object-cover transition-transform duration-500 group-hover:scale-105", sizes: "(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" }), _jsxs("div", { className: "absolute top-2 left-2 flex flex-col gap-1", children: [discountPct > 0 && (_jsxs("span", { className: "text-[10px] font-bold bg-[#6B1E1E] text-white px-2 py-0.5 rounded-full", children: ["-", discountPct, "%"] })), product.is_new_arrival && (_jsx("span", { className: "text-[10px] font-bold bg-[#C9933A] text-white px-2 py-0.5 rounded-full", children: "New" })), product.is_best_seller && (_jsx("span", { className: "text-[10px] font-bold bg-[#3D1010] text-[#E8C97A] px-2 py-0.5 rounded-full", children: "Bestseller" }))] }), product.has_3d_model && (_jsxs(Link, { href: `/tryon/${product.slug}`, className: "absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-[#6B1E1E] px-2 py-0.5 rounded-full border border-[#C9933A]/40 flex items-center gap-1 hover:bg-[#FDF6E3]", onClick: (e) => e.stopPropagation(), children: [_jsx(Sparkles, { size: 9 }), "Try-On"] })), _jsxs("div", { className: cn('absolute inset-x-0 bottom-0 flex justify-center gap-2 p-3 transition-all duration-300', hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'), children: [_jsxs("button", { onClick: (e) => { e.preventDefault(); addToCart.mutate(); }, disabled: addToCart.isPending || product.stock === 0, className: "flex items-center gap-1.5 px-3 py-2 bg-[#6B1E1E] text-white text-xs font-medium rounded-lg hover:bg-[#5A1818] transition-colors disabled:opacity-60", children: [_jsx(ShoppingBag, { size: 12 }), product.stock === 0 ? 'Sold Out' : 'Add to Cart'] }), _jsx(Link, { href: `/shop/${product.slug}`, className: "p-2 bg-white rounded-lg border border-[#E8C97A]/50 hover:bg-[#FDF6E3] transition-colors", children: _jsx(Eye, { size: 14, className: "text-[#C9933A]" }) })] })] }), _jsxs("div", { className: "p-3", children: [_jsx("p", { className: "text-[10px] text-[#C9933A] uppercase tracking-widest mb-1 font-medium", children: product.metal_type }), _jsx(Link, { href: `/shop/${product.slug}`, children: _jsx("h3", { className: "text-sm font-medium text-[#1a0e0e] line-clamp-2 hover:text-[#C9933A] transition-colors leading-snug mb-2", style: { fontFamily: 'var(--font-cormorant)', fontSize: '15px' }, children: product.name }) }), product.review_count > 0 && (_jsxs("div", { className: "flex items-center gap-1 mb-2", children: [_jsx("div", { className: "flex", children: [1, 2, 3, 4, 5].map((s) => (_jsx(Star, { size: 10, className: s <= Math.round(product.avg_rating) ? 'text-[#C9933A] fill-[#C9933A]' : 'text-[#E0D5C8]' }, s))) }), _jsxs("span", { className: "text-[10px] text-[#9e9790]", children: ["(", product.review_count, ")"] })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-baseline gap-1.5", children: [_jsx("span", { className: "text-base font-bold text-[#1a0e0e]", children: formatCurrency(effectivePrice) }), discountPct > 0 && (_jsx("span", { className: "text-xs text-[#9e9790] line-through", children: formatCurrency(product.price) }))] }), _jsx("button", { onClick: () => toggleWishlist.mutate(), className: cn('p-1.5 rounded-full transition-colors', isWishlisted
                                    ? 'text-[#6B1E1E] bg-[#fde8e8]'
                                    : 'text-[#9e9790] hover:text-[#6B1E1E] hover:bg-[#fde8e8]'), children: _jsx(Heart, { size: 14, className: isWishlisted ? 'fill-[#6B1E1E]' : '' }) })] })] })] }));
}
