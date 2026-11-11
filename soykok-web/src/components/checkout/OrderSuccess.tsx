'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CircleCheck, Landmark, Loader2, Truck } from 'lucide-react';

import { readLastOrder, saveLastOrder } from '@/lib/last-order';
import { useCart, useCartHydrated } from '@/store/cart';
import { formatTL } from '@/lib/format';
import { BANK_TRANSFER, deliveryLabel, paymentLabel } from '@/lib/orders';
import type { OrderDetail } from '@/lib/types';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const SW = 1.75;

/** Sipariş onayı (eski siparis-tamamlandi.html + order-success.js) */
export default function OrderSuccess({ paidNumber }: { paidNumber?: string | null }) {
  // undefined: henüz okunmadı, null: sipariş yok
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);
  const clearCart = useCart((s) => s.clear);
  const cartHydrated = useCartHydrated();

  useEffect(() => {
    const last = readLastOrder();
    if (last && paidNumber && last.number === paidNumber && last.status === 'awaitingPayment') {
      // Kart ödemesi onaylandı (iyzico dönüşü)
      const paid: OrderDetail = { ...last, status: 'received', paymentPageUrl: null };
      saveLastOrder(paid);
      setOrder(paid);
    } else {
      setOrder(last);
    }
  }, [paidNumber]);

  // Kartla ödeme başarılı: sepet ancak şimdi boşaltılır (kaydedilmiş sepet yüklendikten sonra)
  useEffect(() => {
    if (paidNumber && cartHydrated) clearCart();
  }, [paidNumber, cartHydrated, clearCart]);

  if (order === undefined) {
    return (
      <div className="grid h-60 place-items-center">
        <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
      </div>
    );
  }

  if (order === null && paidNumber) {
    return (
      <div className="checkout-card mx-auto mt-6 max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
          <CircleCheck className="size-9" strokeWidth={SW} aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold">Ödemeniz alındı, teşekkürler!</h1>
        <p className="mt-3 text-sm text-gray-600">Sipariş numaranız</p>
        <p className="mt-1 text-2xl font-bold tracking-wide text-brand-900">{paidNumber}</p>
        <Link
          href={`/siparislerim?no=${encodeURIComponent(paidNumber)}`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Truck className="size-4" strokeWidth={SW} aria-hidden /> Siparişimi Takip Et
        </Link>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="checkout-card mx-auto max-w-lg text-center">
        <p className="text-lg font-semibold">Gösterilecek sipariş bulunamadı</p>
        <p className="mt-1 text-sm text-gray-500">Siparişlerinizi Sipariş Takibi sayfasından görebilirsiniz.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/siparislerim" className="inline-flex h-11 items-center rounded border border-brand-900 px-5 text-sm font-semibold text-brand-900">
            Sipariş Takibi
          </Link>
          <Link href="/" className="inline-flex h-11 items-center rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const awaitingTransfer = order.paymentMethod === 'transfer' && order.status === 'awaitingPayment';

  // Kartla sipariş verilmiş ama iyzico dönüşü gelmemiş (ör. ödeme sayfasından geri dönüldü)
  if (order.paymentMethod === 'card' && order.status === 'awaitingPayment') {
    return (
      <div className="checkout-card mx-auto mt-6 max-w-lg text-center">
        <p className="text-lg font-semibold">Ödemeniz henüz tamamlanmadı</p>
        <p className="mt-2 text-sm text-gray-600">
          <strong>{order.number}</strong> numaralı siparişin kart ödemesi onaylanmadı. Ödeme sayfasını yarıda bıraktıysanız
          sepetinize dönüp tekrar deneyebilirsiniz.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sepet" className="inline-flex h-11 items-center rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700">
            Sepete Dön
          </Link>
          <Link href={`/siparislerim?no=${encodeURIComponent(order.number)}`} className="inline-flex h-11 items-center rounded border border-brand-900 px-5 text-sm font-semibold text-brand-900">
            Sipariş Durumu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="checkout-card mt-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
          <CircleCheck className="size-9" strokeWidth={SW} aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Teşekkürler {order.buyerFirstName}, siparişiniz alındı!</h1>
        <p className="mt-3 text-sm text-gray-600">Sipariş numaranız</p>
        <p className="mt-1 text-2xl font-bold tracking-wide text-brand-900">{order.number}</p>
        <p className="mt-2 text-xs text-gray-500">
          Siparişinizi bu numara ve <strong>{order.buyerEmail}</strong> adresiyle takip edebilirsiniz.
        </p>
      </section>

      {awaitingTransfer && (
        <section className="checkout-card mt-4" aria-labelledby="transferTitle">
          <h2 id="transferTitle" className="flex items-center gap-2 text-base font-bold">
            <Landmark className="size-5" strokeWidth={SW} aria-hidden /> Havale / EFT Bilgileri
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Lütfen <strong>{formatTL(order.total)}</strong> tutarı 24 saat içinde aşağıdaki hesaba gönderin. Açıklama kısmına sipariş
            numaranızı (<strong>{order.number}</strong>) yazmayı unutmayın.
          </p>
          <dl className="mt-4 grid gap-2 rounded bg-gray-50 p-4 text-xs sm:grid-cols-[120px_1fr]">
            <dt className="text-gray-500">Banka</dt>
            <dd className="font-semibold">{BANK_TRANSFER.bank}</dd>
            <dt className="text-gray-500">Hesap Sahibi</dt>
            <dd className="font-semibold">{BANK_TRANSFER.holder}</dd>
            <dt className="text-gray-500">IBAN</dt>
            <dd className="font-mono font-semibold tracking-wide">{BANK_TRANSFER.iban}</dd>
          </dl>
        </section>
      )}

      <section className="checkout-card mt-4" aria-labelledby="orderSummaryTitle">
        <h2 id="orderSummaryTitle" className="text-base font-bold">
          Sipariş Özeti
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
          <div className="flex justify-between sm:block">
            <dt className="text-gray-500">Teslimat</dt>
            <dd className="font-semibold">
              {deliveryLabel(order.deliveryMethod)}
              {order.shippingAddress && ` — ${order.shippingAddress.district} / ${order.shippingAddress.city}`}
            </dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-gray-500">Ödeme</dt>
            <dd className="font-semibold">{paymentLabel(order.paymentMethod)}</dd>
          </div>
        </dl>

        <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-200">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                {item.image && <Image src={productImageSrc(item.image)} unoptimized={isUploadedImage(item.image)} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} {item.unit ?? 'm²'} × {formatTL(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{formatTL(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Ara Toplam</dt>
            <dd className="font-semibold">{formatTL(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Kargo</dt>
            <dd className="font-semibold">{order.shippingFee === 0 ? 'Ücretsiz' : formatTL(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
            <dt className="font-bold">Toplam</dt>
            <dd className="font-bold">{formatTL(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={`/siparislerim?no=${encodeURIComponent(order.number)}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-brand-900 px-6 text-sm font-semibold text-brand-900 hover:bg-brand-900 hover:text-white"
        >
          <Truck className="size-4" strokeWidth={SW} aria-hidden /> Siparişimi Takip Et
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-brand-900 px-6 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Alışverişe Devam Et <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
