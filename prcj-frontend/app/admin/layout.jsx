import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet } from '@/lib/router.jsx';
import { usePathname, useRouter } from '@/lib/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, MessageSquare, Grid3x3, LogOut, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
const NAV = [
    { href: '/admin', icon: _jsx(LayoutDashboard, { size: 18 }), label: 'Dashboard' },
    { href: '/admin/products', icon: _jsx(Package, { size: 18 }), label: 'Products' },
    { href: '/admin/orders', icon: _jsx(ShoppingCart, { size: 18 }), label: 'Orders' },
    { href: '/admin/users', icon: _jsx(Users, { size: 18 }), label: 'Users' },
    { href: '/admin/analytics', icon: _jsx(BarChart3, { size: 18 }), label: 'Analytics' },
    { href: '/admin/categories', icon: _jsx(Grid3x3, { size: 18 }), label: 'Categories' },
    { href: '/admin/coupons', icon: _jsx(Tag, { size: 18 }), label: 'Coupons' },
    { href: '/admin/reviews', icon: _jsx(MessageSquare, { size: 18 }), label: 'Reviews' },
];
export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
            router.replace('/auth/login');
        }
    }, [isAuthenticated, user, router]);
    const handleLogout = async () => {
        try {
            await authAPI.logout();
        }
        catch { /* ignore */ }
        logout();
        router.push('/');
        toast.success('Logged out');
    };
    const content = children ?? _jsx(Outlet, {});
    return (_jsxs("div", { className: "flex min-h-screen bg-[#0e0808]", children: [_jsxs("aside", { className: "w-56 shrink-0 bg-[#130c0c] border-r border-[#C9933A]/15 flex flex-col", children: [_jsx("div", { className: "p-5 border-b border-[#C9933A]/15", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Crown, { size: 18, className: "text-[#C9933A]" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold gold-text-static", style: { fontFamily: 'var(--font-cormorant)' }, children: "PRCJ Admin" }), _jsx("p", { className: "text-[10px] text-[#6B6560] capitalize", children: user?.role })] })] }) }), _jsx("nav", { className: "flex-1 py-4 space-y-1 px-3", children: NAV.map(({ href, icon, label }) => {
                            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                            return (_jsxs(Link, { href: href, className: cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', isActive
                                    ? 'bg-[#C9933A]/20 text-[#E8C97A] border border-[#C9933A]/20'
                                    : 'text-[#9e9790] hover:text-[#E8C97A] hover:bg-[#C9933A]/10'), children: [icon, label] }, href));
                        }) }), _jsx("div", { className: "p-3 border-t border-[#C9933A]/15", children: _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9e9790] hover:text-red-400 hover:bg-red-900/20 transition-colors w-full", children: [_jsx(LogOut, { size: 16 }), "Log Out"] }) })] }), _jsx("main", { className: "flex-1 overflow-auto bg-[#FEFDF9]", children: content })] }));
}
