/**
 * Favoriler. Eski shop.js'te bellekteki bir Set'teydi ve sayfa değişince
 * kayboluyordu; artık localStorage'da kalıcı.
 * Backend gelince üyeler için GET/PUT /api/me/favorites ile eşitlenebilir.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const FAVORITES_STORAGE_KEY = 'soykok-favorites';

type FavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (ids: string[]) => void;
  has: (id: string) => boolean;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id],
        })),
      remove: (ids) => set((state) => ({ ids: state.ids.filter((x) => !ids.includes(x)) })),
      has: (id) => get().ids.includes(id),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      skipHydration: true,
    },
  ),
);
