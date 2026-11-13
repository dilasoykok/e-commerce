'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAdminOrder, useChangeOrderStatus } from '@/hooks/useAdminOrders';
import { useEscape } from '@/lib/hooks';
import { formatTL } from '@/lib/format';
import { CARRIERS, STATUS_COLORS, deliveryLabel, formatDateTime, paymentLabel, statusLabel } from '@/lib/orders';
import { ApiError } from '@/lib/api/client';
import type { AdminOrderDetail, OrderStatus } from '@/lib/types';

const SW = 1.75;

/** Durum butonlarının yazısı: "şu duruma geçir" */
const ACTION_LABELS: Record<OrderStatus, string> = {
  awaitingPayment: 'Ödeme bekleniyor',
  received: 'Ödeme alındı / Onayla',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya verildi',
  delivered: 'Teslim edildi',
  cancelled: 'Siparişi iptal et',
};

/** Sağdan açılan sipariş detayı: müşteri, adres, fatura, ürünler, geçmiş, durum değiştirme */
export default function AdminOrderDrawer({ number, onClose }: { number: string; onClose: () => void }) {
  const detail = useAdminOrder(number);
  useEscape(true, onClose);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderDrawerTitle"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="orderDrawerTitle" className="text-base font-bold tracking-wide">
            {number}
          </h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-gray-100" aria-label="Kapat">
            <X className="size-5" strokeWidth={SW} aria-hidden />
          </button>
        </div>

        {detail.isPending ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
          </div>
        ) : detail.isError ? (
          <p className="p-5 text-sm text-sale">{detail.error.message}</p>
        ) : (
          <Body data={detail.data} />
        )}
      </aside>
    </>
  );
}

