import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import Image from '@/lib/Image.jsx';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { cartAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency, getThumbUrl } from '@/lib/utils';
import { LotusDivider, PaisleyBg, GoldDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
export default function CartPage() {
    const [couponInput, setCouponInput] = useState('');
    const { cart, setCart, couponCode, discountAmount, setCoupon } = useCartStore();
    useQuery({
        queryKey: ['cart-page'],
        queryFn: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            return data.data;
        },
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
            toast.success('Item removed');
        },
    });
    const applyCoupon = useMutation({
        mutationFn: () => cartAPI.applyCoupon(couponInput),
        onSuccess: (res) => {
            const result = res.data.data;
            setCoupon(couponInput, result.discount_amount);
            toast.success(`Coupon applied! You save ${formatCurrency(result.discount_amount)}`);
        },
        onError: () => toast.error('Invalid or expired coupon'),
    });
    const removeCoupon = useMutation({
        mutationFn: () => cartAPI.removeCoupon(),
        onSuccess: () => {
            setCoupon(null, 0);
            setCouponInput('');
            toast.success('Coupon removed');
        },
    });
    const items = cart?.items ?? [];
    const subtotal = cart?.subtotal ?? 0;
    const shipping = subtotal >= 5000 ? 0 : 199;
    const total = subtotal - discountAmount + shipping;
    if (!cart) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx(MandalaSpinner, { size: 56 }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-8", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 text-center", children: [_jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Your Cart" }), _jsxs("p", { className: "text-sm text-[#6B6560] mt-1", children: [items.length, " item", items.length !== 1 ? 's' : ''] })] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-10", children: items.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 gap-6 text-center", children: [_jsx(ShoppingBag, { size: 64, className: "text-[#E8C97A]" }), _jsxs("div", { children: [_jsx("h2", { className: "heading-md text-[#1a0e0e] mb-2", style: { fontFamily: 'var(--font-cormorant)' }, children: "Your cart is empty" }), _jsx("p", { className: "text-[#6B6560] text-sm", children: "Add some beautiful jewellery to get started" })] }), _jsx(Link, { href: "/shop", className: "btn-gold", children: "Explore Jewellery" })] })) : (_jsxs("div", { className: "grid lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: items.map((item) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, x: -20 }, className: "flex gap-5 p-4 bg-white rounded-2xl border border-[#F0E8D5]", children: [_jsx(Link, { href: `/shop/${item.product.slug}`, className: "relative w-24 h-24 rounded-xl overflow-hidden bg-[#F8F4E8] shrink-0", children: _jsx(Image, { src: getThumbUrl(item.product), alt: item.product.name, fill: true, className: "object-cover", sizes: "96px" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between gap-2", children: [_jsx(Link, { href: `/shop/${item.product.slug}`, children: _jsx("h3", { className: "font-medium text-[#1a0e0e] hover:text-[#C9933A] transition-colors line-clamp-2 leading-snug", style: { fontFamily: 'var(--font-cormorant)', fontSize: '16px' }, children: item.product.name }) }), _jsx("button", { onClick: () => removeMutation.mutate(item.id), className: "text-[#9e9790] hover:text-[#6B1E1E] transition-colors shrink-0", children: _jsx(Trash2, { size: 15 }) })] }), _jsx("p", { className: "text-xs text-[#C9933A] mt-0.5 mb-1", children: item.product.metal_type }), item.variant && (_jsx("p", { className: "text-xs text-[#9e9790]", children: item.variant.label })), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsxs("div", { className: "flex items-center border border-[#E8C97A]/50 rounded-lg overflow-hidden", children: [_jsx("button", { onClick: () => updateMutation.mutate({ itemId: item.id, qty: item.quantity - 1 }), disabled: item.quantity <= 1, className: "px-3 py-1.5 text-[#C9933A] hover:bg-[#FDF6E3] disabled:opacity-40", children: _jsx(Minus, { size: 12 }) }), _jsx("span", { className: "px-4 py-1.5 text-sm font-medium text-[#1a0e0e]", children: item.quantity }), _jsx("button", { onClick: () => updateMutation.mutate({ itemId: item.id, qty: item.quantity + 1 }), className: "px-3 py-1.5 text-[#C9933A] hover:bg-[#FDF6E3]", children: _jsx(Plus, { size: 12 }) })] }), _jsx("p", { className: "font-bold text-[#1a0e0e]", children: formatCurrency(item.total_price) })] })] })] }, item.id))) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Order Summary" }), _jsx(LotusDivider, {}), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between text-[#6B6560]", children: [_jsxs("span", { children: ["Subtotal (", items.length, " items)"] }), _jsx("span", { children: formatCurrency(subtotal) })] }), discountAmount > 0 && (_jsxs("div", { className: "flex justify-between text-green-600", children: [_jsxs("span", { children: ["Discount (", couponCode, ")"] }), _jsxs("span", { children: ["- ", formatCurrency(discountAmount)] })] })), _jsxs("div", { className: "flex justify-between text-[#6B6560]", children: [_jsx("span", { children: "Shipping" }), _jsx("span", { children: shipping === 0 ? _jsx("span", { className: "text-green-600", children: "Free" }) : formatCurrency(shipping) })] }), subtotal < 5000 && (_jsxs("p", { className: "text-xs text-[#C9933A]", children: ["Add ", formatCurrency(5000 - subtotal), " more for free shipping!"] }))] }), _jsx(GoldDivider, {}), _jsxs("div", { className: "flex justify-between font-bold text-[#1a0e0e]", children: [_jsx("span", { style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Total" }), _jsx("span", { style: { fontFamily: 'var(--font-cormorant)', fontSize: '22px' }, children: formatCurrency(total) })] }), _jsxs(Link, { href: "/checkout", className: "btn-crimson w-full flex items-center justify-center gap-2", children: ["Proceed to Checkout", _jsx(ArrowRight, { size: 16 })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsxs("h3", { className: "text-sm font-semibold text-[#1a0e0e] mb-3 flex items-center gap-2", children: [_jsx(Tag, { size: 14, className: "text-[#C9933A]" }), "Apply Coupon"] }), couponCode ? (_jsxs("div", { className: "flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-green-700", children: couponCode }), _jsxs("p", { className: "text-xs text-green-600", children: ["Saving ", formatCurrency(discountAmount)] })] }), _jsx("button", { onClick: () => removeCoupon.mutate(), className: "text-xs text-red-500 hover:text-red-700", children: "Remove" })] })) : (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: couponInput, onChange: (e) => setCouponInput(e.target.value.toUpperCase()), placeholder: "Enter coupon code", className: "flex-1 px-3 py-2 text-sm border border-[#E8C97A]/50 rounded-lg outline-none focus:border-[#C9933A] uppercase" }), _jsx("button", { onClick: () => applyCoupon.mutate(), disabled: !couponInput || applyCoupon.isPending, className: "btn-gold text-sm px-4 py-2 disabled:opacity-60", children: "Apply" })] }))] })] })] })) })] }));
}
