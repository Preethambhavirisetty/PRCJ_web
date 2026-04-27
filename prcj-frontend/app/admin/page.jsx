import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Users, Package, Star, RefreshCw } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LotusDivider, GoldDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
export default function AdminDashboard() {
    const { data: dash, isLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const res = await adminAPI.dashboard();
            return res.data.data;
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen bg-[#FEFDF9]", children: _jsx(MandalaSpinner, { size: 56 }) }));
    }
    const STAT_CARDS = [
        {
            label: 'Total Revenue',
            value: formatCurrency(dash?.total_revenue ?? 0),
            sub: `${dash?.revenue_growth ?? 0}% vs last month`,
            icon: _jsx(TrendingUp, { size: 20 }),
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Total Orders',
            value: (dash?.total_orders ?? 0).toLocaleString('en-IN'),
            sub: `${dash?.new_orders ?? 0} new today`,
            icon: _jsx(ShoppingCart, { size: 20 }),
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Customers',
            value: (dash?.total_customers ?? 0).toLocaleString('en-IN'),
            sub: `${dash?.new_customers ?? 0} new this month`,
            icon: _jsx(Users, { size: 20 }),
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            label: 'Active Products',
            value: `${dash?.active_products ?? 0} / ${dash?.total_products ?? 0}`,
            sub: 'In catalogue',
            icon: _jsx(Package, { size: 20 }),
            color: 'text-[#C9933A]',
            bg: 'bg-[#FDF6E3]',
        },
        {
            label: 'Avg Order Value',
            value: formatCurrency(dash?.avg_order_value ?? 0),
            sub: 'Per transaction',
            icon: _jsx(TrendingUp, { size: 20 }),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            label: 'Pending Reviews',
            value: String(dash?.pending_reviews ?? 0),
            sub: 'Awaiting moderation',
            icon: _jsx(Star, { size: 20 }),
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest mb-1", children: "Overview" }), _jsx("h1", { className: "text-2xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Admin Dashboard" })] }), _jsx(GoldDivider, {}), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-4", children: STAT_CARDS.map((stat, i) => (_jsxs(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 }, className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsx("div", { className: `w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} mb-3`, children: stat.icon }), _jsx("p", { className: "text-xs text-[#9e9790] uppercase tracking-wider mb-1", children: stat.label }), _jsx("p", { className: "text-xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)', fontSize: '22px' }, children: stat.value }), _jsx("p", { className: "text-xs text-[#6B6560] mt-0.5", children: stat.sub })] }, stat.label))) }), _jsxs("div", { className: "grid lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Recent Orders" }), _jsx("a", { href: "/admin/orders", className: "text-xs text-[#C9933A] hover:underline", children: "View All" })] }), _jsx(LotusDivider, { className: "mb-4" }), _jsxs("div", { className: "space-y-3", children: [(dash?.recent_orders ?? []).map((order) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium text-[#1a0e0e]", children: ["#", order.order_number] }), _jsxs("p", { className: "text-xs text-[#9e9790]", children: [order.customer_name, " \u00B7 ", formatDate(order.created_at)] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-[#1a0e0e]", children: formatCurrency(order.total) }), _jsx("span", { className: `text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-yellow-100 text-yellow-700'}`, children: order.status })] })] }, order.id))), !dash?.recent_orders?.length && (_jsx("p", { className: "text-sm text-[#9e9790] text-center py-4", children: "No recent orders" }))] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Low Stock Alert" }), _jsx("a", { href: "/admin/products", className: "text-xs text-[#C9933A] hover:underline", children: "Manage" })] }), _jsx(LotusDivider, { className: "mb-4" }), _jsxs("div", { className: "space-y-3", children: [(dash?.low_stock_products ?? []).map((p) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("p", { className: "text-[#1a0e0e] line-clamp-1 flex-1", children: p.name }), _jsx("span", { className: `ml-3 font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`, children: p.stock === 0 ? 'OUT' : `${p.stock} left` })] }, p.id))), !dash?.low_stock_products?.length && (_jsxs("div", { className: "flex items-center justify-center gap-2 text-green-600 py-4", children: [_jsx(RefreshCw, { size: 14 }), _jsx("p", { className: "text-sm", children: "All products well stocked" })] }))] })] })] })] }));
}
