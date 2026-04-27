import { jsx as _jsx } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
export default function dynamic(loader, options = {}) {
    const LazyComponent = lazy(loader);
    const fallback = options?.loading ? options.loading() : null;
    return function DynamicComponent(props) {
        return (_jsx(Suspense, { fallback: fallback, children: _jsx(LazyComponent, { ...props }) }));
    };
}
