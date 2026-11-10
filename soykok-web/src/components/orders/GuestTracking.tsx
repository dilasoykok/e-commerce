'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import OrderCard from './OrderCard';
import { useTrackOrder } from '@/hooks/useOrders';

/** Misafir sipariş takibi formu (eski orders.js → renderGuest). ?no= ile numara dolu gelir. */
export default function GuestTracking({ initialNumber = '' }: { initialNumber?: string }) {
  const [number, setNumber] = useState(initialNumber);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const track = useTrackOrder();

  return (
    <div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!number.trim() || !email.trim()) {
            setError('Sipariş numarası ve e-posta adresini girin.');
            return;
          }
          track.mutate({ number: number.trim(), email: email.trim() });
        }}
        className="checkout-card grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="trackNo" className="form-label">
            Sipariş Numarası
          </label>
          <input
            id="trackNo"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="SYK-261110-1234"
            autoComplete="off"
            className="form-input uppercase placeholder:normal-case"
          />
        </div>
        <div>
          <label htmlFor="trackEmail" className="form-label">
            E-posta
          </label>
          <input
            id="trackEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="ornek@mail.com"
            className="form-input"
          />
        </div>
        <button
          type="submit"
          disabled={track.isPending}
          className="flex h-10 items-center justify-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {track.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Search className="size-4" strokeWidth={1.75} aria-hidden />
          )}
          Sorgula
        </button>

        {(error || track.isError) && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-xs text-sale sm:col-span-3">
            {error ?? track.error?.message}
          </p>
        )}
        <p className="text-[11px] text-gray-500 sm:col-span-3">
          Sipariş numaranız, sipariş onay sayfasında yazar (ör. SYK-261110-1234).
        </p>
      </form>

      {track.data && (
        <div className="mt-6">
          <OrderCard order={track.data} open />
        </div>
      )}
    </div>
  );
}
