'use client';

import { createContext, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toListUrl, type ListState } from '@/lib/product-filters';

type Ctx = { state: ListState; navigate: (next: Partial<ListState>) => void; isPending: boolean };

const ListNavigationContext = createContext<Ctx | null>(null);

/**
 * Ürün listesindeki filtre/sıralama değişikliklerini adres çubuğuna yazar.
 * Sunucu yeni adresle listeyi yeniden çizer; bu sırada (isPending) eski liste
 * soluk görünür. Filtre durumu tek kaynaktan, URL'den gelir — ayrı bir store yok.
 */
export function ListNavigationProvider({ state, children }: { state: ListState; children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (next: Partial<ListState>) => {
    // Filtre değişince ilk sayfaya dön (yalnızca "Daha Fazla Göster" sayfayı artırır)
    const url = toListUrl({ ...state, page: 1, ...next });
    startTransition(() => router.replace(url, { scroll: false }));
  };

  return <ListNavigationContext.Provider value={{ state, navigate, isPending }}>{children}</ListNavigationContext.Provider>;
}

export function useListNavigation() {
  const ctx = useContext(ListNavigationContext);
  if (!ctx) throw new Error('useListNavigation, ListNavigationProvider içinde kullanılmalı');
  return ctx;
}

/** Yeni liste gelene kadar içeriği soluklaştırır */
export function PendingArea({ children }: { children: React.ReactNode }) {
  const { isPending } = useListNavigation();
  return (
    <div aria-busy={isPending} className={`transition-opacity ${isPending ? 'pointer-events-none opacity-50' : ''}`}>
      {children}
    </div>
  );
}
