'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Mail, MailOpen, Phone, RefreshCw, Reply, Trash2 } from 'lucide-react';
import { useAdminMessages, useDeleteMessage, useMarkMessage } from '@/hooks/useAdminMessages';
import { formatDateTime } from '@/lib/orders';
import type { ContactMessage } from '@/lib/types';

const SW = 1.75;

/**
 * /admin/mesajlar — sitedeki iletişim formundan gelen mesajlar.
 * Mesaj açılınca okundu işaretlenir; "Yanıtla" e-posta programını müşterinin adresiyle açar.
 */
export default function AdminMessages() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useAdminMessages({ okunmamis: unreadOnly, page });
  const mark = useMarkMessage();

  const data = list.data;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const toggle = (m: ContactMessage) => {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.isRead) mark.mutate({ id: m.id, read: true });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mesajlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} mesaj · ${data.unread} okunmamış` : 'Yükleniyor…'}
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

      <div className="mt-5 flex gap-2">
        {[
          { label: 'Tümü', value: false },
          { label: 'Okunmamış', value: true },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              setUnreadOnly(t.value);
              setPage(1);
            }}
            className={`h-9 rounded-full border px-4 text-sm font-medium ${
              unreadOnly === t.value ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-300 hover:border-brand-900'
            }`}
          >
            {t.label}
            {t.value && data && data.unread > 0 && (
              <span className="ml-2 rounded-full bg-sale px-1.5 text-xs font-semibold text-white">{data.unread}</span>
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
          <p className="p-6 text-sm text-gray-500">{unreadOnly ? 'Okunmamış mesaj yok.' : 'Henüz mesaj yok.'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.items.map((m) => (
              <MessageRow key={m.id} message={m} open={openId === m.id} onToggle={() => toggle(m)} />
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

function MessageRow({ message: m, open, onToggle }: { message: ContactMessage; open: boolean; onToggle: () => void }) {
  const mark = useMarkMessage();
  const remove = useDeleteMessage();
  const [confirming, setConfirming] = useState(false);
  const replySubject = encodeURIComponent(`Re: ${m.subjectLabel}${m.orderNumber ? ` (${m.orderNumber})` : ''}`);

  return (
    <li className={m.isRead ? '' : 'bg-blue-50/40'}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50">
        {m.isRead ? (
          <MailOpen className="mt-0.5 size-4 shrink-0 text-gray-500" strokeWidth={SW} aria-label="Okundu" />
        ) : (
          <Mail className="mt-0.5 size-4 shrink-0 text-brand-900" strokeWidth={SW} aria-label="Okunmadı" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span className={`text-sm ${m.isRead ? '' : 'font-semibold'}`}>{m.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{m.subjectLabel}</span>
            {m.orderNumber && <span className="text-xs text-gray-500">{m.orderNumber}</span>}
          </span>
          {!open && <span className="mt-0.5 block truncate text-xs text-gray-500">{m.message}</span>}
        </span>
        <span className="shrink-0 text-xs text-gray-500">{formatDateTime(m.createdAt)}</span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4 pl-11 text-sm">
          <p className="text-xs text-gray-600">
            <a href={`mailto:${m.email}`} className="underline">
              {m.email}
            </a>
            {m.phone && (
              <>
                {' · '}
                <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 underline">
                  <Phone className="size-3" strokeWidth={SW} aria-hidden />
                  {m.phone}
                </a>
              </>
            )}
          </p>
          <p className="rounded bg-gray-50 p-3 whitespace-pre-line">{m.message}</p>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`mailto:${m.email}?subject=${replySubject}`}
              className="flex h-9 items-center gap-2 rounded bg-brand-900 px-3 text-xs font-semibold text-white hover:bg-brand-700"
            >
              <Reply className="size-4" strokeWidth={SW} aria-hidden /> Yanıtla
            </a>
            <button
              type="button"
              onClick={() => mark.mutate({ id: m.id, read: !m.isRead })}
              className="h-9 rounded border border-gray-300 px-3 text-xs font-medium hover:bg-gray-50"
            >
              {m.isRead ? 'Okunmadı yap' : 'Okundu yap'}
            </button>
            {confirming ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">{remove.isError ? remove.error.message : 'Silinsin mi?'}</span>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(m.id)}
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
                <Trash2 className="size-4" strokeWidth={SW} aria-hidden /> Sil
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
