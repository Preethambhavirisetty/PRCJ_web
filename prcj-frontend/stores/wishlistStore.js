import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useWishlistStore = create()(persist((set, get) => ({
    productIds: new Set(),
    setIds: (ids) => set({ productIds: new Set(ids) }),
    toggle: (productId) => set((s) => {
        const next = new Set(s.productIds);
        if (next.has(productId))
            next.delete(productId);
        else
            next.add(productId);
        return { productIds: next };
    }),
    has: (productId) => get().productIds.has(productId),
}), {
    name: 'prcj-wishlist',
    storage: {
        getItem: (key) => {
            if (typeof window === 'undefined')
                return null;
            const raw = localStorage.getItem(key);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            if (parsed?.state?.productIds && Array.isArray(parsed.state.productIds)) {
                parsed.state.productIds = new Set(parsed.state.productIds);
            }
            return parsed;
        },
        setItem: (key, value) => {
            if (typeof window === 'undefined')
                return;
            const s = value.state;
            const ids = s.productIds instanceof Set ? Array.from(s.productIds) : [];
            localStorage.setItem(key, JSON.stringify({ ...value, state: { ...value.state, productIds: ids } }));
        },
        removeItem: (key) => localStorage.removeItem(key),
    },
}));
