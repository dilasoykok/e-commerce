import Image from 'next/image';
import Link from 'next/link';
import { Check, Landmark, Store, Truck, XCircle } from 'lucide-react';
import { formatTL } from '@/lib/format';
import { productHref } from '@/lib/routes';
import { BANK_TRANSFER, STAGES, deliveryLabel, formatDateTime, paymentLabel, stageIndex, statusLabel } from '@/lib/orders';
import type { OrderDetail, OrderItem, OrderSummary } from '@/lib/types';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const SW = 1.75;

/**
 * Sipariş kartı (eski orders.js → orderHeader + timeline + orderDetails).
 * Hook kullanmaz: hem sunucuda (üye listesi) hem tarayıcıda (misafir takibi) çizilebilir.
 * Detay (OrderDetail) verilirse adres ve tutar dökümü de görünür.
 */
export default function OrderCard({ order, open = false }: { order: OrderSummary | OrderDetail; open?: boolean }) {
  const detail = 'statusHistory' in order ? order : null;
  const done = order.status === 'delivered';

  return (
    <article className="overflow-hidden rounded-md border border-gray-200 bg-white">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="text-gray-500">Sipariş No: </span>
            <strong className="tracking-wide">{order.number}</strong>
          </span>
          <span className="text-gray-500">{formatDateTime(order.placedAt)}</span>
          <span>
            <span className="text-gray-500">Toplam: </span>
            <strong>{formatTL(order.total)}</strong>
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            order.status === 'cancelled'
              ? 'bg-red-100 text-sale'
              : done
                ? 'bg-green-100 text-green-800'
                : 'bg-brand-900/10 text-brand-900'
          }`}
        >
          {statusLabel(order.status, order.deliveryMethod)}
        </span>
      </div>

      <div className="p-5">
        <Timeline order={order} />

        {order.status === 'awaitingPayment' && order.paymentMethod === 'transfer' && (
          <div className="mt-5 flex gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Landmark className="size-5 shrink-0" strokeWidth={SW} aria-hidden />
            <div>
              <p className="font-semibold">Havale/EFT bekleniyor</p>
              <p className="mt-0.5">
                {BANK_TRANSFER.bank} · {BANK_TRANSFER.holder} · <span className="font-mono">{BANK_TRANSFER.iban}</span>
              </p>
              <p className="mt-0.5">Açıklamaya sipariş numaranızı ({order.number}) yazmayı unutmayın.</p>
            </div>
          </div>
        )}

        {order.shipment && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
            <Truck className="size-5 shrink-0" strokeWidth={SW} aria-hidden />
            <p className="flex-1">
              <span className="font-semibold">{order.shipment.carrierName}</span> · Takip no:{' '}
              <strong className="font-mono tracking-wide">{order.shipment.trackingNumber}</strong>
            </p>
            {order.shipment.trackingUrl && (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-blue-900 px-3 py-1.5 font-semibold text-white hover:bg-blue-800"
              >
                Kargonu Takip Et
              </a>
            )}
          </div>
        )}

        <details open={open} className="group mt-5">
          <summary className="cursor-pointer list-none text-xs font-semibold text-brand-900 hover:text-wood-600 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Sipariş detayını göster ({order.items.length} ürün)</span>
            <span className="hidden group-open:inline">Detayı gizle</span>
          </summary>

          <ul className="mt-3 divide-y divide-gray-100">
            {order.items.map((item) => (
              <ItemRow key={item.productId} item={item} />
            ))}
          </ul>

          <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 text-xs sm:grid-cols-2">
            <div className="space-y-1 text-gray-600">
              <p className="flex items-center gap-2 font-semibold text-brand-900">
                {order.deliveryMethod === 'store' ? (
                  <Store className="size-4" strokeWidth={SW} aria-hidden />
                ) : (
                  <Truck className="size-4" strokeWidth={SW} aria-hidden />
                )}
                {deliveryLabel(order.deliveryMethod)}
              </p>
              {detail?.shippingAddress && (
                <p>
                  {detail.shippingAddress.line && (
                    <>
                      {detail.shippingAddress.line}
                      <br />
                    </>
                  )}
                  {detail.shippingAddress.district} / {detail.shippingAddress.city}
                  {detail.shippingAddress.postalCode && ` ${detail.shippingAddress.postalCode}`}
                </p>
              )}
              {detail?.deliveryMethod === 'store' && <p>Safranbolu mağazamızdan teslim alabilirsiniz.</p>}
              <p>Ödeme: {paymentLabel(order.paymentMethod)}</p>
            </div>

            {detail && (
              <dl className="space-y-1 sm:text-right">
                <div className="flex justify-between sm:justify-end sm:gap-6">
                  <dt className="text-gray-600">Ara Toplam</dt>
                  <dd className="font-semibold">{formatTL(detail.subtotal)}</dd>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-6">
                  <dt className="text-gray-600">Kargo</dt>
                  <dd className="font-semibold">{detail.shippingFee === 0 ? 'Ücretsiz' : formatTL(detail.shippingFee)}</dd>
                </div>
                <div className="flex justify-between text-sm sm:justify-end sm:gap-6">
                  <dt className="font-bold">Toplam</dt>
                  <dd className="font-bold">{formatTL(detail.total)}</dd>
                </div>
              </dl>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

function Timeline({ order }: { order: OrderSummary | OrderDetail }) {
  if (order.status === 'cancelled') {
    return (
      <p className="flex items-center gap-2 text-sm text-sale">
        <XCircle className="size-5" strokeWidth={SW} aria-hidden /> Bu sipariş iptal edildi.
      </p>
    );
  }

  const current = stageIndex(order.status); // ödeme bekleniyorsa -1: hiçbir adım tamamlanmadı
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Sipariş durumu">
      {STAGES.map((s, i) => {
        const reached = i <= current;
        const label = order.deliveryMethod === 'store' && s.storeLabel ? s.storeLabel : s.label;
        return (
          <li key={s.status} className="flex flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : reached ? 'bg-green-600' : 'bg-gray-200'}`} />
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  reached ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {reached ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : i + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === STAGES.length - 1 ? 'invisible' : i < current ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            </div>
            <span className={`mt-1.5 text-xs leading-tight ${reached ? 'font-semibold text-brand-900' : 'text-gray-500'}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={productHref(item.productId)} className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
        {item.image && <Image src={productImageSrc(item.image)} unoptimized={isUploadedImage(item.image)} alt="" fill sizes="64px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={productHref(item.productId)} className="text-xs font-semibold hover:text-wood-600">
          {item.productName}
        </Link>
        <p className="text-xs text-gray-500">
          {item.brand} · {item.quantity} {item.unit ?? 'm²'} × {formatTL(item.unitPrice)}
        </p>
      </div>
      <p className="text-sm font-bold">{formatTL(item.lineTotal)}</p>
    </li>
  );
}
