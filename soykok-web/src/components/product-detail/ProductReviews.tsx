'use client';

import { useEffect, useId, useState } from 'react';
import { BadgeCheck, Clock, Pencil } from 'lucide-react';

import { ApiError } from '@/lib/api/client';
import { loginUrl } from '@/lib/auth';
import { useUser } from '@/hooks/useUser';
import { useProductReviews, useWriteReview } from '@/hooks/useReviews';
import type { MyReview, Review } from '@/lib/types';

/**
 * Ürün sayfasındaki "Değerlendirmeler" sekmesi.
 *   - Özet: ortalama puan + 5★..1★ dağılımı (yalnızca onaylı yorumlar)
 *   - Liste: sayfalı; satın almış üyelerde "Doğrulanmış alıcı" rozeti
 *   - Form: yalnızca üyeler; yorum onaydan sonra yayınlanır, düzenlenirse yeniden onaya düşer
 */
export default function ProductReviews({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useProductReviews(productId, page);

  if (isPending) return <p className="text-sm text-gray-500">Değerlendirmeler yükleniyor…</p>;
  if (isError || !data) return <p className="text-sm text-gray-500">Değerlendirmeler şu an yüklenemedi.</p>;

  const { summary, items, total, pageSize, myReview } = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-6">
        <Summary average={summary.average} count={summary.count} distribution={summary.distribution} />
        <ReviewFormBox productId={productId} mine={myReview} />
      </div>

      <section aria-labelledby="reviewListTitle">
        <h3 id="reviewListTitle" className="sr-only">
          Müşteri yorumları
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Bu ürün için henüz değerlendirme yok. İlk yorumu siz yazın.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Yorum sayfaları">
            <button
              type="button"
              className="min-h-10 rounded-md border border-gray-300 px-4 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Önceki
            </button>
            <span aria-live="polite">
              {page} / {pages}
            </span>
            <button
              type="button"
              className="min-h-10 rounded-md border border-gray-300 px-4 disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

/* ---------------- Özet ---------------- */

function Summary({ average, count, distribution }: { average: number; count: number; distribution: number[] }) {
  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-4">
        <p className="text-5xl font-bold">{count ? average.toLocaleString('tr-TR', { minimumFractionDigits: 1 }) : '–'}</p>
        <div>
          <Stars rating={average} className="text-xl" />
          <p className="mt-1 text-xs text-gray-600">{count} değerlendirme</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5" aria-label="Puan dağılımı">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution[star - 1] ?? 0;
          const pct = count ? Math.round((n / count) * 100) : 0;
          return (
            <li key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 text-gray-700">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-gray-600">
                {n}
                <span className="sr-only"> değerlendirme</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Liste ---------------- */

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="py-5 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={review.rating} className="text-base" />
        {review.title && <p className="font-semibold">{review.title}</p>}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800">{review.comment}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="font-medium text-gray-800">{review.authorName}</span>
        <time dateTime={review.createdAt}>{dateFmt.format(new Date(review.createdAt))}</time>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 font-medium text-green-800">
            <BadgeCheck className="size-4" aria-hidden="true" /> Doğrulanmış alıcı
          </span>
        )}
      </p>
    </li>
  );
}

/* ---------------- Form ---------------- */

function ReviewFormBox({ productId, mine }: { productId: string; mine: MyReview | null }) {
  const { isLoggedIn, isLoading } = useUser();
  const [editing, setEditing] = useState(false);

  if (isLoading) return null;

  if (!isLoggedIn)
    return (
      <div className="rounded-lg bg-gray-50 p-5 text-sm">
        <p className="font-semibold">Bu ürünü kullandınız mı?</p>
        <p className="mt-1 text-gray-700">Değerlendirme yazmak için üye girişi yapın.</p>
        <a
          href={loginUrl()}
          className="mt-3 inline-flex min-h-10 items-center rounded-md bg-brand-900 px-4 font-semibold text-white hover:bg-brand-800"
        >
          Giriş Yap
        </a>
      </div>
    );

  if (mine && !editing)
    return (
      <div className="rounded-lg bg-gray-50 p-5 text-sm">
        <p className="font-semibold">Değerlendirmeniz</p>
        <Stars rating={mine.rating} className="mt-1 text-base" />
        {mine.title && <p className="mt-1 font-medium">{mine.title}</p>}
        <p className="mt-1 line-clamp-4 whitespace-pre-line text-gray-700">{mine.comment}</p>
        {mine.isApproved ? (
          <p className="mt-3 inline-flex items-center gap-1 text-green-800">
            <BadgeCheck className="size-4" aria-hidden="true" /> Yayında
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1 text-amber-800">
            <Clock className="size-4" aria-hidden="true" /> Onay bekliyor
          </p>
        )}
        <div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 font-semibold hover:bg-gray-100"
          >
            <Pencil className="size-4" aria-hidden="true" /> Düzenle
          </button>
        </div>
      </div>
    );

  return <ReviewForm productId={productId} initial={mine} onDone={() => setEditing(false)} />;
}

