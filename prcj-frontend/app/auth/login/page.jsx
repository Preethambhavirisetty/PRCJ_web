import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { LotusDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await authAPI.login(data.email, data.password);
            const { access_token, refresh_token, user } = res.data.data;
            setAuth(user, access_token, refresh_token);
            toast.success(`Welcome back, ${user.first_name}!`);
            router.push('/');
        }
        catch (err) {
            const message = err?.response?.data?.detail ?? 'Invalid credentials';
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9] flex", children: [_jsx(PaisleyBg, { className: "hidden lg:flex lg:w-1/2 bg-[#1a0e0e] items-center justify-center", children: _jsxs("div", { className: "text-center p-12 space-y-6", children: [_jsx("div", { className: "w-32 h-32 mx-auto", children: _jsx("img", { src: "/motifs/mandala.svg", alt: "", className: "w-full h-full animate-[mandala-spin_15s_linear_infinite] opacity-60" }) }), _jsxs("h2", { className: "text-4xl font-bold text-white", style: { fontFamily: 'var(--font-cormorant)' }, children: ["Welcome to ", _jsx("span", { className: "gold-text", children: "PRCJ" })] }), _jsx("p", { className: "text-[#9e9790] max-w-xs leading-relaxed", children: "Sign in to access your personalized jewellery collection, order history, and exclusive member offers." }), _jsx("div", { className: "flex justify-center gap-3 flex-wrap", children: ['Free Shipping', 'Easy Returns', 'Wishlist', 'AR Try-On'].map((f) => (_jsx("span", { className: "text-xs border border-[#C9933A]/30 text-[#C9933A] px-3 py-1 rounded-full", children: f }, f))) })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "w-full max-w-md space-y-6", children: [_jsx("div", { className: "text-center", children: _jsxs(Link, { href: "/", className: "inline-block", children: [_jsx("p", { className: "text-3xl font-bold gold-text-static", style: { fontFamily: 'var(--font-cormorant)' }, children: "PRCJ" }), _jsx("p", { className: "text-xs tracking-[0.3em] text-[#6B6560] uppercase mt-0.5", children: "Fine Jewellery" })] }) }), _jsx(LotusDivider, { label: "Sign In" }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { type: "email", placeholder: "you@email.com", ...register('email', { required: true }), className: `w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-colors ${errors.email ? 'border-red-400' : 'border-[#E8C97A]/50 focus:border-[#C9933A]'}` })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { type: showPwd ? 'text' : 'password', placeholder: "Enter your password", ...register('password', { required: true }), className: `w-full pl-10 pr-10 py-3 text-sm border rounded-xl outline-none transition-colors ${errors.password ? 'border-red-400' : 'border-[#E8C97A]/50 focus:border-[#C9933A]'}` }), _jsx("button", { type: "button", onClick: () => setShowPwd(!showPwd), className: "absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9790]", children: showPwd ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Link, { href: "/auth/forgot-password", className: "text-xs text-[#C9933A] hover:underline", children: "Forgot password?" }) }), _jsxs("button", { type: "submit", disabled: loading, className: "btn-crimson w-full flex items-center justify-center gap-2 py-3.5", children: [loading ? _jsx(MandalaSpinner, { size: 20 }) : null, loading ? 'Signing in…' : 'Sign In'] })] }), _jsxs("p", { className: "text-center text-sm text-[#6B6560]", children: ["New to PRCJ?", ' ', _jsx(Link, { href: "/auth/register", className: "text-[#C9933A] font-medium hover:underline", children: "Create Account" })] }), _jsx(LotusDivider, {}), _jsxs("p", { className: "text-xs text-center text-[#9e9790]", children: ["By signing in, you agree to PRCJ's", ' ', _jsx(Link, { href: "/terms", className: "underline", children: "Terms" }), " and", ' ', _jsx(Link, { href: "/privacy", className: "underline", children: "Privacy Policy" })] })] }) })] }));
}
