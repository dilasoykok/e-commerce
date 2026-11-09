'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import AccountLink from './AccountLink';
import { useUi } from '@/store/ui';
import { CATEGORY_NAV, MAIN_NAV, ORDERS_HREF } from '@/lib/navigation';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';

const SW = 1.75;

const MENU_LINKS = [MAIN_NAV[0], MAIN_NAV[1], { href: ORDERS_HREF, label: 'Sipariş Takibi' }, MAIN_NAV[2], MAIN_NAV[3]];

/**
 * Mobil menü butonu + soldan açılan çekmece (eski mobile-menu.html + menu.js → initMobileDrawer).
 * Çekmece fixed konumlu olduğu için butonla aynı bileşende durabilir.
 */
export default function MobileMenu() {
  const open = useUi((s) => s.mobileMenuOpen);
  const setOpen = useUi((s) => s.setMobileMenu);
  const close = () => setOpen(false);

  useBodyScrollLock(open);
  useEscape(open, close);

  // Masaüstüne geçilirse çekmeceyi kapat
  useEffect(() => {
    const mq = window.matchMedia('(width >= 64rem)');
    const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-md border border-gray-200 lg:hidden"
        aria-label="Menüyü aç"
        aria-expanded={open}
        aria-controls="mobileDrawer"
      >
        <Menu className="size-5" strokeWidth={SW} aria-hidden />
      </button>

      {open && <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={close} aria-hidden />}

      <aside
        id="mobileDrawer"
        aria-label="Mobil menü"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? '' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Logo id="Drawer" className="block h-9 w-auto text-brand-900" />
          <button
            type="button"
            onClick={close}
            className="grid size-9 place-items-center rounded-md hover:bg-gray-100"
            aria-label="Menüyü kapat"
          >
            <X className="size-5" strokeWidth={SW} aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto text-sm">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Kategoriler</p>

          {CATEGORY_NAV.map((c) => {
            const Icon = c.icon;
            if (!c.children?.length) {
              return (
                <Link key={c.label} href={c.href} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 font-medium">
                  <Icon className="size-5 text-brand-700" strokeWidth={SW} aria-hidden /> {c.label}
                </Link>
              );
            }
            return (
              <details key={c.label} className="group border-b border-gray-100">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                  <Icon className="size-5 text-brand-700" strokeWidth={SW} aria-hidden /> {c.label}
                  <ChevronDown className="ml-auto size-4 transition group-open:rotate-180" strokeWidth={SW} aria-hidden />
                </summary>
                <ul className="bg-gray-50 py-1 text-[13px] text-gray-600">
                  {c.children.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="block py-2 pl-12">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}

          <p className="px-4 pt-5 pb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Menü</p>
          <ul className="pb-4">
            {MENU_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="block px-4 py-2.5">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <AccountLink variant="drawer" />
        </div>
        <div className="grid grid-cols-3 border-t border-gray-200 bg-gray-50 text-center text-xs">
          <Link href="/hakkimizda" className="py-3">
            Hakkımızda
          </Link>
          <Link href="/magazalarimiz" className="border-x border-gray-200 py-3">
            Mağazalar
          </Link>
          <Link href="/iletisim" className="py-3">
            İletişim
          </Link>
        </div>
      </aside>
    </>
  );
}
