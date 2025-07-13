import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // 🔐 Auth
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
      isLoggedIn: () => !!get().token,

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
          designs: [],
          selectedDesignId: null,
        }),
    }),
    {
      name: 'plystorage',
    }
  )
)

export default useAppStore