'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCartCount } from '@/store/cart';
import { useFavorites } from '@/store/favorites';
import { useUi } from '@/store/ui';

const badgeClass =
  'absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-900 px-1 text-xs font-semibold text-white';

/** Header'daki "Sepetim": mini sepeti açar. Sepet sayfasındaysak normal link gibi davranır. */
export function CartButton() {
  const count = useCartCount();
  const open = useUi((s) => s.cartOpen);
  const openCart = useUi((s) => s.openCart);
  const onCartPage = usePathname() === '/sepet';

  return (
    <Link
      href="/sepet"
      onClick={(e) => {
        if (onCartPage) return;
        e.preventDefault();
        openCart();
      }}
      aria-controls={onCartPage ? undefined : 'cartDrawer'}
      aria-expanded={onCartPage ? undefined : open}
      className="group flex items-center gap-2 text-sm"
    >
      <span className="relative">
        <ShoppingCart className="size-6" strokeWidth={1.75} aria-hidden />
        <span className={badgeClass}>{count}</span>
      </span>
      <span className="hidden group-hover:text-wood-600 sm:inline">Sepetim</span>
    </Link>
  );
}

/** Header'daki "Favorilerim" */
export function FavoritesButton() {
  const count = useFavorites((s) => s.ids.length);

  return (
    <Link href="/favorilerim" className="group flex items-center gap-2 text-sm">
      <span className="relative">
        <Heart className="size-6" strokeWidth={1.75} aria-hidden />
        <span className={badgeClass}>{count}</span>
      </span>
      <span className="hidden group-hover:text-wood-600 sm:inline">Favorilerim</span>
    </Link>
  );
}
