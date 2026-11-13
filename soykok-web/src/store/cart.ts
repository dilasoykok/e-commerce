/**
 * Sepet deposu — eski src/js/store/cart.js'in Zustand sürümü.
 *
 * Kurallar aynı: miktar 1–999 arası, aynı ürün tekrar eklenince miktarı artar,
 * sepet localStorage'da saklanır, başka sekmede değişirse bu sekme de güncellenir
 * (bkz. components/providers/ClientInit.tsx).
 *
 * Backend hazır olduğunda sepet sunucuya da yazılacak; fiyatlar ödeme
 * sırasında her zaman sunucuda yeniden hesaplanmalı.
 */

import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from '@/lib/shipping';

export { FREE_SHIPPING_LIMIT, SHIPPING_FEE };
const MAX_QTY = 999;
export const CART_STORAGE_KEY = 'soykok-cart-v2'; // eski site düz dizi saklıyordu, biçim farklı

export type CartProduct = {
  id: string;
  name: string;
  brand?: string;
  image?: string; // public/images/products altındaki dosya adı
  price: number;
  unit?: string; // adet, kg, torba, m²
};

export type CartItem = Required<CartProduct> & { qty: number };

type CartState = {
  items: CartItem[];
  add: (product: CartProduct, qty?: number) => void;
  setQty: (id: string, qty: number | string) => void;
  increment: (id: string, step?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Sepetteki ürünleri API'deki güncel bilgiyle eşitler; değişen ürünlerin adlarını döndürür */
  syncProducts: (fresh: CartProduct[], missingIds: string[]) => { changed: string[]; removed: string[] };
};

function clampQty(qty: number | string): number {
  const n = Math.floor(Number(qty));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_QTY) : 1;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, qty: clampQty(i.qty + qty) } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                brand: product.brand ?? '',
                image: product.image ?? '',
                price: Number(product.price) || 0,
                unit: product.unit || 'adet',
                qty: clampQty(qty),
              },
            ],
          };
        }),

      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, qty: clampQty(qty) } : i)),
        })),

      increment: (id, step = 1) => {
        const item = get().items.find((i) => i.id === id);
        if (item) get().setQty(id, item.qty + step);
      },

      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clear: () => set({ items: [] }),

      syncProducts: (fresh, missingIds) => {
        const byId = new Map(fresh.map((p) => [p.id, p]));
        const changed: string[] = [];
        const removed: string[] = [];
        const items: CartItem[] = [];
        for (const item of get().items) {
          if (missingIds.includes(item.id)) {
            removed.push(item.name);
            continue;
          }
          const p = byId.get(item.id);
          if (p && p.price !== item.price) changed.push(item.name);
          items.push(
            p
              ? { ...item, name: p.name, brand: p.brand ?? item.brand, image: p.image ?? item.image, price: p.price, unit: p.unit || item.unit }
              : item,
          );
        }
        if (changed.length || removed.length || items.some((x, i) => x !== get().items[i])) set({ items });
        return { changed, removed };
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Sunucuda sepet boş çizilir; tarayıcıdaki sepet ClientInit içinde,
      // sayfa oturduktan sonra yüklenir. Böylece hydration hatası olmaz.
      skipHydration: true,
    },
  ),
);

/* ---------- Hesaplanan değerler (eski getState()) ---------- */

export type CartSummary = {
  items: (CartItem & { lineTotal: number })[];
  count: number; // header rozetinde farklı ürün sayısı gösterilir
  subtotal: number;
  shipping: number;
  total: number;
  remainingForFreeShipping: number;
  freeShippingProgress: number;
};

export function getCartSummary(items: CartItem[]): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;

  return {
    items: items.map((item) => ({ ...item, lineTotal: item.price * item.qty })),
    count: items.length,
    subtotal,
    shipping,
    total: subtotal + shipping,
    remainingForFreeShipping: Math.max(0, FREE_SHIPPING_LIMIT - subtotal),
    freeShippingProgress: Math.min(100, (subtotal / FREE_SHIPPING_LIMIT) * 100),
  };
}

/** Bileşenlerde kullanım: const { total, items } = useCartSummary(); */
export function useCartSummary(): CartSummary {
  const items = useCart((s) => s.items);
  return useMemo(() => getCartSummary(items), [items]);
}

/**
 * Sepet localStorage'dan yüklendi mi? Yüklenmeden önce sepet boş görünür;
 * sepet sayfası bu sırada "Sepetiniz boş" yerine yükleniyor gösterir.
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useCart.persist.hasHydrated());
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

/** Header rozeti için yalnızca sayı (gereksiz yeniden çizimi önler) */
export const useCartCount = () => useCart((s) => s.items.length);
