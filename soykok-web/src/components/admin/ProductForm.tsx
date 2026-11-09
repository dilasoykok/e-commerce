'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useCategories, useCreateProduct, useProduct, useUpdateProduct } from '@/hooks/useCatalog';
import type { BadgeType, ProductDetail, ProductInput } from '@/lib/types';

/* ---------- Form durumu (inputlar hep metin tutar, gönderirken çevrilir) ---------- */

type FormState = {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  image: string;
  price: string;
  oldPrice: string;
  badge: string;
  badgeType: '' | BadgeType;
  boxM2: string;
  images: string;
  description: string;
  features: string;
  specs: string;
};

const EMPTY: FormState = {
  id: '',
  name: '',
  brand: '',
  category: '',
  unit: 'm²',
  image: '',
  price: '',
  oldPrice: '',
  badge: '',
  badgeType: '',
  boxM2: '',
  images: '',
  description: '',
  features: '',
  specs: '',
};

const toText = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));

function fromProduct(p: ProductDetail): FormState {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    unit: p.unit ?? '',
    image: p.image,
    price: toText(p.price),
    oldPrice: toText(p.oldPrice),
    badge: p.badge ?? '',
    badgeType: (['sale', 'new', 'info'].includes(p.badgeType ?? '') ? p.badgeType : '') as FormState['badgeType'],
    boxM2: toText(p.boxM2),
    images: p.images.join('\n'),
    description: p.description ?? '',
    features: p.features.join('\n'),
    specs: Object.entries(p.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n'),
  };
}

/** "1.062,50" / "1062.5" / "1062" → 1062.5 ; boş → null */
function parseNumber(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  if (!t) return null;
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

const lines = (s: string) =>
  s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);

function toInput(f: FormState): ProductInput {
  return {
    name: f.name.trim(),
    brand: f.brand.trim(),
    category: f.category,
    unit: f.unit.trim() || null,
    image: f.image.trim(),
    price: parseNumber(f.price) ?? 0,
    oldPrice: parseNumber(f.oldPrice),
    badge: f.badge.trim() || null,
    badgeType: f.badgeType || null,
    boxM2: parseNumber(f.boxM2),
    images: lines(f.images),
    description: f.description.trim() || null,
    features: f.features
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
    specs: Object.fromEntries(
      f.specs
        .split('\n')
        .map((row) => row.split(':'))
        .filter(([k, ...v]) => k.trim() && v.join(':').trim())
        .map(([k, ...v]) => [k.trim(), v.join(':').trim()]),
    ),
  };
}

/* ---------- Bileşen ---------- */

