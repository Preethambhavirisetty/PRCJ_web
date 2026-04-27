import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from '@/lib/router.jsx';
import { useParams } from '@/lib/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Sparkles, Download, RotateCcw, ArrowLeft, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { productsAPI, tryonAPI } from '@/lib/api';
import { useTryOnStore } from '@/stores/tryonStore';
import { MandalaSpinner, PaisleyBg } from '@/components/brand';
import toast from 'react-hot-toast';
import dynamic from '@/lib/dynamic';
const TryOnCanvas = dynamic(() => import('@/components/tryon/TryOnCanvas').then((m) => m.TryOnCanvas), { ssr: false });
export default function TryOnPage() {
    const { slug } = useParams();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectIntervalRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [screenshotUrl, setScreenshotUrl] = useState(null);
    const { session, setSession, setLandmarks, landmarks, isDetecting, setDetecting, adjustments, updateAdjustments, reset } = useTryOnStore();
    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await productsAPI.get(slug);
            return res.data.data;
        },
    });
    const createSession = useMutation({
        mutationFn: async () => {
            const res = await tryonAPI.createSession(product.id);
            return res.data.data;
        },
        onSuccess: (data) => {
            setSession(data);
            toast.success('Try-On session ready!');
        },
        onError: () => toast.error('Login required for Try-On'),
    });
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);
            setCameraError(null);
            // Create session and start detection
            if (product) {
                createSession.mutate();
            }
        }
        catch {
            setCameraError('Camera access denied. Please allow camera permissions.');
        }
    }, [product]);
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (detectIntervalRef.current) {
            clearInterval(detectIntervalRef.current);
        }
        setCameraActive(false);
        reset();
    }, [reset]);
    // Send frames to backend for detection
    useEffect(() => {
        if (!cameraActive || !session)
            return;
        detectIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current)
                return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return;
            ctx.drawImage(video, 0, 0);
            const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            try {
                setDetecting(true);
                const res = await tryonAPI.detectLandmarks(session.id, b64);
                setLandmarks(res.data.data);
            }
            catch {
                // Silently skip failed frames
            }
            finally {
                setDetecting(false);
            }
        }, 200); // 5 FPS detection
        return () => {
            if (detectIntervalRef.current)
                clearInterval(detectIntervalRef.current);
        };
    }, [cameraActive, session, setDetecting, setLandmarks]);
    const takeScreenshot = useCallback(() => {
        if (!videoRef.current || !canvasRef.current)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setScreenshotUrl(dataUrl);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `prcj-tryon-${slug}.jpg`;
        a.click();
        toast.success('Screenshot saved!');
    }, [slug]);
    useEffect(() => () => { stopCamera(); }, [stopCamera]);
    if (productLoading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx(MandalaSpinner, { size: 64 }) }));
    }
    if (!product || !product.has_3d_model) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center", children: [_jsx(Sparkles, { size: 48, className: "text-[#C9933A]" }), _jsx("h2", { className: "heading-lg text-[#1a0e0e]", style: { fontFamily: 'var(--font-cormorant)' }, children: "3D Try-On not available for this product" }), _jsx(Link, { href: `/shop/${slug}`, className: "btn-gold text-sm", children: "View Product" })] }));
    }
    const modelConfig = session?.model;
    return (_jsxs("div", { className: "min-h-screen bg-[#0e0808] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#C9933A]/20", children: [_jsxs(Link, { href: `/shop/${slug}`, className: "flex items-center gap-2 text-sm text-[#E8C97A] hover:text-[#C9933A] transition-colors", children: [_jsx(ArrowLeft, { size: 16 }), "Back to Product"] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest", children: "Virtual Try-On" }), _jsx("p", { className: "text-sm font-medium text-white", style: { fontFamily: 'var(--font-cormorant)' }, children: product.name })] }), _jsx("div", { className: "flex items-center gap-2", children: isDetecting && (_jsx("div", { className: "w-2 h-2 rounded-full bg-[#C9933A] animate-pulse", title: "Detecting landmarks" })) })] }), _jsxs("div", { className: "flex-1 flex flex-col lg:flex-row", children: [_jsxs("div", { className: "relative flex-1 bg-[#0a0606] flex items-center justify-center min-h-[60vh] lg:min-h-0", children: [!cameraActive ? (_jsx(PaisleyBg, { className: "absolute inset-0 opacity-20", children: _jsx("div", {}) })) : null, _jsx("video", { ref: videoRef, className: "w-full h-full object-cover", style: { display: cameraActive ? 'block' : 'none', transform: 'scaleX(-1)' }, playsInline: true, muted: true }), _jsx("canvas", { ref: canvasRef, className: "hidden" }), cameraActive && modelConfig && (_jsx(TryOnCanvas, { modelConfig: modelConfig, videoRef: videoRef, className: "absolute inset-0 z-10" })), !cameraActive && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "relative z-10 flex flex-col items-center gap-6 text-center px-8", children: [_jsx("div", { className: "w-24 h-24 rounded-full border-2 border-[#C9933A]/50 flex items-center justify-center bg-[#1a0e0e]", children: _jsx(Camera, { size: 36, className: "text-[#C9933A]" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-semibold text-white mb-2", style: { fontFamily: 'var(--font-cormorant)' }, children: ["Try on ", product.name] }), _jsx("p", { className: "text-sm text-[#9e9790] max-w-xs", children: "Allow camera access to see how this jewellery looks on you in real-time 3D AR." })] }), cameraError && (_jsx("p", { className: "text-sm text-red-400 bg-red-900/20 px-4 py-2 rounded-lg", children: cameraError })), _jsxs("button", { onClick: startCamera, className: "btn-gold flex items-center gap-2", children: [_jsx(Camera, { size: 16 }), "Start Try-On"] })] })), cameraActive && (_jsxs("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3", children: [_jsxs("button", { onClick: takeScreenshot, className: "flex items-center gap-1.5 px-4 py-2.5 bg-white/10 backdrop-blur-md text-white text-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors", children: [_jsx(Download, { size: 14 }), "Screenshot"] }), _jsxs("button", { onClick: stopCamera, className: "flex items-center gap-1.5 px-4 py-2.5 bg-[#6B1E1E]/80 backdrop-blur-md text-white text-sm rounded-full border border-[#C9933A]/30 hover:bg-[#6B1E1E] transition-colors", children: [_jsx(CameraOff, { size: 14 }), "Stop"] })] }))] }), _jsxs("aside", { className: "lg:w-72 bg-[#130c0c] border-l border-[#C9933A]/20 p-5 space-y-5", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest mb-3 font-medium", children: "Adjustment Controls" }), _jsx("div", { className: "space-y-4", children: [
                                            { label: 'Scale', icon: _jsx(ZoomIn, { size: 14 }), key: 'scaleX', min: 0.3, max: 3, step: 0.05 },
                                            { label: 'Horizontal', icon: _jsx(Move, { size: 14 }), key: 'offsetX', min: -50, max: 50, step: 1 },
                                            { label: 'Vertical', icon: _jsx(Move, { size: 14 }), key: 'offsetY', min: -50, max: 50, step: 1 },
                                        ].map(({ label, icon, key, min, max, step }) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-xs text-[#9e9790]", children: [icon, " ", label] }), _jsx("span", { className: "text-xs text-[#C9933A]", children: adjustments[key].toFixed(key === 'scaleX' ? 2 : 0) })] }), _jsx("input", { type: "range", min: min, max: max, step: step, value: adjustments[key], onChange: (e) => updateAdjustments({ [key]: Number(e.target.value) }), className: "w-full accent-[#C9933A]" })] }, key))) })] }), _jsx("div", { className: "border-t border-[#C9933A]/20 pt-4", children: _jsxs("button", { onClick: () => updateAdjustments({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }), className: "flex items-center gap-2 text-xs text-[#9e9790] hover:text-[#C9933A] transition-colors w-full", children: [_jsx(RotateCcw, { size: 12 }), " Reset adjustments"] }) }), _jsxs("div", { className: "border-t border-[#C9933A]/20 pt-4 space-y-2", children: [_jsx("p", { className: "text-xs text-[#9e9790]", children: "Trying on:" }), _jsx("p", { className: "text-sm font-medium text-[#E8C97A]", style: { fontFamily: 'var(--font-cormorant)' }, children: product.name }), _jsx("p", { className: "text-xs text-[#C9933A]", children: product.metal_type }), _jsx(Link, { href: `/shop/${slug}`, className: "btn-gold w-full text-center text-sm block mt-3", children: "Buy Now" })] }), _jsxs("div", { className: "border-t border-[#C9933A]/20 pt-4 space-y-2", children: [_jsx("p", { className: "text-xs text-[#C9933A] uppercase tracking-widest font-medium", children: "Tips" }), _jsxs("ul", { className: "text-xs text-[#6B6560] space-y-1.5", children: [_jsx("li", { children: "\u2726 Face the camera directly in good lighting" }), _jsx("li", { children: "\u2726 Keep your head still for best results" }), _jsx("li", { children: "\u2726 Use adjustment sliders to fine-tune fit" }), _jsx("li", { children: "\u2726 Screenshot to share with friends" })] })] })] })] })] }));
}
