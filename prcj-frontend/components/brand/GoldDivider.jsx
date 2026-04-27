import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function GoldDivider({ className, thickness = 1 }) {
    return (_jsx("div", { className: cn('w-full', className), style: {
            height: `${thickness}px`,
            background: 'linear-gradient(90deg, transparent 0%, #C9933A 20%, #E8C97A 50%, #C9933A 80%, transparent 100%)',
        } }));
}
export function GoldAccentLine({ className }) {
    return (_jsxs("div", { className: cn('flex items-center gap-2', className), children: [_jsx("div", { className: "w-8 h-px bg-[#C9933A]" }), _jsx("div", { className: "w-2 h-2 rounded-full bg-[#C9933A]" }), _jsx("div", { className: "flex-1 h-px bg-gradient-to-r from-[#C9933A] to-transparent" })] }));
}
