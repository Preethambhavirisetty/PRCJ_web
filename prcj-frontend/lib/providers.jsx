import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
export function Providers({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [children, _jsx(Toaster, { position: "top-right", toastOptions: {
                    duration: 3000,
                    style: {
                        background: '#FEFDF9',
                        color: '#1a0e0e',
                        border: '1px solid rgba(201,147,58,0.3)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: { primary: '#C9933A', secondary: '#FEFDF9' },
                    },
                    error: {
                        iconTheme: { primary: '#6B1E1E', secondary: '#FEFDF9' },
                    },
                } })] }));
}
