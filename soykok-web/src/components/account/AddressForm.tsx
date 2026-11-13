'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { ApiError } from '@/lib/api/client';
import { PROVINCES_SORTED } from '@/data/provinces';
import type { SaveAddressInput, SavedAddress } from '@/lib/types';

type Field = 'title' | 'recipientName' | 'phone' | 'city' | 'district' | 'line' | 'postalCode';
type Errors = Partial<Record<Field | 'form', string>>;

const FIELDS: Field[] = ['title', 'recipientName', 'phone', 'city', 'district', 'line', 'postalCode'];

/** "05321234567" → "0532 123 45 67" */
export const formatPhone = (p: string) => (p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7, 9)} ${p.slice(9)}` : p);

/**
 * Adres ekleme / düzenleme formu. Kaydetme işini çağıran bileşen yapar (onSubmit);
 * sunucudan dönen alan hataları bu formun altlarında gösterilir.
 */
export default function AddressForm({
  initial,
  defaultRecipient = '',
  defaultPhone = '',
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: SavedAddress;
  defaultRecipient?: string;
  defaultPhone?: string;
  busy: boolean;
  onSubmit: (input: SaveAddressInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  const id = useId();
  const [v, setV] = useState({
    title: initial?.title ?? '',
    recipientName: initial?.recipientName ?? defaultRecipient,
    phone: initial ? formatPhone(initial.phone) : defaultPhone,
    city: initial?.city ?? '',
    district: initial?.district ?? '',
    line: initial?.line ?? '',
    postalCode: initial?.postalCode ?? '',
    isDefault: initial?.isDefault ?? false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!v.title.trim()) next.title = 'Adrese kısa bir ad verin (ör. Ev, İş).';
    if (v.recipientName.trim().length < 3) next.recipientName = 'Teslim alacak kişinin adını ve soyadını yazın.';
    if (!v.phone.trim()) next.phone = 'Cep telefonunu yazın.';
    if (!v.city) next.city = 'İl seçin.';
    if (v.district.trim().length < 2) next.district = 'İlçeyi yazın.';
    if (v.line.trim().length < 10) next.line = 'Mahalle, sokak, bina ve daire numarasını yazın.';
    setErrors(next);
    if (Object.keys(next).length) return focusFirst(next);

    try {
      await onSubmit({
        title: v.title.trim(),
        recipientName: v.recipientName.trim(),
        phone: v.phone.trim(),
        city: v.city,
        district: v.district.trim(),
        line: v.line.trim(),
        postalCode: v.postalCode.trim() || null,
        isDefault: v.isDefault,
      });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        const fromServer: Errors = {};
        for (const f of [...FIELDS, 'form'] as const) fromServer[f] = err.fieldError(f);
        setErrors(fromServer);
        focusFirst(fromServer);
      } else {
        setErrors({ form: err instanceof ApiError ? err.message : 'Adres kaydedilemedi. Lütfen tekrar deneyin.' });
      }
    }
  };

  const focusFirst = (errs: Errors) => {
    const first = FIELDS.find((f) => errs[f]);
    if (first) document.getElementById(`${id}-${first}`)?.focus();
  };

  const props = (name: Field) => ({
    id: `${id}-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id}-${name}-err` : undefined,
  });
  const err = (name: Field) =>
    errors[name] && (
      <p id={`${id}-${name}-err`} className="form-error">
        {errors[name]}
      </p>
    );
  const label = (name: Field, text: string, optional = false) => (
    <label htmlFor={`${id}-${name}`} className="form-label">
      {text} {optional && <span className="font-normal text-gray-500">(isteğe bağlı)</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="checkout-card" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="text-lg font-bold">
        {initial ? 'Adresi düzenle' : 'Yeni adres'}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          {label('title', 'Adres adı')}
          <input {...props('title')} className="form-input" maxLength={30} placeholder="Ev, İş, Şantiye…"
            value={v.title} onChange={set('title')} />
          {err('title')}
        </div>
        <div>
          {label('recipientName', 'Teslim alacak kişi')}
          <input {...props('recipientName')} className="form-input" maxLength={100} autoComplete="name"
            value={v.recipientName} onChange={set('recipientName')} />
          {err('recipientName')}
        </div>
        <div>
          {label('phone', 'Cep telefonu')}
          <input {...props('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="05XX XXX XX XX"
            className="form-input" maxLength={20} value={v.phone} onChange={set('phone')} />
          {err('phone')}
        </div>
        <div>
          {label('city', 'İl')}
          <select {...props('city')} className="form-input" autoComplete="address-level1" value={v.city} onChange={set('city')}>
            <option value="">Seçiniz</option>
            {PROVINCES_SORTED.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {err('city')}
        </div>
        <div>
          {label('district', 'İlçe')}
          <input {...props('district')} className="form-input" maxLength={64} autoComplete="address-level2"
            value={v.district} onChange={set('district')} />
          {err('district')}
        </div>
        <div>
          {label('postalCode', 'Posta kodu', true)}
          <input {...props('postalCode')} className="form-input" inputMode="numeric" maxLength={5} autoComplete="postal-code"
            value={v.postalCode} onChange={set('postalCode')} />
          {err('postalCode')}
        </div>
        <div className="sm:col-span-2">
          {label('line', 'Açık adres')}
          <textarea {...props('line')} rows={3} maxLength={500} autoComplete="street-address"
            placeholder="Mahalle, cadde/sokak, bina no, daire no" className="form-input h-auto py-2.5"
            value={v.line} onChange={set('line')} />
          {err('line')}
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={v.isDefault} onChange={set('isDefault')} className="size-4 accent-brand-900" />
        Varsayılan adresim olsun
      </label>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm text-sale">
          {errors.form}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded bg-brand-900 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex h-11 items-center rounded border border-gray-300 px-5 text-sm font-semibold hover:bg-gray-50">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
