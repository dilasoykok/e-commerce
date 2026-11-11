import { Suspense } from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Headset } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import AccountLink from './AccountLink';
import HeaderSearch, { SearchForm } from './HeaderSearch';
import { CartButton, FavoritesButton } from './HeaderButtons';
import { MAIN_NAV, TOPBAR_NAV } from '@/lib/navigation';
import { getSiteNav } from '@/lib/catalog';

/**
 * Header (eski partials/header.html). Server Component: etkileşimli parçalar
 * (mega menü, mobil menü, sepet/favori rozetleri, hesap linki) ayrı client bileşenleri.
 */
export default async function Header() {
  const nav = await getSiteNav();
  return (
    <header className="relative z-40">
      {/* Üst bar */}
      <div className="bg-brand-900 text-white">
        <div className="container-site flex h-10 items-center justify-between text-xs">
          <ul className="flex items-center gap-6">
            <li className="flex items-center gap-2">
              <Truck className="size-4" strokeWidth={1.75} aria-hidden />
              <span>Türkiye&apos;nin Her Yerine Hızlı Teslimat</span>
            </li>
            <li className="hidden items-center gap-2 md:flex">
              <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
              <span>%100 Güvenli Alışveriş</span>
            </li>
            <li className="hidden items-center gap-2 md:flex">
              <Headset className="size-4" strokeWidth={1.75} aria-hidden />
              <span>Uzman Destek</span>
            </li>
          </ul>

          <div className="flex items-center">
            <nav className="hidden items-center divide-x divide-white/30 lg:flex">
              {TOPBAR_NAV.map((l) => (
                <Link key={l.href} href={l.href} className="px-4 hover:text-wood-400">
                  {l.label}
                </Link>
              ))}
            </nav>
            <AccountLink variant="topbar" />
          </div>
        </div>
      </div>

      {/* Ana header */}
      <div className="bg-white">
        <div className="container-site flex flex-wrap items-center gap-x-6 gap-y-3 py-3 lg:h-[74px] lg:flex-nowrap lg:py-0">
          {/* Mobil menü butonu + çekmece */}
          <MobileMenu items={nav.menu} />

          {/* Logo */}
          <Link href="/" className="shrink-0" aria-label="Soykök Ticaret Ana Sayfa">
            <Logo id="Header" className="block h-10 w-auto text-brand-900 lg:h-[52px]" />
          </Link>

          {/* Arama (ürünler sayfasında mevcut aramayla dolu gelir) */}
          <Suspense fallback={<SearchForm options={nav.searchOptions} suggestions={nav.suggestions} />}>
            <HeaderSearch options={nav.searchOptions} suggestions={nav.suggestions} />
          </Suspense>

          {/* Favoriler & Sepet */}
          <div className="ml-auto flex items-center gap-6 lg:ml-0">
            <FavoritesButton />
            <CartButton />
          </div>
        </div>
      </div>

      {/* Kategori + navigasyon bar */}
      <div className="hidden border-y border-gray-200 bg-gray-50 lg:block">
        <div className="container-site flex h-[44px] items-stretch">
          <MegaMenu items={nav.menu} />

          <nav className="ml-8 flex items-center gap-10 text-sm font-medium">
            {MAIN_NAV.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-wood-600">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
