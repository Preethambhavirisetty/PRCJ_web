import { create } from 'zustand';
export const useCartStore = create()((set, get) => ({
    cart: null,
    isOpen: false,
    couponCode: null,
    discountAmount: 0,
    setCart: (cart) => set({ cart }),
    setOpen: (open) => set({ isOpen: open }),
    toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
    setCoupon: (code, discount) => set({ couponCode: code, discountAmount: discount }),
    clearCart: () => set({ cart: null, couponCode: null, discountAmount: 0 }),
    get itemCount() {
        return get().cart?.item_count ?? 0;
    },
}));
