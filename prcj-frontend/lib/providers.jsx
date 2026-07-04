import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PRCJLanguageLoader } from '@/components/brand/PRCJLanguageLoader';

export function Providers({ children }) {
  const [showLoader, setShowLoader] = useState(() => !window.sessionStorage.getItem('prcj-loader-seen'));
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if (!showLoader) return undefined;

    window.sessionStorage.setItem('prcj-loader-seen', 'true');
    const timer = window.setTimeout(() => setShowLoader(false), 2400);

    return () => window.clearTimeout(timer);
  }, [showLoader]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AnimatePresence>
        {showLoader && (
          <motion.div
            key="prcj-language-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <PRCJLanguageLoader />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster
        position="top-right"
        toastOptions={{
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
        }}
      />
    </QueryClientProvider>
  );
}
