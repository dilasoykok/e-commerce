'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart, type CartProduct } from '@/store/cart';
import { useUi } from '@/store/ui';

type Props = {
  product: CartProduct;
  qty?: number;
  className?: string;
  children?: React.ReactNode;
};

/**
 * "Sepete Ekle" butonu (eski shop.js'teki data-add-to-cart).
 * Ekledikten sonra 1,2 sn "Sepete Eklendi ✓" yazar ve mini sepeti açar.
 * Ürün kartında ve ürün detay sayfasında (qty ile) kullanılacak.
 */
export default function AddToCartButton({ product, qty = 1, className, children = 'Sepete Ekle' }: Props) {
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      disabled={added}
      onClick={() => {
        add(product, qty);
        setAdded(true);
        timer.current = setTimeout(() => setAdded(false), 1200);
        openCart();
      }}
      className={
        className ??
        'h-10 w-full rounded bg-brand-900 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-80'
      }
    >
      {added ? 'Sepete Eklendi ✓' : children}
    </button>
  );
}
