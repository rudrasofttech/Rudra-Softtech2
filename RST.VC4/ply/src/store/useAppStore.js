'use client'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAppStore = create(
    persist(
        (set, get) => ({
            // 🔐 Auth
            token: null,
            name: null,
            email: null,
            expiry: null, // 🕒 Token expiry timestamp (e.g., UNIX milliseconds)

            setToken: (token, expiry) => {
                //const expiry = Date.now() + ttlMs; // default 1 hour
                set({ token, expiry });
            },

            clearToken: () => set({ token: null, expiry: null }),

            isLoggedIn: () => {
                const { token, expiry } = get();
                return !!token && expiry && Date.now() < expiry;
            },

            setUserInfo: ({ name, email }) => set({ name, email }),
            clearUserInfo: () => set({ name: null, email: null }),

            // 🎨 Designs
            designs: [],
            setDesigns: (designs) => set({ designs }),
            addDesign: (design) =>
                set((state) => ({ designs: [...state.designs, design] })),
            updateDesign: (id, newData) =>
                set((state) => ({
                    designs: state.designs.map((d) =>
                        d.id === id ? { ...d, ...newData } : d
                    ),
                })),
            deleteDesign: (id) =>
                set((state) => ({
                    designs: state.designs.filter((d) => d.id !== id),
                })),

            // 🖼️ Selection
            selectedDesignId: null,
            selectDesign: (id) => set({ selectedDesignId: id }),
            selectedDesign: () =>
                get().designs.find((d) => d.id === get().selectedDesignId),
            clearSelection: () => set({ selectedDesignId: null }),

            // 🧹 Utility
            resetStore: () =>
                set({
                    token: null,
                    expiry: null,
                    name: null,
                    email: null,
                    designs: [],
                    selectedDesignId: null,
                }),
        }),
        {
            name: 'plystorage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useAppStore;