type Errors = Partial<Record<'rating' | 'title' | 'comment' | 'form', string>>;

function ReviewForm({ productId, initial, onDone }: { productId: string; initial: MyReview | null; onDone: () => void }) {
  const id = useId();
  const write = useWriteReview(productId);
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  useEffect(() => setSent(false), [rating, title, comment]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (rating < 1) next.rating = 'Lütfen 1 ile 5 arasında puan verin.';
    if (comment.trim().length < 10) next.comment = 'Yorumunuz en az 10 karakter olmalı.';
    setErrors(next);
    if (Object.keys(next).length) return;

    write.mutate(
      { rating, title: title.trim() || null, comment: comment.trim() },
      {
        onSuccess: () => {
          setSent(true);
          onDone();
        },
        onError: (err) => {
          if (err instanceof ApiError && Object.keys(err.fields).length) {
            const f = err.fields as Record<string, string[]>;
            setErrors({ rating: f.rating?.[0], title: f.title?.[0], comment: f.comment?.[0] });
          } else if (err instanceof ApiError && err.status === 401) {
            window.location.href = loginUrl();
          } else {
            setErrors({ form: 'Değerlendirmeniz gönderilemedi. Lütfen tekrar deneyin.' });
          }
        },
      },
    );
  };

  const field = 'w-full rounded-md border border-gray-400 px-3 py-2 text-sm focus:border-brand-900';

  return (
    <form onSubmit={submit} noValidate className="rounded-lg bg-gray-50 p-5 text-sm" aria-labelledby={`${id}-t`}>
      <p id={`${id}-t`} className="font-semibold">
        {initial ? 'Değerlendirmeyi düzenle' : 'Değerlendirme yaz'}
      </p>

      <fieldset className="mt-3" aria-describedby={errors.rating ? `${id}-re` : undefined}>
        <legend className="mb-1 font-medium">Puanınız</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span
                className={`flex size-10 items-center justify-center rounded-md text-2xl leading-none peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 ${
                  n <= rating ? 'text-amber-500' : 'text-gray-400'
                }`}
                aria-hidden="true"
              >
                ★
              </span>
              <span className="sr-only">{n} yıldız</span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p id={`${id}-re`} className="mt-1 text-xs text-sale">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <label className="mt-3 block font-medium" htmlFor={`${id}-title`}>
        Başlık <span className="font-normal text-gray-600">(isteğe bağlı)</span>
      </label>
      <input
        id={`${id}-title`}
        value={title}
        maxLength={150}
        onChange={(e) => setTitle(e.target.value)}
        className={`mt-1 ${field}`}
        aria-invalid={Boolean(errors.title)}
      />
      {errors.title && <p className="mt-1 text-xs text-sale">{errors.title}</p>}

      <label className="mt-3 block font-medium" htmlFor={`${id}-comment`}>
        Yorumunuz
      </label>
      <textarea
        id={`${id}-comment`}
        value={comment}
        rows={5}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        className={`mt-1 ${field}`}
        aria-invalid={Boolean(errors.comment)}
        aria-describedby={`${id}-ch${errors.comment ? ` ${id}-ce` : ''}`}
      />
      <p id={`${id}-ch`} className="mt-1 text-xs text-gray-600">
        En az 10 karakter. Yorumlar onaylandıktan sonra adınızın baş harfiyle yayınlanır.
      </p>
      {errors.comment && (
        <p id={`${id}-ce`} className="mt-1 text-xs text-sale">
          {errors.comment}
        </p>
      )}

      {errors.form && (
        <p role="alert" className="mt-3 text-xs text-sale">
          {errors.form}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {sent ? 'Değerlendirmeniz alındı, onaydan sonra yayınlanacak.' : ''}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={write.isPending}
          className="inline-flex min-h-10 items-center rounded-md bg-brand-900 px-4 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {write.isPending ? 'Gönderiliyor…' : 'Gönder'}
        </button>
        {initial && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex min-h-10 items-center rounded-md border border-gray-300 bg-white px-4 font-semibold hover:bg-gray-100"
          >
            Vazgeç
          </button>
        )}
      </div>
    </form>
  );
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`relative inline-block leading-none ${className}`} role="img" aria-label={`5 üzerinden ${rating} puan`}>
      <span className="text-gray-300">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${(rating / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
