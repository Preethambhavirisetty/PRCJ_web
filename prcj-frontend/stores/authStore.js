import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearTokens } from '@/lib/api';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    setAuth: (user, access, refresh) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('prcj_access', access);
            localStorage.setItem('prcj_refresh', refresh);
        }
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true });
    },
    setUser: (user) => set({ user }),
    logout: () => {
        clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },
}), {
    name: 'prcj-auth',
    partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
    }),
}));
