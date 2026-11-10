'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import AddToCartButton from '@/components/product/AddToCartButton';
import FavoriteButton from '@/components/product/FavoriteButton';
import { formatTL } from '@/lib/format';
import type { CartProduct } from '@/store/cart';

const MAX_QTY = 999;
const clamp = (n: number) => Math.min(Math.max(Math.floor(n) || 1, 1), MAX_QTY);
const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

type Props = {
  product: CartProduct & { unit: string };
  boxM2: number | null;
};

/**
 * Ürün sayfasındaki satın alma alanı: m² hesaplayıcı, miktar, sepete ekle, favori
 * (eski product-detail.js → initCalculator + initQuantity). Hesaplayıcı yalnızca
 * m² ile satılan ürünlerde görünür ve sonucu tek tıkla miktar kutusuna aktarır.
 */
export default function PurchasePanel({ product, boxM2 }: Props) {
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState('1');

  const setBoth = (n: number) => {
    const v = clamp(n);
    setQty(v);
    setDraft(String(v));
  };

  return (
    <>
      {product.unit === 'm²' && <AreaCalculator price={product.price} boxM2={boxM2} onUse={setBoth} />}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="qty" className="form-label">
            Miktar ({product.unit})
          </label>
          <div className="inline-flex h-12 items-center overflow-hidden rounded border border-gray-300 bg-white">
            <button
              type="button"
              onClick={() => setBoth(qty - 1)}
              disabled={qty <= 1}
              aria-label="Miktarı azalt"
              className="grid h-full w-11 place-items-center text-lg hover:bg-gray-100 disabled:opacity-40"
            >
              −
            </button>
            <input
              id="qty"
              type="number"
              min={1}
              max={MAX_QTY}
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => setBoth(Number(draft))}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="h-full w-16 border-x border-gray-300 text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setBoth(qty + 1)}
              aria-label="Miktarı artır"
              className="grid h-full w-11 place-items-center text-lg hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>

        <div className="min-w-48 flex-1">
          <AddToCartButton
            product={product}
            qty={qty}
            className="h-12 w-full rounded bg-brand-900 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-80"
          />
        </div>
        <FavoriteButton id={product.id} variant="large" />
      </div>
    </>
  );
}

type CalcResult =
  | { error: string }
  | { area: number; waste: number; needed: number; boxes: number | null; qty: number; total: number };

function AreaCalculator({ price, boxM2, onUse }: { price: number; boxM2: number | null; onUse: (qty: number) => void }) {
  const [result, setResult] = useState<CalcResult | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const num = (k: string) => Number(String(data.get(k) ?? '').replace(',', '.'));
    const width = num('width');
    const length = num('length');
    const waste = Number(data.get('waste'));

    if (!(width > 0) || !(length > 0)) {
      setResult({ error: 'Lütfen en ve boy ölçülerini metre cinsinden girin.' });
      return;
    }
    const area = width * length;
    const needed = area * (1 + waste / 100);
    const boxes = boxM2 ? Math.ceil(needed / boxM2) : null;
    // Sepet tam sayı miktarla çalışıyor → yukarı yuvarla
    const qty = Math.ceil(boxes && boxM2 ? boxes * boxM2 : needed);
    setResult({ area, waste, needed, boxes, qty, total: qty * price });
  };

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-labelledby="calcTitle">
      <h2 id="calcTitle" className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="size-4 text-brand-700" strokeWidth={1.75} aria-hidden /> Kaç m² gerekli? Hesaplayın
      </h2>
      <form onSubmit={onSubmit} noValidate className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="calcWidth" className="form-label">
            En (m)
          </label>
          <input id="calcWidth" name="width" inputMode="decimal" placeholder="4,5" className="form-input h-9" />
        </div>
        <div>
          <label htmlFor="calcLength" className="form-label">
            Boy (m)
          </label>
          <input id="calcLength" name="length" inputMode="decimal" placeholder="3,2" className="form-input h-9" />
        </div>
        <div>
          <label htmlFor="calcWaste" className="form-label">
            Fire payı
          </label>
          <select id="calcWaste" name="waste" defaultValue="10" className="form-input h-9">
            <option value="5">%5 (düz döşeme)</option>
            <option value="10">%10 (önerilen)</option>
            <option value="15">%15 (çapraz / balıksırtı)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="h-9 w-full rounded bg-brand-900 px-4 text-xs font-semibold text-white hover:bg-brand-700">
            Hesapla
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {result && 'error' in result && <p className="mt-4 text-xs text-sale">{result.error}</p>}
        {result && !('error' in result) && (
          <div className="mt-4 rounded border border-gray-200 bg-white p-3">
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex justify-between">
                <span>Oda alanı</span>
                <strong>{fmt(result.area)} m²</strong>
              </li>
              <li className="flex justify-between">
                <span>Fire payı (%{result.waste})</span>
                <strong>+{fmt(result.needed - result.area)} m²</strong>
              </li>
              {result.boxes !== null && boxM2 && (
                <li className="flex justify-between">
                  <span>Paket sayısı ({fmt(boxM2)} m²/paket)</span>
                  <strong>{result.boxes} paket</strong>
                </li>
              )}
              <li className="flex justify-between border-t border-gray-200 pt-1.5 text-sm text-brand-900">
                <span>Gereken miktar</span>
                <strong>{result.qty} m²</strong>
              </li>
              <li className="flex justify-between text-sm text-brand-900">
                <span>Tahmini tutar</span>
                <strong>{formatTL(result.total)}</strong>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onUse(result.qty)}
              className="mt-3 h-9 w-full rounded border border-brand-900 text-xs font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white"
            >
              Bu miktarı kullan ({result.qty} m²)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
