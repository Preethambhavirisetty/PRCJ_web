import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@/lib/router.jsx';
import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Phone, Mail, Lock } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { LotusDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
export default function RegisterPage() {
    const router = useRouter();
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const password = watch('password');
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await authAPI.register({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                password: data.password,
            });
            toast.success('Account created! Please verify your email.');
            router.push('/auth/login');
        }
        catch (err) {
            const msg = err?.response?.data?.detail ?? 'Registration failed';
            toast.error(msg);
        }
        finally {
            setLoading(false);
        }
    };
    const fields = [
        { label: 'First Name', key: 'first_name', type: 'text', icon: _jsx(User, { size: 16 }), placeholder: 'Priya', col: 1 },
        { label: 'Last Name', key: 'last_name', type: 'text', icon: _jsx(User, { size: 16 }), placeholder: 'Sharma', col: 1 },
        { label: 'Email Address', key: 'email', type: 'email', icon: _jsx(Mail, { size: 16 }), placeholder: 'you@email.com', col: 2 },
        { label: 'Phone Number', key: 'phone', type: 'tel', icon: _jsx(Phone, { size: 16 }), placeholder: '9876543210', col: 1 },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9] flex", children: [_jsx(PaisleyBg, { className: "hidden lg:flex lg:w-1/2 bg-[#1a0e0e] items-center justify-center", children: _jsxs("div", { className: "text-center p-12 space-y-6", children: [_jsx("div", { className: "w-32 h-32 mx-auto", children: _jsx("img", { src: "/motifs/mandala.svg", alt: "", className: "w-full h-full animate-[mandala-spin_15s_linear_infinite] opacity-60" }) }), _jsxs("h2", { className: "text-4xl font-bold text-white", style: { fontFamily: 'var(--font-cormorant)' }, children: ["Join the ", _jsx("span", { className: "gold-text", children: "PRCJ" }), " Family"] }), _jsx("p", { className: "text-[#9e9790] max-w-xs leading-relaxed", children: "Create your account to enjoy exclusive discounts, wishlist, order tracking, and our revolutionary 3D AR try-on feature." })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "w-full max-w-md space-y-5 py-8", children: [_jsx("div", { className: "text-center", children: _jsxs(Link, { href: "/", children: [_jsx("p", { className: "text-3xl font-bold gold-text-static", style: { fontFamily: 'var(--font-cormorant)' }, children: "PRCJ" }), _jsx("p", { className: "text-xs tracking-[0.3em] text-[#6B6560] uppercase mt-0.5", children: "Fine Jewellery" })] }) }), _jsx(LotusDivider, { label: "Create Account" }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 gap-4", children: fields.slice(0, 2).map(({ label, key, type, placeholder }) => (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: label }), _jsx("input", { type: type, placeholder: placeholder, ...register(key, { required: true }), className: `w-full px-4 py-3 text-sm border rounded-xl outline-none transition-colors ${errors[key] ? 'border-red-400' : 'border-[#E8C97A]/50 focus:border-[#C9933A]'}` })] }, key))) }), fields.slice(2).map(({ label, key, type, placeholder, icon }) => (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: label }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]", children: icon }), _jsx("input", { type: type, placeholder: placeholder, ...register(key, { required: true }), className: `w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-colors ${errors[key] ? 'border-red-400' : 'border-[#E8C97A]/50 focus:border-[#C9933A]'}` })] })] }, key))), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { type: showPwd ? 'text' : 'password', placeholder: "Min. 8 characters", ...register('password', { required: true, minLength: 8 }), className: "w-full pl-10 pr-10 py-3 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A] transition-colors" }), _jsx("button", { type: "button", onClick: () => setShowPwd(!showPwd), className: "absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9790]", children: showPwd ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6560] uppercase tracking-wider mb-1 block", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" }), _jsx("input", { type: "password", placeholder: "Repeat password", ...register('confirm_password', {
                                                        required: true,
                                                        validate: (v) => v === password || 'Passwords do not match',
                                                    }), className: `w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-colors ${errors.confirm_password ? 'border-red-400' : 'border-[#E8C97A]/50 focus:border-[#C9933A]'}` })] }), errors.confirm_password && (_jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.confirm_password.message }))] }), _jsxs("button", { type: "submit", disabled: loading, className: "btn-crimson w-full flex items-center justify-center gap-2 py-3.5", children: [loading && _jsx(MandalaSpinner, { size: 20 }), loading ? 'Creating Account…' : 'Create Account'] })] }), _jsxs("p", { className: "text-center text-sm text-[#6B6560]", children: ["Already have an account?", ' ', _jsx(Link, { href: "/auth/login", className: "text-[#C9933A] font-medium hover:underline", children: "Sign In" })] })] }) })] }));
}
