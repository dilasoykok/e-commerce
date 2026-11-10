'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { STORE } from '@/lib/store-info';

export const SUBJECTS = [
  { value: 'urun', label: 'Ürün bilgisi' },
  { value: 'siparis', label: 'Sipariş' },
  { value: 'iade', label: 'İade ve değişim' },
  { value: 'numune', label: 'Numune talebi' },
  { value: 'proje', label: 'Proje / toplu alım teklifi' },
  { value: 'diger', label: 'Diğer' },
];
const ORDER_SUBJECTS = ['siparis', 'iade'];
const MAX = 1000;

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'subject' | 'orderNumber' | 'message' | 'kvkk', string>>;

const normalizePhone = (v: string) => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('90')) d = d.slice(2);
  if (d && !d.startsWith('0')) d = '0' + d;
  return d;
};

/**
 * İletişim formu (eski contact.js). Doğrulama, konuya göre sipariş no alanı, karakter sayacı.
 *
 * Backend'de henüz iletişim uç noktası yok: form doğrulandıktan sonra mesaj,
 * ziyaretçinin e-posta uygulamasında hazır bir e-posta olarak açılır (mesaj kaybolmaz).
 * TODO: POST /api/contact eklenince burada api çağrısına geçilecek.
 */
export default function ContactForm({ initialSubject = '' }: { initialSubject?: string }) {
  const [subject, setSubject] = useState(SUBJECTS.some((s) => s.value === initialSubject) ? initialSubject : '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const needsOrder = ORDER_SUBJECTS.includes(subject);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const str = (k: string) => String(data.get(k) ?? '').trim();
    if (str('website')) return; // honeypot: bot

    const errs: Errors = {};
    if (str('name').length < 3) errs.name = 'Adınızı ve soyadınızı girin.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str('email'))) errs.email = 'Geçerli bir e-posta adresi girin.';
    if (str('phone') && !/^05\d{9}$/.test(normalizePhone(str('phone')))) errs.phone = 'Geçerli bir cep telefonu girin (05XX XXX XX XX).';
    if (!subject) errs.subject = 'Lütfen bir konu seçin.';
    if (needsOrder && !/^SYK-\d{6}-\d{4,6}$/i.test(str('orderNumber')))
      errs.orderNumber = 'Sipariş numarası SYK-000000-0000 biçiminde olmalıdır.';
    if (message.trim().length < 10) errs.message = 'Lütfen biraz daha ayrıntı yazın.';
    if (data.get('kvkk') !== 'on') errs.kvkk = 'Devam etmek için onay vermeniz gerekir.';

    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label ?? subject;
    const header = [
      `Ad Soyad: ${str('name')}`,
      `E-posta: ${str('email')}`,
      str('phone') ? `Telefon: ${str('phone')}` : null,
      needsOrder ? `Sipariş No: ${str('orderNumber').toUpperCase()}` : null,
    ].filter(Boolean);
    const body = `${header.join('\n')}\n\n${message.trim()}`;
    const to = STORE.emailHref.replace(/^mailto:/, '');
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`[Web] ${subjectLabel}`)}&body=${encodeURIComponent(body)}`;
    setDone(true);
  };

  const err = (k: keyof Errors) => errors[k];

  return (
    <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cName" label="Ad Soyad" required error={err('name')}>
          <input id="cName" name="name" autoComplete="name" className="form-input" aria-invalid={err('name') ? true : undefined} />
        </Field>
        <Field id="cEmail" label="E-posta" required error={err('email')}>
          <input
            id="cEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@mail.com"
            className="form-input"
            aria-invalid={err('email') ? true : undefined}
          />
        </Field>
        <Field id="cPhone" label="Telefon" optional error={err('phone')}>
          <input
            id="cPhone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="05XX XXX XX XX"
            maxLength={17}
            className="form-input"
            aria-invalid={err('phone') ? true : undefined}
          />
        </Field>
        <Field id="cSubject" label="Konu" required error={err('subject')}>
          <select
            id="cSubject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input"
            aria-invalid={err('subject') ? true : undefined}
          >
            <option value="">Seçiniz</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {needsOrder && (
        <Field id="cOrder" label="Sipariş Numarası" required error={err('orderNumber')}>
          <input
            id="cOrder"
            name="orderNumber"
            placeholder="SYK-000000-0000"
            className="form-input uppercase placeholder:normal-case"
            aria-invalid={err('orderNumber') ? true : undefined}
          />
          <p className="mt-1 text-[11px] text-gray-500">Sipariş onay sayfasında ve Siparişlerim&apos;de yazar.</p>
        </Field>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="cMessage" className="form-label mb-0">
            Mesajınız <span className="text-sale">*</span>
          </label>
          <span className="text-[11px] text-gray-400" aria-live="polite">
            {message.length} / {MAX}
          </span>
        </div>
        <textarea
          id="cMessage"
          name="message"
          rows={6}
          maxLength={MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Size nasıl yardımcı olabiliriz?"
          className="form-input h-auto py-2.5"
          aria-invalid={err('message') ? true : undefined}
        />
        {err('message') && <p className="form-error">{err('message')}</p>}
      </div>

      {/* Spam koruması (honeypot): insanlar görmez, botlar doldurur */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="cWebsite">Web siteniz</label>
        <input id="cWebsite" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-xs">
          <input type="checkbox" name="kvkk" className="mt-0.5 size-4 shrink-0 accent-brand-900" aria-invalid={err('kvkk') ? true : undefined} />
          <span>
            <a href="#" className="font-semibold underline hover:text-wood-600">
              KVKK Aydınlatma Metni
            </a>
            &apos;ni okudum; bana dönüş yapılabilmesi için bilgilerimin işlenmesini kabul ediyorum. <span className="text-sale">*</span>
          </span>
        </label>
        {err('kvkk') && <p className="form-error pl-7">{err('kvkk')}</p>}
      </div>

      {done && (
        <p role="status" className="rounded bg-green-50 px-3 py-2.5 text-xs text-green-800">
          Mesajınız e-posta uygulamanızda hazırlandı; göndermek için oradan &quot;Gönder&quot;e basın. E-posta uygulamanız açılmadıysa
          bize {STORE.phone} numarasından ya da WhatsApp&apos;tan ulaşabilirsiniz.
        </p>
      )}

      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-brand-900 px-8 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
      >
        <Send className="size-4" strokeWidth={1.75} aria-hidden /> Mesajı Gönder
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-sale">*</span>}
        {optional && <span className="font-normal text-gray-400">(isteğe bağlı)</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
