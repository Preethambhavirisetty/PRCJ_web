import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import Image from '@/lib/Image.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { cartAPI } from '@/lib/api';
import { formatCurrency, getThumbUrl } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { GoldDivider } from '@/components/brand';
export function CartDrawer() {
    const { isOpen, setOpen, cart, setCart } = useCartStore();
    const qc = useQueryClient();
    useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            return data.data;
        },
        enabled: isOpen,
    });
    const updateMutation = useMutation({
        mutationFn: ({ itemId, qty }) => cartAPI.update(itemId, qty),
        onSuccess: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
        },
    });
    const removeMutation = useMutation({
        mutationFn: (itemId) => cartAPI.remove(itemId),
        onSuccess: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            toast.success('Item removed from cart');
        },
    });
    const items = cart?.items ?? [];
    const subtotal = cart?.subtotal ?? 0;
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", onClick: () => setOpen(false) }), _jsxs(motion.aside, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'tween', duration: 0.35 }, className: "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FEFDF9] shadow-2xl flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-5 border-b border-[#F0E8D5]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShoppingBag, { size: 20, className: "text-[#C9933A]" }), _jsx("h2", { className: "text-lg font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "My Cart" }), items.length > 0 && (_jsx("span", { className: "text-xs bg-[#6B1E1E] text-white rounded-full px-2 py-0.5", children: items.length }))] }), _jsx("button", { onClick: () => setOpen(false), className: "p-2 rounded-lg hover:bg-[#F8F4E8] transition-colors text-[#6B6560]", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-4 space-y-4", children: items.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-4 text-center", children: [_jsx(ShoppingBag, { size: 48, className: "text-[#E8C97A]" }), _jsx("p", { className: "text-[#6B6560]", children: "Your cart is empty" }), _jsx(Link, { href: "/shop", onClick: () => setOpen(false), className: "btn-gold text-sm", children: "Explore Jewellery" })] })) : (items.map((item) => (_jsxs("div", { className: "flex gap-4 p-3 bg-white rounded-xl border border-[#F0E8D5]", children: [_jsx("div", { className: "relative w-20 h-20 rounded-lg overflow-hidden bg-[#F8F4E8] shrink-0", children: _jsx(Image, { src: getThumbUrl(item.product), alt: item.product.name, fill: true, className: "object-cover", sizes: "80px" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Link, { href: `/shop/${item.product.slug}`, onClick: () => setOpen(false), className: "text-sm font-medium text-[#1a0e0e] hover:text-[#C9933A] line-clamp-2 transition-colors", style: { fontFamily: 'var(--font-cormorant)' }, children: item.product.name }), item.variant && (_jsx("p", { className: "text-xs text-[#9e9790] mt-0.5", children: item.variant.label })), _jsx("p", { className: "text-sm font-semibold text-[#C9933A] mt-1", children: formatCurrency(item.unit_price) }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("div", { className: "flex items-center border border-[#E8C97A]/50 rounded-lg overflow-hidden", children: [_jsx("button", { onClick: () => updateMutation.mutate({ itemId: item.id, qty: item.quantity - 1 }), disabled: item.quantity <= 1, className: "px-2 py-1 text-[#C9933A] hover:bg-[#FDF6E3] disabled:opacity-40 transition-colors", children: _jsx(Minus, { size: 12 }) }), _jsx("span", { className: "px-3 py-1 text-sm font-medium text-[#1a0e0e]", children: item.quantity }), _jsx("button", { onClick: () => updateMutation.mutate({ itemId: item.id, qty: item.quantity + 1 }), className: "px-2 py-1 text-[#C9933A] hover:bg-[#FDF6E3] transition-colors", children: _jsx(Plus, { size: 12 }) })] }), _jsx("button", { onClick: () => removeMutation.mutate(item.id), className: "p-1.5 text-[#9e9790] hover:text-[#6B1E1E] transition-colors", children: _jsx(Trash2, { size: 14 }) })] })] })] }, item.id)))) }), items.length > 0 && (_jsxs("div", { className: "px-6 py-4 border-t border-[#F0E8D5] space-y-3 bg-white", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-[#6B6560]", children: "Subtotal" }), _jsx("span", { className: "font-semibold text-[#1a0e0e]", children: formatCurrency(subtotal) })] }), _jsx("p", { className: "text-xs text-[#9e9790]", children: "Shipping and taxes calculated at checkout" }), _jsx(GoldDivider, {}), _jsxs(Link, { href: "/checkout", onClick: () => setOpen(false), className: "btn-gold w-full flex items-center justify-center gap-2", children: ["Proceed to Checkout", _jsx(ArrowRight, { size: 16 })] }), _jsx(Link, { href: "/cart", onClick: () => setOpen(false), className: "btn-outline-gold w-full text-center text-sm", children: "View Full Cart" })] }))] })] })) }));
}
