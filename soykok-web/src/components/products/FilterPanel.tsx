'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useListNavigation } from './ListNavigation';

type Option = { value: string; label: string; count: number };

type Props = {
  categories: Option[];
  brands: Option[];
  /** Onay kutularında işaretli görünecek alt kategoriler ("parke" → laminat, masif, ...) */
  checkedCategories: string[];
};

/**
 * Sol filtre paneli (eski urunler.html → data-filters). Her değişiklik
 * adres çubuğuna yazılır, liste sunucuda yeniden çizilir.
 * Mobilde "Filtrele" butonuyla açılan bir çekmece olur.
 */
export default function FilterPanel({ categories, brands, checkedCategories }: Props) {
  const { state, navigate } = useListNavigation();
  const [open, setOpen] = useState(false);

  // Fiyat alanları yazarken değil, kutudan çıkınca / Enter'da uygulanır
  const [min, setMin] = useState(state.min);
  const [max, setMax] = useState(state.max);
  const [syncedFrom, setSyncedFrom] = useState(`${state.min}|${state.max}`);
  if (syncedFrom !== `${state.min}|${state.max}`) {
    // Etiketten "fiyat" kaldırılırsa kutuları da boşalt
    setSyncedFrom(`${state.min}|${state.max}`);
    setMin(state.min);
    setMax(state.max);
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const applyPrice = () => {
    const clean = (s: string) => (/^\d+$/.test(s.trim()) ? s.trim() : '');
    if (clean(min) !== state.min || clean(max) !== state.max) navigate({ min: clean(min), max: clean(max) });
  };

  const panel = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyPrice();
      }}
      className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white"
      aria-label="Ürün filtreleri"
    >
      <fieldset className="p-4">
        <legend className="mb-2 text-sm font-semibold">Kategori</legend>
        <CheckboxList
          options={categories}
          checked={checkedCategories}
          onToggle={(v) => navigate({ categories: toggle(checkedCategories, v) })}
        />
      </fieldset>

      <fieldset className="p-4">
        <legend className="mb-2 text-sm font-semibold">Marka</legend>
        <CheckboxList options={brands} checked={state.brands} onToggle={(v) => navigate({ brands: toggle(state.brands, v) })} />
      </fieldset>

      <fieldset className="p-4">
        <legend className="mb-3 text-sm font-semibold">Fiyat (TL)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor="minPrice" className="sr-only">
            En düşük fiyat
          </label>
          <input
            id="minPrice"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="En az"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={applyPrice}
            className="form-input h-9"
          />
          <span className="text-gray-400" aria-hidden>
            –
          </span>
          <label htmlFor="maxPrice" className="sr-only">
            En yüksek fiyat
          </label>
          <input
            id="maxPrice"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="En çok"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={applyPrice}
            className="form-input h-9"
          />
        </div>
      </fieldset>

      <div className="p-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={state.discounted}
            onChange={(e) => navigate({ discounted: e.target.checked })}
            className="size-4 accent-brand-900"
          />
          Sadece indirimli ürünler
        </label>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobil: filtre aç */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="filterDrawer"
        className="flex h-10 w-full items-center justify-center gap-2 rounded border border-gray-300 px-4 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden /> Filtrele
      </button>

      {/* Masaüstü: solda sabit (mobil çekmece açıkken aynı alanlar iki kez olmasın) */}
      {!open && <div className="hidden lg:block">{panel}</div>}

      {/* Mobil çekmece */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div
            id="filterDrawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filtreler"
            className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-gray-50 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <p className="font-semibold">Filtreler</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-md hover:bg-gray-100"
                aria-label="Filtreleri kapat"
              >
                <X className="size-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{panel}</div>
            <div className="border-t border-gray-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 w-full rounded bg-brand-900 text-sm font-semibold text-white"
              >
                Sonuçları Göster
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CheckboxList({ options, checked, onToggle }: { options: Option[]; checked: string[]; onToggle: (value: string) => void }) {
  return (
    <ul>
      {options.map((o) => (
        <li key={o.value}>
          <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm hover:text-wood-600">
            <input
              type="checkbox"
              checked={checked.includes(o.value)}
              onChange={() => onToggle(o.value)}
              className="size-4 accent-brand-900"
            />
            <span className="flex-1">{o.label}</span>
            <span className="text-[11px] text-gray-400">{o.count}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
