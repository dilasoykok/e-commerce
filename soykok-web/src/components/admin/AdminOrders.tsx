'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, User } from 'lucide-react';
import AdminOrderDrawer from './AdminOrderDrawer';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { formatTL } from '@/lib/format';
import { STATUS_COLORS, formatDateTime, paymentLabel, statusLabel } from '@/lib/orders';
import type { OrderStatus } from '@/lib/types';

const PAGE_SIZE = 20;
const SW = 1.75;

const FILTERS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'awaitingPayment', label: 'Ödeme Bekleniyor' },
  { value: 'received', label: 'Yeni' },
  { value: 'preparing', label: 'Hazırlanıyor' },
  { value: 'shipped', label: 'Kargoda / Hazır' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];


/** /admin/siparisler — sipariş listesi, filtre, arama; satıra tıklayınca detay ve durum değiştirme */
export default function AdminOrders() {
  const [durum, setDurum] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const orders = useAdminOrders({ durum, q, page, pageSize: PAGE_SIZE });
  const total = orders.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Siparişler</h1>
          <p className="mt-1 text-sm text-gray-500">{orders.data ? `${total} sipariş` : 'Yükleniyor…'}</p>
        </div>
        <button
          type="button"
          onClick={() => orders.refetch()}
          className="flex h-9 items-center gap-2 rounded border border-gray-300 px-3 text-xs font-medium hover:border-brand-900"
        >
          <RefreshCw className={`size-4 ${orders.isFetching ? 'animate-spin' : ''}`} strokeWidth={SW} aria-hidden /> Yenile
        </button>
      </div>

      {/* Durum filtresi */}
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Sipariş durumu">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={durum === f.value}
            onClick={() => {
              setDurum(f.value);
              setPage(1);
            }}
            className="h-8 rounded-full border border-gray-300 px-3 text-xs font-medium transition aria-selected:border-brand-900 aria-selected:bg-brand-900 aria-selected:text-white"
          >
            {f.label}
          </button>
        ))}
      </div>

      <label className="relative mt-3 block max-w-md">
        <span className="sr-only">Ara</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" strokeWidth={SW} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sipariş no, ad, e-posta veya telefon"
          className="form-input pl-9"
        />
      </label>

      <div className="mt-4 overflow-x-auto rounded-md border border-gray-200">
        {orders.isError ? (
          <p className="p-6 text-sm text-sale">{orders.error.message}</p>
        ) : orders.isPending ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
          </div>
        ) : orders.data.items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Sipariş bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Sipariş</th>
                <th className="px-4 py-2.5 font-medium">Müşteri</th>
                <th className="px-4 py-2.5 font-medium">Teslimat / Ödeme</th>
                <th className="px-4 py-2.5 text-right font-medium">Tutar</th>
                <th className="px-4 py-2.5 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.data.items.map((o) => (
                <tr
                  key={o.number}
                  onClick={() => setOpen(o.number)}
                  className="cursor-pointer align-middle hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    {/* Klavyeyle de açılabilsin diye numara bir buton */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(o.number);
                      }}
                      className="font-semibold tracking-wide hover:text-wood-600"
                    >
                      {o.number}
                    </button>
                    <p className="text-xs text-gray-500">{formatDateTime(o.placedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 font-medium">
                      {o.buyerName}
                      {o.isMember && (
                        <span title="Üye" className="text-brand-700">
                          <User className="size-3.5" strokeWidth={SW} aria-label="Üye" />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{o.buyerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{o.deliveryMethod === 'store' ? 'Mağazadan teslim' : `Kargo${o.city ? ` · ${o.city}` : ''}`}</p>
                    <p>{paymentLabel(o.paymentMethod)}</p>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <p className="font-semibold">{formatTL(o.total)}</p>
                    <p className="text-xs text-gray-500">{o.itemCount} kalem</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[o.status]}`}>
                      {statusLabel(o.status, o.deliveryMethod)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="grid size-9 place-items-center rounded border border-gray-300 disabled:opacity-40"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="size-4" strokeWidth={SW} aria-hidden />
          </button>
          <span className="px-2 text-gray-600">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="grid size-9 place-items-center rounded border border-gray-300 disabled:opacity-40"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="size-4" strokeWidth={SW} aria-hidden />
          </button>
        </div>
      )}

      {open && <AdminOrderDrawer number={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