type Props = {
  /** null → yeni ürün */
  productId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

/**
 * Ürün ekleme / düzenleme formu (sağdan açılan panel).
 * Düzenlemede ürünün tüm bilgileri GET /api/products/{id} ile yüklenir.
 */
export default function ProductForm({ productId, onClose, onSaved }: Props) {
  const isEdit = productId !== null;
  const detail = useProduct(productId);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="productFormTitle"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="productFormTitle" className="text-base font-bold">
            {isEdit ? `Ürünü Düzenle — ${productId}` : 'Yeni Ürün'}
          </h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-gray-100" aria-label="Kapat">
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {isEdit && detail.isPending ? (
          <div className="grid flex-1 place-items-center text-sm text-gray-500">
            <Loader2 className="size-6 animate-spin" aria-label="Yükleniyor" />
          </div>
        ) : isEdit && detail.isError ? (
          <p className="p-5 text-sm text-sale">{detail.error.message}</p>
        ) : (
          <FormBody
            key={productId ?? 'new'}
            initial={detail.data ? fromProduct(detail.data) : EMPTY}
            productId={productId}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </aside>
    </>
  );
}

function FormBody({ initial, productId, onClose, onSaved }: Props & { initial: FormState }) {
  const [f, setF] = useState<FormState>(initial);
  const [clientError, setClientError] = useState<string | null>(null);
  const categories = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const mutation = productId ? update : create;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  const set = <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [key]: e.target.value }));

  const err = (field: string) => apiError?.fieldError(field);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    const input = toInput(f);
    if ([input.price, input.oldPrice, input.boxM2].some((n) => Number.isNaN(n))) {
      setClientError('Fiyat ve m² alanlarına yalnızca sayı girin (ör. 1062 veya 1062,50).');
      return;
    }
    if (productId) {
      update.mutate({ id: productId, input }, { onSuccess: (p) => onSaved(`"${p.name}" güncellendi.`) });
    } else {
      create.mutate({ ...input, id: f.id.trim() || null }, { onSuccess: (p) => onSaved(`"${p.name}" eklendi (${p.id}).`) });
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {(clientError || (apiError && !Object.keys(apiError.fields).length)) && (
          <p role="alert" className="rounded border border-sale/30 bg-red-50 px-3 py-2 text-xs text-sale">
            {clientError ?? apiError?.message}
          </p>
        )}

        {!productId && (
          <Field label="Ürün kodu" hint="Boş bırakılırsa otomatik üretilir (p-xxxxxxxx).">
            <input className="form-input" value={f.id} onChange={set('id')} placeholder="ör. p34" />
          </Field>
        )}

        <Field label="Ürün adı *" error={err('name')}>
          <input className="form-input" value={f.name} onChange={set('name')} aria-invalid={Boolean(err('name'))} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marka *" error={err('brand')}>
            <input className="form-input" value={f.brand} onChange={set('brand')} aria-invalid={Boolean(err('brand'))} />
          </Field>
          <Field label="Kategori *" error={err('category')}>
            <select className="form-input" value={f.category} onChange={set('category')} aria-invalid={Boolean(err('category'))}>
              <option value="">{categories.isPending ? 'Yükleniyor…' : 'Seçin'}</option>
              {categories.data?.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Fiyat (TL) *" error={err('price')}>
            <input className="form-input" inputMode="decimal" value={f.price} onChange={set('price')} aria-invalid={Boolean(err('price'))} />
          </Field>
          <Field label="Eski fiyat (TL)" error={err('oldPrice')}>
            <input className="form-input" inputMode="decimal" value={f.oldPrice} onChange={set('oldPrice')} aria-invalid={Boolean(err('oldPrice'))} />
          </Field>
          <Field label="Birim">
            <input className="form-input" value={f.unit} onChange={set('unit')} placeholder="m², mt, adet" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Ana görsel *" hint="public/images/products altındaki dosya adı" error={err('image')}>
            <input className="form-input" value={f.image} onChange={set('image')} placeholder="laminat-oak-naturel.jpg" aria-invalid={Boolean(err('image'))} />
          </Field>
          {f.image.trim() && (
            // Admin dosya adını yazarken önizleme; next/image var olmayan dosyada hata verdiği için düz <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/images/products/${f.image.trim()}`} alt="" className="mt-5 h-16 w-24 rounded border border-gray-200 object-cover" />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Etiket">
            <input className="form-input" value={f.badge} onChange={set('badge')} placeholder="ör. %10 İndirim" />
          </Field>
          <Field label="Etiket rengi" error={err('badgeType')}>
            <select className="form-input" value={f.badgeType} onChange={set('badgeType')}>
              <option value="">—</option>
              <option value="sale">Kırmızı (indirim)</option>
              <option value="new">Yeşil (yeni)</option>
              <option value="info">Lacivert (bilgi)</option>
            </select>
          </Field>
          <Field label="Paket (m²)" error={err('boxM2')}>
            <input className="form-input" inputMode="decimal" value={f.boxM2} onChange={set('boxM2')} />
          </Field>
        </div>

        <Field label="Açıklama">
          <textarea className="form-input h-24 py-2" value={f.description} onChange={set('description')} />
        </Field>

        <Field label="Öne çıkan özellikler" hint="Her satıra bir özellik">
          <textarea className="form-input h-20 py-2" value={f.features} onChange={set('features')} />
        </Field>

        <Field label="Teknik özellikler" hint='Her satıra "Etiket: Değer" (ör. Kalınlık: 8 mm)'>
          <textarea className="form-input h-24 py-2" value={f.specs} onChange={set('specs')} />
        </Field>

        <Field label="Galeri görselleri" hint="Dosya adları, her satıra bir tane">
          <textarea className="form-input h-16 py-2" value={f.images} onChange={set('images')} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
        <button type="button" onClick={onClose} className="h-10 rounded px-4 text-sm font-medium text-gray-600 hover:bg-gray-100">
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex h-10 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {productId ? 'Kaydet' : 'Ürünü Ekle'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {children}
      {error ? <span className="form-error block">{error}</span> : hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}
