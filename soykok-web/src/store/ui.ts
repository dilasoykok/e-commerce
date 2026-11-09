/**
 * Sayfalar arasında paylaşılan arayüz durumu (kalıcı değil).
 * Eski cart-ui.js'teki openCart() ve menu.js'teki çekmece durumu.
 */

import { create } from 'zustand';

type UiState = {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setMobileMenu: (open: boolean) => void;
  closeAll: () => void;
};

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  openCart: () => set({ cartOpen: true, mobileMenuOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),
  closeAll: () => set({ cartOpen: false, mobileMenuOpen: false }),
}));
