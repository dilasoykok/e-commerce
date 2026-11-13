'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

import { ApiError } from '@/lib/api/client';
import { useAdminBrands, useDeleteBrand, useSaveBrand, useUploadBrandLogo } from '@/hooks/useAdminBrands';
import type { AdminBrand, SaveBrandInput } from '@/lib/types';

const SW = 1.75;
const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * /admin/markalar — ana sayfadaki "Popüler Markalar" bandı ve Hakkımızda'daki markalar.
 * Logo yükle / değiştir / kaldır, marka ekle / düzenle / sil, sıra, bantta göster / gizle.
 */
export default function AdminBrands() {
  const list = useAdminBrands();
  // null: form kapalı · 'new': yeni marka · slug: o marka düzenleniyor
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const brands = list.data ?? [];
  const current = brands.find((b) => b.slug === editing);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Markalar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ana sayfadaki &quot;Popüler Markalar&quot; bandında ve Hakkımızda sayfasında görünür. Sıra küçükten büyüğe.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing('new')}
            className="flex h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-semibold text-white hover:bg-brand-700">
            <Plus className="size-4" strokeWidth={SW} aria-hidden /> Yeni marka
          </button>
        )}
      </div>

      <p className="sr-only" role="status">
        {status}
      </p>

      {editing && (
        <BrandForm
          key={editing}
          brand={current}
          nextOrder={brands.length ? Math.max(...brands.map((b) => b.sortOrder)) + 1 : 1}
          onClose={(message) => {
            setEditing(null);
            if (message) setStatus(message);
          }}
        />
      )}

      <div className="mt-5 overflow-hidden rounded-md border border-gray-200 bg-white">
        {list.isPending ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
          </div>
        ) : list.isError ? (
          <p className="p-6 text-sm text-sale">{list.error.message}</p>
        ) : brands.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">Henüz marka yok. &quot;Yeni marka&quot; ile ekleyin.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {brands.map((b) => (
              <BrandRow key={b.slug} brand={b} onEdit={() => setEditing(b.slug)} onStatus={setStatus} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Liste satırı ---------------- */

