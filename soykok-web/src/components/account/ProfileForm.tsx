'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { ApiError } from '@/lib/api/client';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

type Errors = Partial<Record<'firstName' | 'lastName' | 'phone' | 'form', string>>;

/** "05321234567" → "0532 123 45 67" (yalnızca gösterim) */
const formatPhone = (p: string | null) =>
  p && p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7, 9)} ${p.slice(9)}` : (p ?? '');

/**
 * Profil formu: ad, soyad, cep telefonu, kampanya izni.
 * E-posta ve şifre giriş sisteminde (Keycloak) tutulur, burada yalnızca gösterilir.
 */
export default function ProfileForm() {
  const id = useId();
  const profile = useProfile();
  const save = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  // Profil gelince form doldurulur
  useEffect(() => {
    if (!profile.data) return;
    setFirstName(profile.data.firstName);
    setLastName(profile.data.lastName);
    setPhone(formatPhone(profile.data.phone));
    setMarketing(profile.data.marketingConsent);
  }, [profile.data]);

  if (profile.isPending)
    return (
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Bilgileriniz yükleniyor…
      </p>
    );
  if (profile.isError)
    return (
      <p role="alert" className="rounded border border-sale/30 bg-red-50 px-4 py-3 text-sm text-sale">
        Bilgileriniz şu an yüklenemedi. Sayfayı yenileyip tekrar deneyin.
      </p>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    // Tarayıcıda hızlı kontrol (asıl kontrol sunucuda)
    const next: Errors = {};
    if (firstName.trim().length < 2) next.firstName = 'Adınızı yazın.';
    if (lastName.trim().length < 2) next.lastName = 'Soyadınızı yazın.';
    setErrors(next);
    if (Object.keys(next).length) return;

    save.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null, marketingConsent: marketing },
      {
        onSuccess: (p) => {
          setPhone(formatPhone(p.phone));
          setSaved(true);
        },
        onError: (err) => {
          if (err instanceof ApiError && Object.keys(err.fields).length)
            setErrors({ firstName: err.fieldError('firstName'), lastName: err.fieldError('lastName'), phone: err.fieldError('phone') });
          else setErrors({ form: 'Bilgileriniz kaydedilemedi. Lütfen tekrar deneyin.' });
        },
      },
    );
  };

  const field = (name: keyof Errors) => ({
    id: `${id}-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id}-${name}-err` : undefined,
  });
  const error = (name: keyof Errors) =>
    errors[name] && (
      <p id={`${id}-${name}-err`} className="form-error">
        {errors[name]}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="checkout-card">
      <h2 className="text-lg font-bold">Kişisel bilgiler</h2>
      <p className="mt-1 text-sm text-gray-600">Bu bilgiler sipariş verirken formu otomatik doldurmak için kullanılır.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-firstName`} className="form-label">
            Ad
          </label>
          <input {...field('firstName')} className="form-input" autoComplete="given-name" maxLength={50}
            value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          {error('firstName')}
        </div>
        <div>
          <label htmlFor={`${id}-lastName`} className="form-label">
            Soyad
          </label>
          <input {...field('lastName')} className="form-input" autoComplete="family-name" maxLength={50}
            value={lastName} onChange={(e) => setLastName(e.target.value)} />
          {error('lastName')}
        </div>

        <div>
          <label htmlFor={`${id}-email`} className="form-label">
            E-posta
          </label>
          <input id={`${id}-email`} className="form-input bg-gray-50 text-gray-600" value={profile.data.email} readOnly
            aria-describedby={`${id}-email-help`} />
          <p id={`${id}-email-help`} className="mt-1 text-xs text-gray-600">
            Giriş yaptığınız adres; buradan değiştirilemez.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="form-label">
            Cep telefonu <span className="font-normal text-gray-500">(isteğe bağlı)</span>
          </label>
          <input {...field('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="05XX XXX XX XX"
            className="form-input" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error('phone')}
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-brand-900" />
        <span>Kampanya ve indirimlerden e-posta ile haberdar olmak istiyorum.</span>
      </label>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm text-sale">
          {errors.form}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={save.isPending}
          className="inline-flex h-11 items-center gap-2 rounded bg-brand-900 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-green-800">
          {saved && (
            <>
              <Check className="size-4" aria-hidden /> Bilgileriniz kaydedildi.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
