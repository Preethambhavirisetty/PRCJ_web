import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from 'recharts';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { GoldDivider, LotusDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
const PERIODS = ['7d', '30d', '90d', '1y'];
const PIE_COLORS = ['#C9933A', '#6B1E1E', '#E8C97A', '#3D1010', '#A8771F', '#2a0b0b', '#F9E8B5'];
export default function AnalyticsPage() {
    const [period, setPeriod] = useState('30d');
    const { data: sales, isLoading: salesLoading } = useQuery({
        queryKey: ['admin-sales', period],
        queryFn: async () => {
            const res = await adminAPI.analytics.sales(period);
            return res.data.data;
        },
    });
    const { data: topProducts } = useQuery({
        queryKey: ['admin-top-products', period],
        queryFn: async () => {
            const res = await adminAPI.analytics.topProducts(period);
            return res.data.data;
        },
    });
    const { data: topCategories } = useQuery({
        queryKey: ['admin-top-categories', period],
        queryFn: async () => {
            const res = await adminAPI.analytics.topCategories(period);
            return res.data.data;
        },
    });
    const statusData = sales?.status_distribution
        ? Object.entries(sales.status_distribution).map(([name, value]) => ({ name, value }))
        : [];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest mb-1", children: "Reports" }), _jsx("h1", { className: "text-2xl font-bold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Analytics" })] }), _jsx("div", { className: "flex border border-[#E8C97A]/50 rounded-xl overflow-hidden", children: PERIODS.map((p) => (_jsx("button", { onClick: () => setPeriod(p), className: `px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-[#C9933A] text-white' : 'text-[#6B6560] hover:text-[#C9933A]'}`, children: p }, p))) })] }), _jsx(GoldDivider, {}), salesLoading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx(MandalaSpinner, { size: 56 }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Daily Revenue" }), _jsx(LotusDivider, { className: "mb-4" }), _jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(LineChart, { data: sales?.daily_series ?? [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#F0E8D5" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11, fill: '#9e9790' } }), _jsx(YAxis, { tick: { fontSize: 11, fill: '#9e9790' }, tickFormatter: (v) => `₹${(v / 1000).toFixed(0)}k` }), _jsx(Tooltip, { formatter: (value) => formatCurrency(Number(value)), contentStyle: { borderRadius: '12px', border: '1px solid #E8C97A', background: '#FEFDF9' } }), _jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "#C9933A", strokeWidth: 2.5, dot: false }), _jsx(Line, { type: "monotone", dataKey: "orders", stroke: "#6B1E1E", strokeWidth: 1.5, dot: false })] }) })] }), _jsxs("div", { className: "grid lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Order Status Distribution" }), _jsx(LotusDivider, { className: "mb-4" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: statusData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 80, label: true, children: statusData.map((_, i) => (_jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))) }), _jsx(Legend, { formatter: (value) => _jsx("span", { className: "text-xs capitalize", children: value }) }), _jsx(Tooltip, {})] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Top Categories by Revenue" }), _jsx(LotusDivider, { className: "mb-4" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: (topCategories ?? []).slice(0, 6), layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#F0E8D5" }), _jsx(XAxis, { type: "number", tick: { fontSize: 10 }, tickFormatter: (v) => `₹${(v / 1000).toFixed(0)}k` }), _jsx(YAxis, { type: "category", dataKey: "category", tick: { fontSize: 10, fill: '#6B6560' }, width: 80 }), _jsx(Tooltip, { formatter: (v) => formatCurrency(Number(v)) }), _jsx(Bar, { dataKey: "revenue", fill: "#C9933A", radius: [0, 4, 4, 0] })] }) })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5", children: [_jsx("h2", { className: "font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Top Selling Products" }), _jsx(LotusDivider, { className: "mb-4" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-xs text-[#9e9790] uppercase tracking-wider border-b border-[#F0E8D5]", children: [_jsx("th", { className: "pb-3 pr-4", children: "#" }), _jsx("th", { className: "pb-3 pr-4", children: "Product" }), _jsx("th", { className: "pb-3 pr-4 text-right", children: "Units Sold" }), _jsx("th", { className: "pb-3 text-right", children: "Revenue" })] }) }), _jsx("tbody", { className: "divide-y divide-[#F8F4E8]", children: (topProducts ?? []).map((p, i) => (_jsxs("tr", { children: [_jsx("td", { className: "py-3 pr-4 text-[#9e9790]", children: i + 1 }), _jsx("td", { className: "py-3 pr-4 font-medium text-[#1a0e0e]", children: p.product_name }), _jsx("td", { className: "py-3 pr-4 text-right text-[#6B6560]", children: p.units_sold }), _jsx("td", { className: "py-3 text-right font-semibold text-[#C9933A]", children: formatCurrency(p.revenue) })] }, p.product_id))) })] }) })] })] }))] }));
}
