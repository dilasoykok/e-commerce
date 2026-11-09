'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart, CART_STORAGE_KEY } from '@/store/cart';
import { useFavorites, FAVORITES_STORAGE_KEY } from '@/store/favorites';
import { useUi } from '@/store/ui';

// Eski statik sitenin tarayıcıda bıraktığı, artık kullanılmayan kayıtlar
const LEGACY_KEYS = ['soykok-session', 'soykok-profiles', 'soykok-user', 'soykok-cart'];

/**
 * Tarayıcıya özel başlangıç işleri (eski main.js'teki init* çağrılarının
 * state ile ilgili olanları). Görünür bir şey çizmez.
 * Oturum bilgisi artık burada değil: hooks/useUser.ts (TanStack Query).
 */
export default function ClientInit() {
  const pathname = usePathname();

  useEffect(() => {
    // localStorage'daki sepet ve favorileri yükle
    useCart.persist.rehydrate();
    useFavorites.persist.rehydrate();

    try {
      LEGACY_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch {
      /* depolama kapalıysa yok say */
    }

    // Başka sekmede sepet/favori değişirse bu sekmeyi de güncelle
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) useCart.persist.rehydrate();
      if (e.key === FAVORITES_STORAGE_KEY) useFavorites.persist.rehydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Sayfa değişince açık çekmeceleri kapat
  useEffect(() => {
    useUi.getState().closeAll();
  }, [pathname]);

  return null;
}
