import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Package, Heart, LogOut } from 'lucide-react';
import { Link } from '@/lib/router.jsx';
import { usersAPI, authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { LotusDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
import { useRouter } from '@/lib/navigation';
export default function ProfilePage() {
    const router = useRouter();
    const { user, setUser, logout } = useAuthStore();
    const { register, handleSubmit, reset, formState: { isDirty } } = useForm();
    useEffect(() => {
        if (user) {
            reset({ first_name: user.first_name, last_name: user.last_name, phone: user.phone });
        }
    }, [user, reset]);
    const updateProfile = useMutation({
        mutationFn: (data) => usersAPI.updateProfile(data),
        onSuccess: (res) => {
            if (res.data.data)
                setUser(res.data.data);
            toast.success('Profile updated!');
        },
        onError: () => toast.error('Failed to update profile'),
    });
    const handleLogout = async () => {
        try {
            await authAPI.logout();
        }
        catch { /* ignore */ }
        logout();
        router.push('/');
        toast.success('Logged out successfully');
    };
    const NAV_LINKS = [
        { href: '/account/orders', icon: _jsx(Package, { size: 16 }), label: 'My Orders' },
        { href: '/account/wishlist', icon: _jsx(Heart, { size: 16 }), label: 'Wishlist' },
        { href: '/account/profile', icon: _jsx(User, { size: 16 }), label: 'Profile' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-8", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6", children: [_jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "My Account" }), user && (_jsxs("p", { className: "text-[#6B6560] text-sm mt-1", children: ["Welcome, ", user.first_name, " ", user.last_name] }))] }) }), _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-8", children: _jsxs("div", { className: "grid lg:grid-cols-4 gap-6", children: [_jsxs("aside", { className: "space-y-1", children: [NAV_LINKS.map((link) => (_jsxs(Link, { href: link.href, className: "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1a0e0e] hover:bg-[#FDF6E3] hover:text-[#C9933A] transition-colors", children: [link.icon, link.label] }, link.href))), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#6B1E1E] hover:bg-[#fde8e8] transition-colors w-full", children: [_jsx(LogOut, { size: 16 }), "Log Out"] })] }), _jsx("div", { className: "lg:col-span-3", children: _jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl border border-[#F0E8D5] p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)' }, children: "Personal Information" }), _jsx(LotusDivider, { className: "mb-6" }), _jsxs("form", { onSubmit: handleSubmit((d) => updateProfile.mutate(d)), className: "space-y-5", children: [_jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "First Name" }), _jsx("input", { ...register('first_name', { required: true }), className: "w-full px-4 py-3 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Last Name" }), _jsx("input", { ...register('last_name', { required: true }), className: "w-full px-4 py-3 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Email Address" }), _jsx("input", { type: "email", value: user?.email ?? '', disabled: true, className: "w-full px-4 py-3 text-sm border border-[#E8C97A]/30 rounded-xl bg-[#F8F4E8] text-[#9e9790] cursor-not-allowed" }), _jsx("p", { className: "text-xs text-[#9e9790] mt-1", children: "Email cannot be changed" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Phone Number" }), _jsx("input", { ...register('phone', { required: true }), type: "tel", className: "w-full px-4 py-3 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]" })] }), _jsx("div", { className: "pt-2", children: _jsxs("button", { type: "submit", disabled: !isDirty || updateProfile.isPending, className: "btn-gold disabled:opacity-60 flex items-center gap-2", children: [updateProfile.isPending && _jsx(MandalaSpinner, { size: 18 }), "Save Changes"] }) })] })] }) })] }) })] }));
}
