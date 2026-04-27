import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Lock } from 'lucide-react';
import { cartAPI, ordersAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import { LotusDivider, GoldDivider, PaisleyBg } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Chandigarh',
];
export default function CheckoutPage() {
    const router = useRouter();
    const [step, setStep] = useState('address');
    const [orderId, setOrderId] = useState(null);
    const [orderNumber, setOrderNumber] = useState(null);
    const { cart, setCart, discountAmount, couponCode } = useCartStore();
    const { register, handleSubmit, formState: { errors } } = useForm();
    useQuery({
        queryKey: ['cart-checkout'],
        queryFn: async () => {
            const { data } = await cartAPI.get();
            setCart(data.data);
            return data.data;
        },
    });
    const items = cart?.items ?? [];
    const subtotal = cart?.subtotal ?? 0;
    const shipping = subtotal >= 5000 ? 0 : 199;
    const total = subtotal - discountAmount + shipping;
    const createOrder = useMutation({
        mutationFn: (formData) => ordersAPI.create({
            shipping_full_name: formData.full_name,
            shipping_phone: formData.phone,
            shipping_email: formData.email,
            shipping_line1: formData.line1,
            shipping_line2: formData.line2,
            shipping_city: formData.city,
            shipping_state: formData.state,
            shipping_pincode: formData.pincode,
            shipping_country: 'India',
            coupon_code: couponCode,
        }),
        onSuccess: (res) => {
            const order = res.data.data;
            setOrderId(order.id);
            setOrderNumber(order.order_number);
            if (order.razorpay_order_id) {
                openRazorpay(order.razorpay_order_id, order.id);
            }
            else {
                setStep('success');
            }
        },
        onError: () => toast.error('Could not create order. Please try again.'),
    });
    const verifyPayment = useMutation({
        mutationFn: (payload) => ordersAPI.verifyPayment(payload),
        onSuccess: () => {
            setStep('success');
            setCart(null);
            toast.success('Payment successful! Order confirmed.');
        },
        onError: () => toast.error('Payment verification failed. Contact support.'),
    });
    const loadRazorpayScript = () => new Promise((resolve) => {
        if (window.Razorpay)
            return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
    const openRazorpay = async (rzpOrderId, ourOrderId) => {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            toast.error('Payment gateway unavailable');
            return;
        }
        const rzp = new window.Razorpay({
            key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? '',
            amount: total * 100,
            currency: 'INR',
            order_id: rzpOrderId,
            name: 'PRCJ Fine Jewellery',
            description: `Order #${orderNumber}`,
            image: '/images/prcj-logo.png',
            theme: { color: '#C9933A' },
            handler: (response) => {
                verifyPayment.mutate({
                    order_id: ourOrderId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                });
            },
        });
        rzp.open();
    };
    const onSubmit = (data) => createOrder.mutate(data);
    if (step === 'success') {
        return (_jsx("div", { className: "min-h-screen bg-[#FEFDF9] flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center max-w-md space-y-6 p-8 bg-white rounded-3xl border border-[#E8C97A]/30 shadow-xl", children: [_jsx(CheckCircle, { size: 64, className: "text-green-500 mx-auto" }), _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-[#1a0e0e] mb-2", style: { fontFamily: 'var(--font-cormorant)' }, children: "Order Confirmed!" }), _jsxs("p", { className: "text-[#6B6560]", children: ["Your order ", _jsxs("span", { className: "font-bold text-[#C9933A]", children: ["#", orderNumber] }), " has been placed successfully. We'll send you a confirmation email shortly."] })] }), _jsx(GoldDivider, {}), _jsxs("div", { className: "space-y-2", children: [_jsx("a", { href: "/account/orders", className: "btn-gold w-full block text-center", children: "Track Your Order" }), _jsx("a", { href: "/shop", className: "btn-outline-gold w-full block text-center text-sm", children: "Continue Shopping" })] })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#FEFDF9]", children: [_jsx(PaisleyBg, { className: "bg-[#F8F4E8] border-b border-[#E8C97A]/30 py-8", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 text-center", children: [_jsx("h1", { className: "heading-xl text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Secure Checkout" }), _jsxs("div", { className: "flex items-center justify-center gap-1.5 mt-2 text-xs text-[#6B6560]", children: [_jsx(Lock, { size: 12, className: "text-[#C9933A]" }), _jsx(ShieldCheck, { size: 12, className: "text-[#C9933A]" }), "256-bit SSL Secured \u00B7 Powered by Razorpay"] })] }) }), _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-10", children: _jsxs("div", { className: "grid lg:grid-cols-5 gap-8", children: [_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "lg:col-span-3 space-y-5", children: [_jsx("h2", { className: "text-lg font-semibold text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "Shipping Details" }), _jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [[
                                            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Priya Sharma' },
                                            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '9876543210' },
                                            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@email.com' },
                                            { label: 'Address Line 1', key: 'line1', type: 'text', placeholder: 'House no., Street' },
                                            { label: 'Address Line 2', key: 'line2', type: 'text', placeholder: 'Landmark (optional)' },
                                            { label: 'City', key: 'city', type: 'text', placeholder: 'Mumbai' },
                                            { label: 'Pincode', key: 'pincode', type: 'text', placeholder: '400001' },
                                        ].map(({ label, key, type, placeholder }) => (_jsxs("div", { className: key === 'line1' || key === 'line2' ? 'sm:col-span-2' : '', children: [_jsxs("label", { className: "text-xs text-[#6B6560] mb-1 block uppercase tracking-wider", children: [label, " ", key !== 'line2' && _jsx("span", { className: "text-[#C9933A]", children: "*" })] }), _jsx("input", { type: type, placeholder: placeholder, ...register(key, { required: key !== 'line2' }), className: `w-full px-4 py-3 text-sm border rounded-xl outline-none transition-colors ${errors[key]
                                                        ? 'border-red-400 bg-red-50'
                                                        : 'border-[#E8C97A]/50 focus:border-[#C9933A] bg-white'}` })] }, key))), _jsxs("div", { children: [_jsxs("label", { className: "text-xs text-[#6B6560] mb-1 block uppercase tracking-wider", children: ["State ", _jsx("span", { className: "text-[#C9933A]", children: "*" })] }), _jsxs("select", { ...register('state', { required: true }), className: "w-full px-4 py-3 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A] bg-white", children: [_jsx("option", { value: "", children: "Select State" }), INDIAN_STATES.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] })] }), _jsx("button", { type: "submit", disabled: createOrder.isPending, className: "btn-crimson w-full flex items-center justify-center gap-2 py-4", children: createOrder.isPending ? (_jsxs(_Fragment, { children: [_jsx(MandalaSpinner, { size: 20 }), " Processing\u2026"] })) : (_jsxs(_Fragment, { children: [_jsx(ShieldCheck, { size: 16 }), "Pay ", formatCurrency(total), " Securely"] })) })] }), _jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-2xl border border-[#F0E8D5] p-5 sticky top-24", children: [_jsx("h3", { className: "text-lg font-semibold text-[#1a0e0e] mb-4", style: { fontFamily: 'var(--font-cormorant)' }, children: "Order Summary" }), _jsx("div", { className: "space-y-3 mb-4 max-h-48 overflow-y-auto", children: items.map((item) => (_jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-[#1a0e0e] line-clamp-1 flex-1", children: item.product.name }), _jsxs("span", { className: "text-[#6B6560] shrink-0", children: ["\u00D7", item.quantity] }), _jsx("span", { className: "font-medium shrink-0", children: formatCurrency(item.total_price) })] }, item.id))) }), _jsx(LotusDivider, {}), _jsxs("div", { className: "space-y-2 text-sm mt-3", children: [_jsxs("div", { className: "flex justify-between text-[#6B6560]", children: [_jsx("span", { children: "Subtotal" }), _jsx("span", { children: formatCurrency(subtotal) })] }), discountAmount > 0 && (_jsxs("div", { className: "flex justify-between text-green-600", children: [_jsx("span", { children: "Coupon discount" }), _jsxs("span", { children: ["- ", formatCurrency(discountAmount)] })] })), _jsxs("div", { className: "flex justify-between text-[#6B6560]", children: [_jsx("span", { children: "Shipping" }), _jsx("span", { children: shipping === 0 ? 'Free' : formatCurrency(shipping) })] })] }), _jsx(GoldDivider, { className: "my-3" }), _jsxs("div", { className: "flex justify-between font-bold", children: [_jsx("span", { style: { fontFamily: 'var(--font-cormorant)', fontSize: '18px' }, children: "Total" }), _jsx("span", { className: "gold-text-static text-xl", style: { fontFamily: 'var(--font-cormorant)' }, children: formatCurrency(total) })] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2 justify-center", children: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'].map((method) => (_jsx("span", { className: "text-[10px] border border-[#E8C97A]/40 text-[#6B6560] px-2 py-1 rounded", children: method }, method))) })] }) })] }) })] }));
}
