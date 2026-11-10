'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Trash2, X } from 'lucide-react';

import QtyStepper from './QtyStepper';
import ShippingProgress from './ShippingProgress';
import { useCart, useCartSummary } from '@/store/cart';
import { useUi } from '@/store/ui';
import { formatTL } from '@/lib/format';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const SW = 1.75;

/** Sağdan açılan mini sepet (eski cart-drawer.html + cart-ui.js → initCartDrawer) */
export default function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const remove = useCart((s) => s.remove);
  const summary = useCartSummary();
  const hasItems = summary.items.length > 0;

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);
  useEscape(open, close);

  // Açılınca kapat butonuna odaklan, kapanınca önceki öğeye geri dön
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      closeBtnRef.current?.focus();
    } else {
      lastFocused.current?.focus();
      lastFocused.current = null;
    }
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/50" onClick={close} aria-hidden />}

      <aside
        id="cartDrawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cartDrawerTitle"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? '' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="cartDrawerTitle" className="flex items-center gap-2 text-base font-bold">
            <ShoppingCart className="size-5" strokeWidth={SW} aria-hidden />
            Sepetim <span className="text-sm font-medium text-gray-500">({summary.count})</span>
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            className="grid size-9 place-items-center rounded-md hover:bg-gray-100"
            aria-label="Sepeti kapat"
          >
            <X className="size-5" strokeWidth={SW} aria-hidden />
          </button>
        </div>

        {!hasItems ? (
          /* Boş sepet */
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-400">
              <ShoppingCart className="size-7" strokeWidth={SW} aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold">Sepetiniz boş</p>
            <p className="mt-1 text-xs text-gray-500">Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın.</p>
            <button
              type="button"
              onClick={close}
              className="mt-5 h-10 rounded bg-brand-900 px-5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Alışverişe Başla
            </button>
          </div>
        ) : (
          <>
            {/* Ücretsiz kargo ilerlemesi */}
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
              <ShippingProgress summary={summary} />
            </div>

            {/* Ürünler */}
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto px-5">
              {summary.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  {item.image ? (
                    <Image
                      src={productImageSrc(item.image)}
                      unoptimized={isUploadedImage(item.image)}
                      alt=""
                      width={80}
                      height={56}
                      className="h-14 w-20 shrink-0 rounded bg-gray-100 object-cover"
                    />
                  ) : (
                    <span className="h-14 w-20 shrink-0 rounded bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug font-semibold">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {item.brand} · {formatTL(item.price)}/{item.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`${item.name} ürününü sepetten çıkar`}
                        className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-sale"
                      >
                        <Trash2 className="size-4" strokeWidth={SW} aria-hidden />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <QtyStepper item={item} />
                      <p className="text-sm font-bold">{formatTL(item.lineTotal)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Özet */}
            <div className="border-t border-gray-200 px-5 py-4">
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Ara Toplam</dt>
                  <dd className="font-semibold">{formatTL(summary.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Kargo</dt>
                  <dd className={`font-semibold ${summary.shipping === 0 ? 'text-green-700' : ''}`}>
                    {summary.shipping === 0 ? 'Ücretsiz' : formatTL(summary.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
                  <dt className="font-semibold">Toplam</dt>
                  <dd className="font-bold">{formatTL(summary.total)}</dd>
                </div>
              </dl>
              <Link
                href="/sepet"
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Sepete Git <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={close}
                className="mt-2 h-10 w-full rounded text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Alışverişe Devam Et
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
