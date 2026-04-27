import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function MandalaSpinner({ size = 48, className }) {
    return (_jsx("div", { className: cn('flex items-center justify-center', className), children: _jsxs("svg", { width: size, height: size, viewBox: "0 0 200 200", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { animation: 'mandala-spin 1.5s linear infinite' }, children: [_jsx("circle", { cx: "100", cy: "100", r: "85", stroke: "#E8C97A", strokeWidth: "2", strokeDasharray: "8 4" }), _jsx("circle", { cx: "100", cy: "100", r: "65", stroke: "#C9933A", strokeWidth: "1.5", strokeDasharray: "4 4" }), _jsx("circle", { cx: "100", cy: "100", r: "45", stroke: "#E8C97A", strokeWidth: "2" }), _jsx("circle", { cx: "100", cy: "100", r: "20", fill: "#C9933A", opacity: "0.2" }), _jsx("circle", { cx: "100", cy: "100", r: "8", fill: "#C9933A", opacity: "0.5" }), [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (_jsx("ellipse", { cx: "100", cy: "62", rx: "5", ry: "14", fill: "#C9933A", opacity: "0.4", transform: `rotate(${deg} 100 100)` }, deg)))] }) }));
}
export function PageLoader() {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-[#FEFDF9]", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx(MandalaSpinner, { size: 64 }), _jsx("p", { className: "text-sm text-[#6B6560] tracking-widest uppercase font-light", style: { fontFamily: 'var(--font-display)' }, children: "Loading\u2026" })] }) }));
}
