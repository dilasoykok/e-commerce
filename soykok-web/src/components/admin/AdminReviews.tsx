'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useAdminReviews, useApproveReview, useDeleteReview } from '@/hooks/useReviews';
import { formatDateTime } from '@/lib/orders';
import type { AdminReview } from '@/lib/types';

const SW = 1.75;
type Durum = 'bekleyen' | 'onayli' | undefined;

const FILTERS: { label: string; value: Durum }[] = [
  { label: 'Onay bekleyen', value: 'bekleyen' },
  { label: 'Yayında', value: 'onayli' },
  { label: 'Tümü', value: undefined },
];

/**
 * /admin/yorumlar — müşteri yorumlarının onayı.
 * Onaylanan yorum ürün sayfasında görünür ve ürünün puanı/yorum sayısı yeniden hesaplanır.
 */
export default function AdminReviews() {
  const [durum, setDurum] = useState<Durum>('bekleyen');
  const [page, setPage] = useState(1);
  const list = useAdminReviews({ durum, page });
  const data = list.data;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Yorumlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            {data ? `${data.pending} yorum onay bekliyor` : 'Yükleniyor…'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => list.refetch()}
          className="flex h-10 items-center gap-2 rounded border border-gray-300 px-4 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className={`size-4 ${list.isFetching ? 'animate-spin' : ''}`} strokeWidth={SW} aria-hidden /> Yenile
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtre">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={durum === f.value}
            onClick={() => {
              setDurum(f.value);
              setPage(1);
            }}
            className={`h-9 rounded-full border px-4 text-sm font-medium ${
              durum === f.value ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-300 hover:border-brand-900'
            }`}
          >
            {f.label}
            {f.value === 'bekleyen' && data && data.pending > 0 && (
              <span className="ml-2 rounded-full bg-sale px-1.5 text-xs font-semibold text-white">{data.pending}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-gray-200 bg-white">
        {list.isError ? (
          <p className="p-6 text-sm text-sale">{list.error.message}</p>
        ) : !data ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
          </div>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">{durum === 'bekleyen' ? 'Onay bekleyen yorum yok.' : 'Yorum yok.'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.items.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </ul>
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
    </div>
  );
}

function ReviewRow({ review: r }: { review: AdminReview }) {
  const approve = useApproveReview();
  const remove = useDeleteReview();
  const [confirming, setConfirming] = useState(false);
  const error = approve.error ?? remove.error;

  return (
    <li className={`px-4 py-4 text-sm ${r.isApproved ? '' : 'bg-amber-50/50'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link href={`/urun/${encodeURIComponent(r.productId)}#degerlendirmeler`} className="font-semibold underline-offset-2 hover:underline">
          {r.productName}
        </Link>
        <span className="text-xs text-gray-600">{formatDateTime(r.createdAt)}</span>
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700">
        <span className="text-base leading-none text-amber-600" role="img" aria-label={`5 üzerinden ${r.rating} puan`}>
          {'★'.repeat(r.rating)}
          <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
        </span>
        <span className="font-medium">{r.authorName}</span>
        {r.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 text-green-800">
            <BadgeCheck className="size-4" strokeWidth={SW} aria-hidden /> Doğrulanmış alıcı
          </span>
        )}
        <span className={`rounded px-1.5 py-0.5 ${r.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
          {r.isApproved ? 'Yayında' : 'Onay bekliyor'}
        </span>
      </p>

      {r.title && <p className="mt-2 font-medium">{r.title}</p>}
      <p className="mt-1 whitespace-pre-line text-gray-800">{r.comment}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!r.isApproved && (
          <button
            type="button"
            disabled={approve.isPending}
            onClick={() => approve.mutate(r.id)}
            className="flex h-9 items-center gap-1.5 rounded bg-green-700 px-3 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            <Check className="size-4" strokeWidth={SW} aria-hidden /> {approve.isPending ? 'Onaylanıyor…' : 'Onayla'}
          </button>
        )}
        {confirming ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Silinsin mi?</span>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(r.id)}
              className="h-9 rounded bg-sale px-3 font-semibold text-white disabled:opacity-60"
            >
              {remove.isPending ? 'Siliniyor…' : 'Evet, sil'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="h-9 rounded px-2 hover:bg-gray-100">
              Vazgeç
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex h-9 items-center gap-1.5 rounded px-3 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-sale"
          >
            <Trash2 className="size-4" strokeWidth={SW} aria-hidden /> {r.isApproved ? 'Yayından kaldır' : 'Reddet'}
          </button>
        )}
        {error && <span className="text-xs text-sale">{error.message}</span>}
      </div>
    </li>
  );
}
