import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import Image from '@/lib/Image.jsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { wishlistAPI, cartAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { LotusDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
export default function WishlistPage() {
    const { setCart } = useCartStore();
    const { setIds, toggle } = useWishlistStore();
    const { data: items, isLoading, refetch } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await wishlistAPI.get();
            const wishlistItems = res.data.data.items;
            setIds(wishlistItems.map((i) => i.product_id));
            return wishlistItems;
        },
    });
    const removeItem = useMutation({
        mutationFn: (productId) => wishlistAPI.remove(productId),
        onSuccess: (_, productId) => {
            toggle(productId);
            refetch();
            toast.success('Removed from wishlist');
        },
    });
    const addToCart = useMutation({
        mutationFn: (productId) => cartAPI.add(productId, 1),
        onSuccess: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            useCartStore.getState().setOpen(true);
            toast.success('Added to cart!');
        },
    });
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-8", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: [_jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "My Wishlist" }), items?.length ? (_jsxs("p", { className: "text-sm text-[#6B6560] mt-1", children: [items.length, " saved pieces"] })) : null] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-10", children: isLoading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx(MandalaSpinner, { size: 56 }) })) : !items?.length ? (_jsxs("div", { className: "text-center py-20 space-y-4", children: [_jsx(Heart, { size: 64, className: "text-[#E8C97A] mx-auto" }), _jsx("h2", { className: "heading-md text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Your wishlist is empty" }), _jsx("p", { className: "text-[#6B6560] text-sm", children: "Save pieces you love and come back to them anytime" }), _jsx(Link, { href: "/shop", className: "btn-gold inline-block", children: "Explore Jewellery" })] })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4", children: items.map((item) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "group bg-white rounded-2xl border border-[#F0E8D5] overflow-hidden gold-border-hover", children: [_jsx(Link, { href: `/shop/${item.product.slug}`, className: "block relative aspect-square bg-[#F8F4E8] overflow-hidden", children: _jsx(Image, { src: getImageUrl(item.product), alt: item.product.name, fill: true, className: "object-cover group-hover:scale-105 transition-transform duration-300", sizes: "(max-width:640px) 50vw, 25vw" }) }), _jsxs("div", { className: "p-3", children: [_jsx("p", { className: "text-[10px] text-[#C9933A] uppercase tracking-widest mb-0.5", children: item.product.metal_type }), _jsx(Link, { href: `/shop/${item.product.slug}`, children: _jsx("h3", { className: "text-sm text-[#1a0e0e] hover:text-[#C9933A] line-clamp-2 leading-snug mb-2", style: { fontFamily: 'var(--font-cormorant)', fontSize: '14px' }, children: item.product.name }) }), _jsx("p", { className: "font-bold text-[#1a0e0e] mb-3", children: formatCurrency(item.product.sale_price ?? item.product.price) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => addToCart.mutate(item.product_id), className: "flex-1 btn-gold text-xs py-2 flex items-center justify-center gap-1", children: [_jsx(ShoppingBag, { size: 11 }), " Add"] }), _jsx("button", { onClick: () => removeItem.mutate(item.product_id), className: "p-2 text-[#6B1E1E] bg-[#fde8e8] rounded-lg hover:bg-[#f9c6c6] transition-colors", children: _jsx(Heart, { size: 13, className: "fill-[#6B1E1E]" }) })] })] })] }, item.id))) })) })] }));
}
