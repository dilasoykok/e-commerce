import Link from 'next/link';
import { Truck, ShieldCheck, Headset, Search, ChevronDown } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import AccountLink from './AccountLink';
import { CartButton, FavoritesButton } from './HeaderButtons';
import { MAIN_NAV, SEARCH_CATEGORIES, TOPBAR_NAV } from '@/lib/navigation';

/**
 * Header (eski partials/header.html). Server Component: etkileşimli parçalar
 * (mega menü, mobil menü, sepet/favori rozetleri, hesap linki) ayrı client bileşenleri.
 */
export default function Header() {
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
              <span>7/24 Destek</span>
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
          <MobileMenu />

          {/* Logo */}
          <Link href="/" className="shrink-0" aria-label="Soykök Ticaret Ana Sayfa">
            <Logo id="Header" className="block h-10 w-auto text-brand-900 lg:h-[52px]" />
          </Link>

          {/* Arama: düz GET formu, JavaScript gerektirmez */}
          <form
            action="/urunler"
            method="get"
            role="search"
            className="order-last flex h-11 w-full overflow-hidden rounded-md border border-gray-300 focus-within:border-brand-700 lg:order-none lg:mx-auto lg:h-[38px] lg:max-w-[625px] lg:flex-1"
          >
            <label htmlFor="q" className="sr-only">
              Ürün ara
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Ürün, kategori veya marka arayın..."
              className="min-w-0 flex-1 px-4 text-sm placeholder:text-gray-400 focus:outline-none"
            />

            <div className="relative hidden border-l border-gray-200 sm:block">
              <label htmlFor="cat" className="sr-only">
                Kategori
              </label>
              <select
                id="cat"
                name="kategori"
                className="h-full w-40 cursor-pointer appearance-none bg-transparent pr-8 pl-4 text-xs text-gray-600 focus:outline-none"
              >
                {SEARCH_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-gray-500"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            <button
              type="submit"
              className="grid w-12 place-items-center bg-brand-900 text-white transition hover:bg-brand-700"
              aria-label="Ara"
            >
              <Search className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </form>

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
          <MegaMenu />

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
