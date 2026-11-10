'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/store/favorites';

const STYLES = {
  card: 'grid size-9 place-items-center rounded transition hover:text-sale aria-pressed:text-sale',
  large:
    'grid size-12 place-items-center rounded border border-gray-300 transition hover:border-sale hover:text-sale aria-pressed:border-sale aria-pressed:text-sale',
};

/** Kalp butonu (eski shop.js'teki data-fav). Durum store/favorites.ts'te kalıcı. */
export default function FavoriteButton({ id, variant = 'card' }: { id: string; variant?: keyof typeof STYLES }) {
  const active = useFavorites((s) => s.ids.includes(id));
  const toggle = useFavorites((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={active}
      aria-label={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className={STYLES[variant]}
    >
      <Heart className="size-5" strokeWidth={1.75} fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}