function BrandRow({ brand: b, onEdit, onStatus }: { brand: AdminBrand; onEdit: () => void; onStatus: (m: string) => void }) {
  const remove = useDeleteBrand();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
      <span className="w-8 shrink-0 text-center text-xs text-gray-500" title="Sıra">
        {b.sortOrder}
      </span>
      <LogoBox src={b.logoUrl} name={b.name} />
      <div className="min-w-32 flex-1">
        <p className="font-semibold">{b.name}</p>
        <p className="text-xs text-gray-600">
          {b.productCount} ürün ·{' '}
          {b.showInBand ? (
            <span className="inline-flex items-center gap-1 text-green-800">
              <Eye className="size-3.5" strokeWidth={SW} aria-hidden /> Bantta görünüyor
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <EyeOff className="size-3.5" strokeWidth={SW} aria-hidden /> Gizli
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded px-3 text-xs font-medium hover:bg-gray-100">
          <Pencil className="size-4" strokeWidth={SW} aria-hidden /> Düzenle<span className="sr-only">: {b.name}</span>
        </button>
        {confirming ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">{remove.isError ? remove.error.message : 'Silinsin mi? (ürünler silinmez)'}</span>
            <button type="button" disabled={remove.isPending}
              onClick={() => remove.mutate(b.slug, { onSuccess: () => onStatus(`${b.name} silindi.`) })}
              className="h-9 rounded bg-sale px-3 font-semibold text-white disabled:opacity-60">
              {remove.isPending ? 'Siliniyor…' : 'Evet, sil'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="h-9 rounded px-2 hover:bg-gray-100">
              Vazgeç
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className="flex h-9 items-center gap-1.5 rounded px-3 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-sale">
            <Trash2 className="size-4" strokeWidth={SW} aria-hidden /> Sil<span className="sr-only">: {b.name}</span>
          </button>
        )}
      </div>
    </li>
  );
}

function LogoBox({ src, name, large = false }: { src: string | null; name: string; large?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded border border-gray-200 bg-gray-50 p-2 ${large ? 'h-24 w-48' : 'h-14 w-28'}`}>
      {src ? (
        <Image src={src} alt={`${name} logosu`} width={large ? 176 : 100} height={large ? 80 : 40} unoptimized
          className={`w-auto max-w-full object-contain ${large ? 'max-h-20' : 'max-h-10'}`} />
      ) : (
        <span className="text-center text-xs font-bold text-gray-500">{name || 'Logo yok'}</span>
      )}
    </span>
  );
}

/* ---------------- Ekle / düzenle formu ---------------- */

type Errors = Partial<Record<'name' | 'logoUrl' | 'sortOrder' | 'form', string>>;

function BrandForm({ brand, nextOrder, onClose }: { brand?: AdminBrand; nextOrder: number; onClose: (message?: string) => void }) {
  const id = useId();
  const save = useSaveBrand();
  const upload = useUploadBrandLogo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(brand?.name ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logoUrl ?? null);
  const [sortOrder, setSortOrder] = useState(String(brand?.sortOrder ?? nextOrder));
  const [showInBand, setShowInBand] = useState(brand?.showInBand ?? true);
  const [errors, setErrors] = useState<Errors>({});

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, logoUrl: undefined }));
    if (!ACCEPT.split(',').includes(file.type))
      return setErrors((e) => ({ ...e, logoUrl: 'Yalnızca PNG, JPG veya WEBP yüklenebilir (arka planı şeffaf PNG önerilir).' }));
    if (file.size > MAX_MB * 1024 * 1024) return setErrors((e) => ({ ...e, logoUrl: `Dosya en fazla ${MAX_MB} MB olabilir.` }));
    try {
      const { url } = await upload.mutateAsync(file);
      setLogoUrl(url);
    } catch (err) {
      setErrors((e) => ({ ...e, logoUrl: (err as Error).message || 'Logo yüklenemedi.' }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = Number(sortOrder);
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Marka adını yazın.';
    if (!Number.isInteger(order) || order < 0) next.sortOrder = 'Sıra için 0 ya da daha büyük bir sayı yazın.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const input: SaveBrandInput = { name: name.trim(), logoUrl, sortOrder: order, showInBand };
    save.mutate(
      { slug: brand?.slug ?? null, input },
      {
        onSuccess: () => onClose(brand ? `${input.name} güncellendi.` : `${input.name} eklendi.`),
        onError: (err) => {
          if (err instanceof ApiError && Object.keys(err.fields).length)
            setErrors({ name: err.fieldError('name'), logoUrl: err.fieldError('logoUrl'), sortOrder: err.fieldError('sortOrder') });
          else setErrors({ form: err.message || 'Kaydedilemedi.' });
        },
      },
    );
  };

  const renamed = brand && name.trim() && name.trim() !== brand.name && brand.productCount > 0;

  return (
    <form onSubmit={submit} noValidate className="mt-5 rounded-md border border-gray-200 bg-white p-5" aria-labelledby={`${id}-h`}>
      <div className="flex items-center justify-between">
        <h2 id={`${id}-h`} className="text-base font-bold">
          {brand ? `${brand.name} — düzenle` : 'Yeni marka'}
        </h2>
        <button type="button" onClick={() => onClose()} className="grid size-9 place-items-center rounded hover:bg-gray-100" aria-label="Formu kapat">
          <X className="size-4" strokeWidth={SW} aria-hidden />
        </button>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[auto_1fr]">
        {/* Logo */}
        <div>
          <p className="form-label" id={`${id}-logo`}>
            Logo
          </p>
          <LogoBox src={logoUrl} name={name} large />
          <input ref={fileRef} type="file" accept={ACCEPT} hidden aria-labelledby={`${id}-logo`}
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={upload.isPending} onClick={() => fileRef.current?.click()}
              className="flex h-9 items-center gap-2 rounded border border-gray-300 px-3 text-xs font-semibold hover:border-brand-900 disabled:opacity-60">
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : logoUrl ? (
                <Upload className="size-4" strokeWidth={SW} aria-hidden />
              ) : (
                <ImagePlus className="size-4" strokeWidth={SW} aria-hidden />
              )}
              {upload.isPending ? 'Yükleniyor…' : logoUrl ? 'Logoyu değiştir' : 'Logo yükle'}
            </button>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl(null)}
                className="flex h-9 items-center gap-1.5 rounded px-3 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-sale">
                <X className="size-4" strokeWidth={SW} aria-hidden /> Logoyu kaldır
              </button>
            )}
          </div>
          <p className="mt-1.5 max-w-48 text-xs text-gray-600">PNG (şeffaf arka plan), JPG ya da WEBP, en fazla {MAX_MB} MB.</p>
          {errors.logoUrl && <p className="form-error max-w-48">{errors.logoUrl}</p>}
        </div>

        {/* Bilgiler */}
        <div className="grid content-start gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label htmlFor={`${id}-name`} className="form-label">
              Marka adı
            </label>
            <input id={`${id}-name`} className="form-input" maxLength={100} value={name} onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)} />
            {errors.name && <p className="form-error">{errors.name}</p>}
            {renamed && (
              <p className="mt-1 text-xs text-amber-800">
                Bu markanın {brand.productCount} ürünündeki marka adı da &quot;{name.trim()}&quot; olarak değişecek.
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-order`} className="form-label">
              Sıra
            </label>
            <input id={`${id}-order`} type="number" min={0} className="form-input" value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)} aria-invalid={Boolean(errors.sortOrder)} />
            {errors.sortOrder && <p className="form-error">{errors.sortOrder}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" checked={showInBand} onChange={(e) => setShowInBand(e.target.checked)} className="size-4 accent-brand-900" />
            Ana sayfadaki marka bandında ve Hakkımızda&apos;da göster
          </label>
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm text-sale">
          {errors.form}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={save.isPending || upload.isPending}
          className="flex h-10 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" onClick={() => onClose()} className="h-10 rounded border border-gray-300 px-4 text-sm font-semibold hover:bg-gray-50">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
