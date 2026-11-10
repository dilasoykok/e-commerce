'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Info, Landmark, Loader2, Lock, Package, ShieldCheck, Store, Truck } from 'lucide-react';

import { useCart, useCartSummary } from '@/store/cart';
import { useCartSync } from '@/hooks/useCartSync';
import { usePlaceOrder } from '@/hooks/useOrders';
import { useUser } from '@/hooks/useUser';
import { ApiError } from '@/lib/api/client';
import { formatTL } from '@/lib/format';
import { saveLastOrder } from '@/lib/last-order';
import { PROVINCES_SORTED } from '@/data/provinces';
import type { DeliveryMethod, PaymentMethod, PlaceOrderInput } from '@/lib/types';

const SW = 1.75;
type Errors = Record<string, string>;

/** Alanların ekrandaki sırası (ilk hatalı alana odaklanmak için) */
const FIELD_ORDER = [
  'firstName', 'lastName', 'email', 'phone', 'city', 'district', 'address', 'postalCode',
  'companyName', 'taxOffice', 'taxNumber', 'terms',
];

/**
 * Teslimat ve ödeme (eski odeme.html + checkout.js).
 * Sipariş POST /api/orders ile verilir; fiyat ve kargo sunucuda hesaplanır, ekrandaki
 * tutarlar yalnızca bilgi içindir. Sunucunun alan hataları ilgili kutunun altında gösterilir.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const summary = useCartSummary();
  const clearCart = useCart((s) => s.clear);
  const { hydrated, notice } = useCartSync();
  const { user, isLoggedIn } = useUser();
  const placeOrder = usePlaceOrder();

  const formRef = useRef<HTMLFormElement>(null);
  const placed = useRef(false); // sipariş verildi: boşalan sepet yüzünden /sepet'e dönme
  const [delivery, setDelivery] = useState<DeliveryMethod>('cargo');
  const [invoiceType, setInvoiceType] = useState<'individual' | 'corporate'>('individual');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string | null>(null);

  const shipping = delivery === 'store' ? 0 : summary.shipping;
  const total = summary.subtotal + shipping;

  // Sepet boşsa ödeme sayfasının anlamı yok
  useEffect(() => {
    if (hydrated && summary.items.length === 0 && !placed.current) router.replace('/sepet');
  }, [hydrated, summary.items.length, router]);

  // Üyenin adı ve e-postası boş alanlara yazılır
  useEffect(() => {
    const form = formRef.current;
    if (!form || !user) return;
    const fill = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (el && !el.value && value) el.value = value;
    };
    fill('firstName', user.firstName);
    fill('lastName', user.lastName);
    fill('email', user.email);
  }, [user]);

  const focusFirstError = (errs: Errors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    const data = new FormData(e.currentTarget);
    const str = (k: string) => String(data.get(k) ?? '').trim();

    const input: PlaceOrderInput = {
      firstName: str('firstName'),
      lastName: str('lastName'),
      email: str('email'),
      phone: str('phone'),
      delivery,
      ...(delivery === 'cargo'
        ? { city: str('city'), district: str('district'), address: str('address'), postalCode: str('postalCode') || undefined }
        : {}),
      note: str('note') || undefined,
      invoiceType,
      ...(invoiceType === 'corporate'
        ? { companyName: str('companyName'), taxOffice: str('taxOffice'), taxNumber: str('taxNumber') }
        : {}),
      payment,
      marketing: data.get('marketing') === 'on',
      terms: data.get('terms') === 'on',
      items: summary.items.map((i) => ({ productId: i.id, quantity: i.qty })),
    };

    // Hızlı ön kontrol (asıl doğrulama sunucuda)
    const errs: Errors = {};
    const required: [keyof PlaceOrderInput, string][] = [
      ['firstName', 'Adınızı girin.'],
      ['lastName', 'Soyadınızı girin.'],
      ['email', 'E-posta adresinizi girin.'],
      ['phone', 'Cep telefonunuzu girin.'],
    ];
    if (delivery === 'cargo')
      required.push(['city', 'İl seçin.'], ['district', 'İlçe girin.'], ['address', 'Açık adresinizi girin.']);
    if (invoiceType === 'corporate')
      required.push(['companyName', 'Firma adını girin.'], ['taxOffice', 'Vergi dairesini girin.'], ['taxNumber', 'Vergi numarasını girin.']);
    for (const [k, msg] of required) if (!input[k]) errs[k] = msg;
    if (!input.terms) errs.terms = 'Devam etmek için sözleşmeleri onaylayın.';

    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }

    placeOrder.mutate(input, {
      onSuccess: (order) => {
        placed.current = true;
        saveLastOrder(order);
        clearCart();
        router.replace('/siparis-tamamlandi');
      },
      onError: (err) => {
        if (err instanceof ApiError && Object.keys(err.fields).length) {
          const fieldErrors = Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]]));
          setErrors(fieldErrors);
          focusFirstError(fieldErrors);
          // "items" gibi formda kutusu olmayan hatalar üstte
          const other = Object.entries(fieldErrors).filter(([k]) => !FIELD_ORDER.includes(k));
          setAlert(other.length ? other.map(([, v]) => v).join(' ') : 'Lütfen işaretli alanları kontrol edin.');
        } else {
          setAlert(err.message);
        }
      },
    });
  };

  if (!hydrated || summary.items.length === 0) {
    return (
      <div className="grid h-60 place-items-center">
        <Loader2 className="size-6 animate-spin text-gray-400" aria-label="Yükleniyor" />
      </div>
    );
  }

  const err = (name: string) => errors[name];
  const invalid = (name: string) => (errors[name] ? true : undefined);

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <form id="checkoutForm" ref={formRef} noValidate onSubmit={onSubmit} className="space-y-5">
        {/* 1. İletişim ve adres */}
        <section className="checkout-card" aria-labelledby="secAddress">
          <SectionTitle id="secAddress" n={1}>
            İletişim{delivery === 'cargo' && ' ve Teslimat Adresi'}
          </SectionTitle>

          {!isLoggedIn && (
            <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Üye misiniz?{' '}
              <Link href="/hesap?next=/odeme#giris" className="font-semibold text-brand-900 underline hover:text-wood-600">
                Giriş yapın
              </Link>
              , siparişiniz hesabınızda görünsün. Üye olmadan da devam edebilir, siparişinizi sipariş numarasıyla takip
              edebilirsiniz.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field name="firstName" label="Ad" required error={err('firstName')}>
              <input id="firstName" name="firstName" autoComplete="given-name" className="form-input" aria-invalid={invalid('firstName')} />
            </Field>
            <Field name="lastName" label="Soyad" required error={err('lastName')}>
              <input id="lastName" name="lastName" autoComplete="family-name" className="form-input" aria-invalid={invalid('lastName')} />
            </Field>
            <Field name="email" label="E-posta" required error={err('email')}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@mail.com"
                className="form-input"
                aria-invalid={invalid('email')}
              />
            </Field>
            <Field name="phone" label="Cep Telefonu" required error={err('phone')}>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder="05XX XXX XX XX"
                maxLength={17}
                className="form-input"
                aria-invalid={invalid('phone')}
              />
            </Field>

            {/* Mağazadan teslimde gizlenir ama silinmez: geri dönülünce yazılanlar kaybolmaz */}
            <div className="contents" hidden={delivery !== 'cargo'}>
              <>
                <Field name="city" label="İl" required error={err('city')}>
                  <select id="city" name="city" autoComplete="address-level1" defaultValue="" className="form-input" aria-invalid={invalid('city')}>
                    <option value="">Seçiniz</option>
                    {PROVINCES_SORTED.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field name="district" label="İlçe" required error={err('district')}>
                  <input id="district" name="district" autoComplete="address-level2" className="form-input" aria-invalid={invalid('district')} />
                </Field>
                <div className="sm:col-span-2">
                  <Field name="address" label="Açık Adres" required error={err('address')}>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Mahalle, cadde/sokak, bina no, daire no"
                      className="form-input h-auto py-2.5"
                      aria-invalid={invalid('address')}
                    />
                  </Field>
                </div>
                <Field name="postalCode" label="Posta Kodu" optional error={err('postalCode')}>
                  <input
                    id="postalCode"
                    name="postalCode"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    className="form-input"
                    aria-invalid={invalid('postalCode')}
                  />
                </Field>
              </>
            </div>
          </div>
        </section>

        {/* 2. Fatura */}
        <section className="checkout-card" aria-labelledby="secInvoice">
          <SectionTitle id="secInvoice" n={2}>
            Fatura Bilgileri
          </SectionTitle>
          <fieldset className="mt-5">
            <legend className="sr-only">Fatura türü</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['individual', 'corporate'] as const).map((t) => (
                <label key={t} className="option-card items-center">
                  <input
                    type="radio"
                    name="invoiceType"
                    value={t}
                    checked={invoiceType === t}
                    onChange={() => setInvoiceType(t)}
                    className="size-4 accent-brand-900"
                  />
                  <span className="text-sm font-medium">{t === 'individual' ? 'Bireysel' : 'Kurumsal'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2" hidden={invoiceType !== 'corporate'}>
              <div className="sm:col-span-2">
                <Field name="companyName" label="Firma Unvanı" required error={err('companyName')}>
                  <input id="companyName" name="companyName" autoComplete="organization" className="form-input" aria-invalid={invalid('companyName')} />
                </Field>
              </div>
              <Field name="taxOffice" label="Vergi Dairesi" required error={err('taxOffice')}>
                <input id="taxOffice" name="taxOffice" className="form-input" aria-invalid={invalid('taxOffice')} />
              </Field>
              <Field name="taxNumber" label="Vergi / T.C. Kimlik No" required error={err('taxNumber')}>
                <input id="taxNumber" name="taxNumber" inputMode="numeric" maxLength={11} className="form-input" aria-invalid={invalid('taxNumber')} />
              </Field>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] text-gray-500">
            <Info className="mt-px size-3.5 shrink-0" strokeWidth={SW} aria-hidden />
            Faturanız e-posta adresinize gönderilir.
          </p>
        </section>

        {/* 3. Teslimat */}
        <section className="checkout-card" aria-labelledby="secDelivery">
          <SectionTitle id="secDelivery" n={3}>
            Teslimat Yöntemi
          </SectionTitle>
          <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Teslimat yöntemi</legend>
            <OptionCard
              name="delivery"
              checked={delivery === 'cargo'}
              onChange={() => setDelivery('cargo')}
              icon={<Truck className="size-4" strokeWidth={SW} aria-hidden />}
              title="Adrese Teslim"
              aside={
                <span className={`text-xs font-semibold ${summary.shipping === 0 ? 'text-green-700' : ''}`}>
                  {summary.shipping === 0 ? 'Ücretsiz' : formatTL(summary.shipping)}
                </span>
              }
              text="Kargo ile 3–7 iş günü içinde teslim."
            />
            <OptionCard
              name="delivery"
              checked={delivery === 'store'}
              onChange={() => setDelivery('store')}
              icon={<Store className="size-4" strokeWidth={SW} aria-hidden />}
              title="Mağazadan Teslim Al"
              aside={<span className="text-xs font-semibold text-green-700">Ücretsiz</span>}
              text="Safranbolu mağazamızdan; hazır olduğunda SMS ile bilgilendirilirsiniz."
            />
          </fieldset>
        </section>

        {/* 4. Ödeme */}
        <section className="checkout-card" aria-labelledby="secPayment">
          <SectionTitle id="secPayment" n={4}>
            Ödeme Yöntemi
          </SectionTitle>
          <fieldset className="mt-5 space-y-3">
            <legend className="sr-only">Ödeme yöntemi</legend>
            <OptionCard
              name="payment"
              checked={payment === 'card'}
              onChange={() => setPayment('card')}
              icon={<CreditCard className="size-4" strokeWidth={SW} aria-hidden />}
              title="Kredi / Banka Kartı"
              text="Siparişi onayladıktan sonra ödeme kuruluşunun 3D Secure güvenli ödeme ekranına yönlendirilirsiniz. Kart bilgileriniz sitemizde işlenmez ve saklanmaz."
            />
            <OptionCard
              name="payment"
              checked={payment === 'transfer'}
              onChange={() => setPayment('transfer')}
              icon={<Landmark className="size-4" strokeWidth={SW} aria-hidden />}
              title="Havale / EFT"
              text="IBAN bilgileri sipariş onayından sonra gösterilir. Ödemenin 24 saat içinde yapılması gerekir."
            />
          </fieldset>

          <div className="mt-5">
            <Field name="note" label="Sipariş Notu" optional error={err('note')}>
              <textarea
                id="note"
                name="note"
                rows={2}
                maxLength={500}
                placeholder="Teslimatla ilgili eklemek istedikleriniz"
                className="form-input h-auto py-2.5"
              />
            </Field>
          </div>
        </section>

        {/* Sözleşmeler */}
        <section className="checkout-card space-y-3 text-xs" aria-label="Sözleşmeler">
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" id="terms" name="terms" className="mt-0.5 size-4 shrink-0 accent-brand-900" aria-invalid={invalid('terms')} />
              <span>
                <a href="#" className="font-semibold underline hover:text-wood-600">
                  Ön Bilgilendirme Formu
                </a>
                &apos;nu ve{' '}
                <a href="#" className="font-semibold underline hover:text-wood-600">
                  Mesafeli Satış Sözleşmesi
                </a>
                &apos;ni okudum, onaylıyorum. <span className="text-sale">*</span>
              </span>
            </label>
            {err('terms') && <p className="form-error pl-7">{err('terms')}</p>}
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-gray-600">
            <input type="checkbox" name="marketing" className="mt-0.5 size-4 shrink-0 accent-brand-900" />
            <span>Kampanya ve fırsatlardan e-posta ve SMS ile haberdar olmak istiyorum.</span>
          </label>
          <p className="text-[11px] text-gray-500">
            Kişisel verileriniz{' '}
            <a href="#" className="underline hover:text-brand-900">
              KVKK Aydınlatma Metni
            </a>{' '}
            kapsamında, siparişinizin yerine getirilmesi amacıyla işlenir.
          </p>
        </section>
      </form>

      {/* Sipariş özeti */}
      <aside aria-labelledby="summaryTitle" className="checkout-card lg:sticky lg:top-4">
        <div className="flex items-center justify-between">
          <h2 id="summaryTitle" className="text-base font-bold">
            Sipariş Özeti
          </h2>
          <Link href="/sepet" className="text-xs font-medium text-gray-500 hover:text-brand-900">
            Düzenle
          </Link>
        </div>

        {notice && <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-[11px] text-amber-900">{notice}</p>}

        <ul className="mt-4 max-h-72 divide-y divide-gray-100 overflow-y-auto">
          {summary.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                {item.image && <Image src={`/images/products/${item.image}`} alt="" fill sizes="64px" className="object-cover" />}
                <span className="absolute -top-0 -right-0 grid min-w-5 place-items-center rounded-bl bg-brand-900 px-1 text-[10px] font-semibold text-white">
                  {item.qty}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug font-semibold">{item.name}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {item.qty} {item.unit} × {formatTL(item.price)}
                </p>
              </div>
              <p className="text-xs font-bold">{formatTL(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Ara Toplam</dt>
            <dd className="font-semibold">{formatTL(summary.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Kargo</dt>
            <dd className={`font-semibold ${shipping === 0 ? 'text-green-700' : ''}`}>{shipping === 0 ? 'Ücretsiz' : formatTL(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
            <dt className="font-bold">Toplam</dt>
            <dd className="font-bold">{formatTL(total)}</dd>
          </div>
        </dl>
        <p className="mt-1 text-right text-[11px] text-gray-500">KDV dahil</p>

        {alert && (
          <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-xs text-sale">
            {alert}
          </p>
        )}

        <button
          type="submit"
          form="checkoutForm"
          disabled={placeOrder.isPending}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
        >
          {placeOrder.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Sipariş oluşturuluyor…
            </>
          ) : (
            <>
              <Lock className="size-4" strokeWidth={SW} aria-hidden /> Siparişi Onayla
            </>
          )}
        </button>

        <ul className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-[11px] text-gray-600">
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> 3D Secure ile güvenli ödeme
          </li>
          <li className="flex items-center gap-2">
            <Package className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> 14 gün içinde kolay iade
          </li>
        </ul>
      </aside>
    </div>
  );
}

function SectionTitle({ id, n, children }: { id: string; n: number; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-base font-bold">
      <span className="grid size-7 place-items-center rounded-full bg-brand-900 text-xs text-white">{n}</span>
      {children}
    </h2>
  );
}

function Field({
  name,
  label,
  required,
  optional,
  error,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-sale">*</span>}
        {optional && <span className="font-normal text-gray-400">(isteğe bağlı)</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function OptionCard({
  name,
  checked,
  onChange,
  icon,
  title,
  aside,
  text,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  title: string;
  aside?: React.ReactNode;
  text: string;
}) {
  return (
    <label className="option-card">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 size-4 accent-brand-900" />
      <span className="flex-1">
        <span className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span className="flex items-center gap-2">
            {icon} {title}
          </span>
          {aside}
        </span>
        <span className="mt-1 block text-[11px] text-gray-500">{text}</span>
      </span>
    </label>
  );
}
