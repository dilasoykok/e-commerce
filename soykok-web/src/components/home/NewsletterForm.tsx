'use client';

import { useState } from 'react';

type Status = { ok: boolean; message: string } | null;

/** E-bülten formu (eski newsletter.js) */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>(null);

  return (
    <>
      <form
        className="mt-2 flex gap-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
          const ok = email.trim() !== '' && input.checkValidity();
          setStatus(
            ok
              ? { ok, message: 'Teşekkürler! Bültenimize abone oldunuz.' }
              : { ok, message: 'Lütfen geçerli bir e-posta adresi girin.' },
          );
          if (ok) {
            // TODO: backend hazır olduğunda e-postayı burada API'ye gönder
            setEmail('');
          }
        }}
      >
        <label htmlFor="newsletterEmail" className="sr-only">
          E-posta adresi
        </label>
        <input
          id="newsletterEmail"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="E-posta adresinizi girin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status ? !status.ok : undefined}
          className="h-9 min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 text-xs placeholder:text-gray-400 focus:border-brand-700 focus:outline-none aria-[invalid=true]:border-sale"
        />
        <button
          type="submit"
          className="h-9 shrink-0 rounded bg-brand-900 px-4 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          Abone Ol
        </button>
      </form>
      <p aria-live="polite" className={`mt-1.5 text-[11px] ${status?.ok ? 'text-green-700' : 'text-sale'}`}>
        {status?.message}
      </p>
    </>
  );
}
