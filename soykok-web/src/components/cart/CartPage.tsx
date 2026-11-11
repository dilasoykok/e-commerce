'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Headset, Info, Loader2, Lock, Package, ShoppingCart, Trash2, X } from 'lucide-react';

import QtyStepper from './QtyStepper';
import ShippingProgress from './ShippingProgress';
import { useCart, useCartSummary } from '@/store/cart';
import { useCartSync } from '@/hooks/useCartSync';
import { formatTL } from '@/lib/format';
import { productHref } from '@/lib/routes';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const SW = 1.75;

/** Sepet sayfası (eski sepet.html + cart-page.js) */
export default function CartPage() {
  const summary = useCartSummary();
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const { hydrated, notice, dismiss } = useCartSync();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) {
    return (
      <div className="mt-6 grid h-48 place-items-center">
        <Loader2 className="size-6 animate-spin text-gray-400" aria-label="Sepet yükleniyor" />
      </div>
    );
  }

  if (summary.items.length === 0) {
    return (
      <>
        {notice && <Notice text={notice} onClose={dismiss} />}
        <div className="mt-6 flex flex-col items-center rounded-md border border-dashed border-gray-300 px-6 py-16 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-gray-100 text-gray-400">
            <ShoppingCart className="size-9" strokeWidth={SW} aria-hidden />
          </span>
          <p className="mt-5 text-lg font-semibold">Sepetiniz boş</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">Ürünlerimize göz atın, beğendiklerinizi sepete ekleyin.</p>
          <Link
            href="/urunler"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded bg-brand-900 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Alışverişe Başla <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="-mt-1 text-sm text-gray-500">{summary.count} ürün</p>
      {notice && <Notice text={notice} onClose={dismiss} />}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-label="Sepetteki ürünler" className="rounded-md border border-gray-200 px-4 md:px-6">
          {/* Tablo başlığı (masaüstü) */}
          <div className="hidden grid-cols-[96px_1fr_110px_150px_110px_36px] gap-x-4 border-b border-gray-200 py-3 text-xs font-semibold text-gray-500 md:grid">
            <span className="col-span-2">Ürün</span>
            <span>Birim Fiyat</span>
            <span>Miktar</span>
            <span className="text-right">Toplam</span>
            <span />
          </div>

          <ul className="divide-y divide-gray-100">
            {summary.items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[80px_1fr_auto] gap-x-4 gap-y-3 py-5 md:grid-cols-[96px_1fr_110px_150px_110px_36px] md:items-center"
              >
                <Link href={productHref(item.id)} className="relative row-span-2 h-16 w-20 overflow-hidden rounded bg-gray-100 md:row-span-1 md:h-[72px] md:w-24">
                  {item.image && <Image src={productImageSrc(item.image)} unoptimized={isUploadedImage(item.image)} alt="" fill sizes="96px" className="object-cover" />}
                </Link>

                <div className="min-w-0">
                  <Link href={productHref(item.id)} className="text-sm leading-snug font-semibold hover:text-wood-600">
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-500">{item.brand}</p>
                </div>

                <p className="hidden text-sm md:block">
                  {formatTL(item.price)}
                  <span className="text-xs text-gray-500">/{item.unit}</span>
                </p>

                <div className="col-start-2 md:col-start-auto">
                  <QtyStepper item={item} />
                </div>

                <p className="col-start-3 row-start-2 self-center text-right text-sm font-bold md:col-start-auto md:row-start-auto">
                  {formatTL(item.lineTotal)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`${item.name} ürününü sepetten çıkar`}
                  className="col-start-3 row-start-1 grid size-8 place-items-center justify-self-end rounded text-gray-400 transition hover:bg-gray-100 hover:text-sale md:col-start-auto md:row-start-auto"
                >
                  <Trash2 className="size-4" strokeWidth={SW} aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 py-4">
            <Link href="/urunler" className="inline-flex items-center gap-2 text-xs font-medium hover:text-wood-600">
              <ArrowLeft className="size-4" strokeWidth={SW} aria-hidden /> Alışverişe Devam Et
            </Link>
            {confirmClear ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">Sepetteki tüm ürünler silinsin mi?</span>
                <button type="button" onClick={clear} className="h-8 rounded bg-sale px-3 font-semibold text-white">
                  Evet, temizle
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className="h-8 rounded px-2 hover:bg-gray-100">
                  Vazgeç
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} className="text-xs font-medium text-gray-500 hover:text-sale">
                Sepeti Temizle
              </button>
            )}
          </div>
        </section>

        {/* Sipariş özeti */}
        <aside aria-labelledby="summaryTitle" className="rounded-md border border-gray-200 bg-gray-50 p-5 lg:sticky lg:top-4">
          <h2 id="summaryTitle" className="text-base font-bold">
            Sipariş Özeti
          </h2>

          <div className="mt-4">
            <ShippingProgress summary={summary} />
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
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
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
              <dt className="font-bold">Toplam</dt>
              <dd className="font-bold">{formatTL(summary.total)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-[11px] text-gray-500">KDV dahil</p>

          <Link
            href="/odeme"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Siparişi Tamamla <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
          </Link>

          <ul className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-[11px] text-gray-600">
            <li className="flex items-center gap-2">
              <Lock className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> 256 Bit SSL ile güvenli ödeme
            </li>
            <li className="flex items-center gap-2">
              <Package className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> 14 gün içinde kolay iade
            </li>
            <li className="flex items-center gap-2">
              <Headset className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> Uzman müşteri desteği
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="status" className="mt-4 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" strokeWidth={SW} aria-hidden />
      <p className="flex-1">{text}</p>
      <button type="button" onClick={onClose} aria-label="Bildirimi kapat" className="grid size-6 place-items-center rounded hover:bg-amber-100">
        <X className="size-4" strokeWidth={SW} aria-hidden />
      </button>
    </div>
  );
}
