'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/store/favorites';

/** Kalp butonu (eski shop.js'teki data-fav). Durum store/favorites.ts'te kalıcı. */
export default function FavoriteButton({ id }: { id: string }) {
  const active = useFavorites((s) => s.ids.includes(id));
  const toggle = useFavorites((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={active}
      aria-label={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className="grid size-9 place-items-center rounded transition hover:text-sale aria-pressed:text-sale"
    >
      <Heart className="size-5" strokeWidth={1.75} fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}
