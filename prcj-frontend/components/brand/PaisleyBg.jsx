import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function PaisleyBg({ children, className, opacity = 0.04 }) {
    return (_jsxs("div", { className: cn('relative', className), children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 8 C28 8 18 18 18 30 C18 42 28 48 37 46 C32 51 32 60 40 62 C48 60 48 51 43 46 C52 48 62 42 62 30 C62 18 52 8 40 8 Z M40 12 C50 12 58 19 58 30 C58 40 50 45 42 43 L38 43 C30 45 22 40 22 30 C22 19 30 12 40 12 Z' fill='%23C9933A' opacity='1'/%3E%3Ccircle cx='40' cy='30' r='5' fill='%23C9933A' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '80px 80px',
                    opacity,
                } }), _jsx("div", { className: "relative z-10", children: children })] }));
}
export function BorderMotif({ className }) {
    return (_jsx("div", { className: cn('w-full overflow-hidden', className), children: _jsxs("svg", { width: "100%", height: "20", viewBox: "0 0 400 20", preserveAspectRatio: "xMidYMid slice", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("defs", { children: _jsxs("pattern", { id: "border-motif", x: "0", y: "0", width: "40", height: "20", patternUnits: "userSpaceOnUse", children: [_jsx("path", { d: "M0 10 Q5 2 10 10 Q15 18 20 10 Q25 2 30 10 Q35 18 40 10", stroke: "#C9933A", strokeWidth: "1", fill: "none", opacity: "0.6" }), _jsx("circle", { cx: "10", cy: "10", r: "1.5", fill: "#C9933A", opacity: "0.5" }), _jsx("circle", { cx: "30", cy: "10", r: "1.5", fill: "#C9933A", opacity: "0.5" })] }) }), _jsx("rect", { width: "400", height: "20", fill: "url(#border-motif)" })] }) }));
}
