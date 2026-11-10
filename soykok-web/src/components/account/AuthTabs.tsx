'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, LogIn, Package, ShieldCheck, UserPlus } from 'lucide-react';

type Tab = 'kayit' | 'giris';
const TABS: Tab[] = ['kayit', 'giris'];
const SW = 1.75;

/**
 * Kayıt Ol / Giriş Yap sekmeleri (eski auth.js → initTabs).
 * Adres #giris ise giriş sekmesiyle açılır; sekme değişince adres de güncellenir.
 */
export default function AuthTabs({ loginHref, registerHref }: { loginHref: string; registerHref: string }) {
  const [tab, setTab] = useState<Tab>('kayit');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setTab(location.hash === '#giris' ? 'giris' : 'kayit');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const select = (next: Tab, focus = false) => {
    setTab(next);
    history.replaceState(null, '', `#${next}`);
    if (focus) listRef.current?.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus();
  };

  return (
    <>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Hesap işlemleri"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          select(TABS[(TABS.indexOf(tab) + 1) % 2], true);
        }}
        className="grid grid-cols-2 rounded-md bg-gray-100 p-1 text-sm font-semibold"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-controls={`panel-${t}`}
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => select(t)}
            className="h-10 rounded text-gray-500 transition aria-selected:bg-white aria-selected:text-brand-900 aria-selected:shadow-sm"
          >
            {t === 'kayit' ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        ))}
      </div>

      {/* Kayıt */}
      <div role="tabpanel" id="panel-kayit" aria-labelledby="tab-kayit" hidden={tab !== 'kayit'} className="mt-7">
        <h1 className="text-xl font-bold">Yeni Hesap Oluştur</h1>
        <p className="mt-1 text-xs text-gray-500">Birkaç saniyede üye olun, alışverişe hemen başlayın.</p>
        <div className="mt-6 space-y-4">
          <ul className="space-y-2.5 rounded-md bg-gray-50 p-4 text-xs text-gray-600">
            <Info icon={ShieldCheck}>Kayıt formu güvenli hesap sayfamızda açılır</Info>
            <Info icon={Lock}>Şifreniz bu siteye hiçbir zaman gönderilmez</Info>
            <Info icon={Package}>Kayıttan sonra kaldığınız sayfaya dönersiniz</Info>
          </ul>
          {/* Keycloak'a tam sayfa yönlendirme: bilerek <Link> değil <a> */}
          <a
            href={registerHref}
            className="flex h-11 w-full items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <UserPlus className="size-4" strokeWidth={SW} aria-hidden /> Kayıt Ol
          </a>
          <p className="text-center text-xs text-gray-500">
            Zaten üye misiniz?{' '}
            <button type="button" onClick={() => select('giris')} className="font-semibold text-brand-900 hover:text-wood-600">
              Giriş yapın
            </button>
          </p>
        </div>
      </div>

      {/* Giriş */}
      <div role="tabpanel" id="panel-giris" aria-labelledby="tab-giris" hidden={tab !== 'giris'} className="mt-7">
        <h1 className="text-xl font-bold">Tekrar Hoş Geldiniz</h1>
        <p className="mt-1 text-xs text-gray-500">Hesabınıza giriş yaparak siparişlerinizi takip edin.</p>
        <div className="mt-6 space-y-4">
          <ul className="space-y-2.5 rounded-md bg-gray-50 p-4 text-xs text-gray-600">
            <Info icon={ShieldCheck}>Giriş güvenli hesap sayfamızda yapılır</Info>
            <Info icon={Lock}>Şifrenizi unuttuysanız aynı sayfadan yenileyebilirsiniz</Info>
          </ul>
          <a
            href={loginHref}
            className="flex h-11 w-full items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <LogIn className="size-4" strokeWidth={SW} aria-hidden /> Giriş Yap
          </a>
          <p className="text-center text-xs text-gray-500">
            Hesabınız yok mu?{' '}
            <button type="button" onClick={() => select('kayit')} className="font-semibold text-brand-900 hover:text-wood-600">
              Hemen kayıt olun
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

function Info({ icon: Icon, children }: { icon: typeof Lock; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-wood-600" strokeWidth={SW} aria-hidden /> {children}
    </li>
  );
}
