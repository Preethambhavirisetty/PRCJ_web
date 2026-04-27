import { create } from 'zustand';
export const useTryOnStore = create()((set) => ({
    session: null,
    landmarks: null,
    isActive: false,
    isDetecting: false,
    adjustments: { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 },
    screenshots: [],
    setSession: (session) => set({ session }),
    setLandmarks: (landmarks) => set({ landmarks }),
    setActive: (isActive) => set({ isActive }),
    setDetecting: (isDetecting) => set({ isDetecting }),
    updateAdjustments: (a) => set((s) => ({ adjustments: { ...s.adjustments, ...a } })),
    addScreenshot: (url) => set((s) => ({ screenshots: [...s.screenshots, url] })),
    reset: () => set({
        session: null,
        landmarks: null,
        isActive: false,
        isDetecting: false,
        adjustments: { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 },
        screenshots: [],
    }),
}));
