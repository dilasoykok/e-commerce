'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart, type CartItem } from '@/store/cart';

/**
 * Miktar seçici (eski cart-ui.js → qtyStepper). Mini sepette ve sepet
 * sayfasında ortak kullanılır.
 */
export default function QtyStepper({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const increment = useCart((s) => s.increment);

  // Kullanıcı yazarken kutuyu serbest bırak; değer kutudan çıkınca (change) uygulanır
  const [draft, setDraft] = useState(String(item.qty));
  useEffect(() => setDraft(String(item.qty)), [item.qty]);

  const commit = () => {
    setQty(item.id, draft);
    setDraft(String(item.qty)); // geçersiz değer girildiyse eski değere dön
  };

  return (
    <div className="inline-flex items-center">
      <div className="inline-flex h-8 items-center overflow-hidden rounded border border-gray-300 bg-white">
        <button
          type="button"
          onClick={() => increment(item.id, -1)}
          disabled={item.qty <= 1}
          aria-label={`${item.name} miktarını azalt`}
          className="grid h-full w-8 place-items-center transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
        <input
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`${item.name} miktarı (${item.unit})`}
          className="h-full w-11 border-x border-gray-300 text-center text-xs font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => increment(item.id, 1)}
          aria-label={`${item.name} miktarını artır`}
          className="grid h-full w-8 place-items-center transition hover:bg-gray-100"
        >
          <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <span className="ml-1.5 text-xs text-gray-500">{item.unit}</span>
    </div>
  );
}
