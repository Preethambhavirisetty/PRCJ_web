import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Search } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils';
import { GoldDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export default function AdminOrdersPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin-orders', search, status, page],
        queryFn: async () => {
            const res = await adminAPI.orders.list({
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                page,
                size: 20,
            });
            return res.data.data;
        },
    });
    const updateStatus = useMutation({
        mutationFn: ({ id, status }) => adminAPI.orders.updateStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });
    const orders = data?.items ?? [];
    return (_jsxs("div", { className: "p-6 space-y-5", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest mb-1", children: "Manage" }), _jsx("h1", { className: "text-2xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Orders" })] }), _jsx(GoldDivider, {}), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "relative flex-1 min-w-48", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, placeholder: "Search by order number\u2026", className: "w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]" })] }), _jsx("select", { value: status, onChange: (e) => { setStatus(e.target.value); setPage(1); }, className: "px-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A] bg-white capitalize", children: STATUS_OPTIONS.map((s) => (_jsx("option", { value: s, className: "capitalize", children: s === 'all' ? 'All Statuses' : s }, s))) })] }), isLoading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx(MandalaSpinner, { size: 56 }) })) : (_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[#F8F4E8]", children: _jsxs("tr", { className: "text-left text-xs text-[#9e9790] uppercase tracking-wider", children: [_jsx("th", { className: "px-4 py-3", children: "Order" }), _jsx("th", { className: "px-4 py-3", children: "Customer" }), _jsx("th", { className: "px-4 py-3", children: "Date" }), _jsx("th", { className: "px-4 py-3", children: "Total" }), _jsx("th", { className: "px-4 py-3", children: "Payment" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-[#F8F4E8]", children: orders.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "py-12 text-center", children: [_jsx(ShoppingCart, { size: 36, className: "text-[#E8C97A] mx-auto mb-2" }), _jsx("p", { className: "text-[#9e9790]", children: "No orders found" })] }) })) : (orders.map((order) => (_jsxs("tr", { className: "hover:bg-[#FEFDF9] transition-colors", children: [_jsxs("td", { className: "px-4 py-3 font-mono text-xs font-medium text-[#C9933A]", children: ["#", order.order_number] }), _jsx("td", { className: "px-4 py-3 text-[#1a0e0e]", children: order.shipping_full_name }), _jsx("td", { className: "px-4 py-3 text-xs text-[#9e9790]", children: formatDate(order.created_at) }), _jsx("td", { className: "px-4 py-3 font-semibold", children: formatCurrency(order.total) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `text-xs px-2 py-1 rounded-full font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        order.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'}`, children: order.payment_status }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("select", { value: order.status, onChange: (e) => updateStatus.mutate({ id: order.id, status: e.target.value }), className: `text-xs px-2 py-1.5 rounded-lg border-0 font-medium outline-none cursor-pointer ${getOrderStatusColor(order.status)}`, children: STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (_jsx("option", { value: s, className: "bg-white text-[#1a0e0e]", children: s }, s))) }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("a", { href: `/admin/orders/${order.id}`, className: "text-xs text-[#C9933A] hover:underline", children: "View" }) })] }, order.id)))) })] }) }), (data?.pages ?? 1) > 1 && (_jsx("div", { className: "flex justify-center gap-2 p-4 border-t border-[#F0E8D5]", children: Array.from({ length: data.pages }, (_, i) => i + 1).slice(0, 10).map((p) => (_jsx("button", { onClick: () => setPage(p), className: `w-8 h-8 text-xs rounded-lg border transition-colors ${page === p ? 'bg-[#C9933A] text-white border-[#C9933A]' : 'border-[#E8C97A]/50 hover:border-[#C9933A]'}`, children: p }, p))) }))] }))] }));
}