function Body({ data }: { data: AdminOrderDetail }) {
  const o = data.order;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
            {statusLabel(o.status, o.deliveryMethod)}
          </span>
          <span className="text-xs text-gray-500">{formatDateTime(o.placedAt)}</span>
        </div>

        <Section title="Müşteri">
          <p className="font-medium">
            {o.buyerFirstName} {o.buyerLastName} {data.isMember && <span className="text-xs font-normal text-brand-700">(üye)</span>}
          </p>
          <p>
            <a href={`mailto:${o.buyerEmail}`} className="underline hover:text-wood-600">
              {o.buyerEmail}
            </a>
          </p>
          {o.buyerPhone && (
            <p>
              <a href={`tel:${o.buyerPhone}`} className="underline hover:text-wood-600">
                {o.buyerPhone}
              </a>
            </p>
          )}
          {data.marketingConsent && <p className="text-xs text-gray-500">Kampanya iletisine izin verdi</p>}
        </Section>

        <Section title="Teslimat ve Ödeme">
          <p>{deliveryLabel(o.deliveryMethod)}</p>
          {o.shippingAddress && (
            <p className="text-gray-600">
              {o.shippingAddress.line}
              <br />
              {o.shippingAddress.district} / {o.shippingAddress.city} {o.shippingAddress.postalCode}
            </p>
          )}
          {o.deliveryNote && <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">Not: {o.deliveryNote}</p>}
          <p className="mt-1">{paymentLabel(o.paymentMethod)}</p>
          {o.shipment && (
            <p className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-900">
              {o.shipment.carrierName} · takip no: <strong>{o.shipment.trackingNumber}</strong>
              {o.shipment.trackingUrl && (
                <a href={o.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                  Sorgula
                </a>
              )}
            </p>
          )}
        </Section>

        <Section title="Fatura">
          {data.invoice.type === 'corporate' ? (
            <>
              <p className="font-medium">{data.invoice.companyName}</p>
              <p className="text-gray-600">
                {data.invoice.taxOffice} V.D. · {data.invoice.taxNumber}
              </p>
            </>
          ) : (
            <p>Bireysel</p>
          )}
        </Section>

        <Section title={`Ürünler (${o.items.length})`}>
          <ul className="divide-y divide-gray-100">
            {o.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 py-2">
                <span>
                  {i.productName}
                  <span className="block text-xs text-gray-500">
                    {i.productId} · {i.quantity} {i.unit ?? 'adet'} × {formatTL(i.unitPrice)}
                  </span>
                </span>
                <span className="font-semibold whitespace-nowrap">{formatTL(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-gray-100 pt-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Ara Toplam</dt>
              <dd>{formatTL(o.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Kargo</dt>
              <dd>{o.shippingFee === 0 ? 'Ücretsiz' : formatTL(o.shippingFee)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Toplam</dt>
              <dd>{formatTL(o.total)}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Geçmiş">
          <ol className="space-y-2 border-l-2 border-gray-200 pl-4">
            {o.statusHistory.map((h, i) => (
              <li key={i}>
                <p className="font-medium">{statusLabel(h.status, o.deliveryMethod)}</p>
                <p className="text-xs text-gray-500">{formatDateTime(h.changedAt)}</p>
                {h.note && <p className="text-xs text-gray-600">{h.note}</p>}
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <StatusActions key={o.status} data={data} />
    </div>
  );
}

function StatusActions({ data }: { data: AdminOrderDetail }) {
  const change = useChangeOrderStatus();
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const o = data.order;
  // Kargoya verirken firma + takip no istenir (mağazadan teslimde gerekmez)
  const needsShipment = o.deliveryMethod === 'cargo' && data.nextStatuses.includes('shipped');
  const fieldError = (f: string) => (change.error instanceof ApiError ? change.error.fieldError(f) : undefined);

  if (data.nextStatuses.length === 0) {
    return <p className="border-t border-gray-200 px-5 py-4 text-xs text-gray-500">Bu sipariş için başka işlem yok.</p>;
  }

  const run = (status: OrderStatus) =>
    change.mutate({
      number: o.number,
      status,
      note: note.trim() || undefined,
      shipment: status === 'shipped' && needsShipment ? { carrier, trackingNumber: trackingNumber.trim() } : undefined,
    });
  const forward = data.nextStatuses.filter((s) => s !== 'cancelled');
  const canCancel = data.nextStatuses.includes('cancelled');

  return (
    <div className="space-y-3 border-t border-gray-200 px-5 py-4">
      <label className="block">
        <span className="form-label">Not (isteğe bağlı, müşteri takibinde görünür)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="ör. Havale geldi"
          className="form-input"
        />
      </label>

      {needsShipment && (
        <div className="grid gap-3 rounded border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-2">
          <p className="text-xs font-semibold text-blue-900 sm:col-span-2">Kargoya verirken doldurun</p>
          <label className="block">
            <span className="form-label">Kargo firması</span>
            <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="form-input" aria-invalid={Boolean(fieldError('carrier'))}>
              <option value="">Seçin</option>
              {CARRIERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {fieldError('carrier') && <span className="form-error block">{fieldError('carrier')}</span>}
          </label>
          <label className="block">
            <span className="form-label">Takip numarası</span>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              maxLength={64}
              className="form-input"
              aria-invalid={Boolean(fieldError('trackingNumber'))}
            />
            {fieldError('trackingNumber') && <span className="form-error block">{fieldError('trackingNumber')}</span>}
          </label>
        </div>
      )}

      {change.isError && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-xs text-sale">
          {change.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {forward.map((s) => (
          <button
            key={s}
            type="button"
            disabled={change.isPending}
            onClick={() => run(s)}
            className="flex h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {change.isPending && change.variables?.status === s && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {s === 'shipped' && o.deliveryMethod === 'store' ? 'Teslimata hazır' : ACTION_LABELS[s]}
          </button>
        ))}

        {canCancel &&
          (confirmCancel ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">İptal edilsin mi? Stok geri eklenir.</span>
              <button
                type="button"
                disabled={change.isPending}
                onClick={() => run('cancelled')}
                className="h-9 rounded bg-sale px-3 font-semibold text-white disabled:opacity-60"
              >
                Evet, iptal et
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="h-9 rounded px-2 hover:bg-gray-100">
                Vazgeç
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="h-10 rounded px-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-sale"
            >
              {ACTION_LABELS.cancelled}
            </button>
          ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      {children}
    </section>
  );
}
