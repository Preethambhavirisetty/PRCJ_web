import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils';
import { LotusDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
const STATUS_ICONS = {
    pending: _jsx(Clock, { size: 14 }),
    confirmed: _jsx(CheckCircle, { size: 14 }),
    processing: _jsx(Package, { size: 14 }),
    shipped: _jsx(Truck, { size: 14 }),
    delivered: _jsx(CheckCircle, { size: 14 }),
    cancelled: _jsx(XCircle, { size: 14 }),
};
export default function OrdersPage() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ['my-orders'],
        queryFn: async () => {
            const res = await ordersAPI.list({ size: 20 });
            return res.data.data.items;
        },
    });
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-8", children: _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6", children: _jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "My Orders" }) }) }), _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-8", children: isLoading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx(MandalaSpinner, { size: 56 }) })) : !orders?.length ? (_jsxs("div", { className: "text-center py-20 space-y-4", children: [_jsx(Package, { size: 64, className: "text-[#E8C97A] mx-auto" }), _jsx("h2", { className: "heading-md text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "No orders yet" }), _jsx("p", { className: "text-[#6B6560] text-sm", children: "Your order history will appear here" }), _jsx(Link, { href: "/shop", className: "btn-gold inline-block", children: "Start Shopping" })] })) : (_jsx("div", { className: "space-y-4", children: orders.map((order) => (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm font-bold text-[#1a0e0e]", children: ["Order #", order.order_number] }), _jsx("p", { className: "text-xs text-[#9e9790] mt-0.5", children: formatDate(order.created_at) })] }), _jsxs("span", { className: `flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${getOrderStatusColor(order.status)}`, children: [STATUS_ICONS[order.status], order.status.charAt(0).toUpperCase() + order.status.slice(1)] })] }), _jsx(LotusDivider, { className: "my-3" }), _jsxs("div", { className: "space-y-2 mb-4", children: [order.items.slice(0, 2).map((item) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-[#1a0e0e] line-clamp-1", children: item.product_name }), _jsxs("span", { className: "text-[#6B6560] ml-2 shrink-0", children: ["\u00D7", item.quantity] })] }, item.id))), order.items.length > 2 && (_jsxs("p", { className: "text-xs text-[#9e9790]", children: ["+", order.items.length - 2, " more items"] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#9e9790]", children: "Total" }), _jsx("p", { className: "font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: formatCurrency(order.total) })] }), order.tracking_number && (_jsxs("p", { className: "text-xs text-[#6B6560]", children: ["Tracking: ", _jsx("span", { className: "font-mono text-[#C9933A]", children: order.tracking_number })] })), _jsxs(Link, { href: `/account/orders/${order.id}`, className: "flex items-center gap-1 text-sm text-[#C9933A] hover:text-[#A8771F] font-medium", children: ["View Details ", _jsx(ChevronRight, { size: 14 })] })] })] }, order.id))) })) })] }));
}
