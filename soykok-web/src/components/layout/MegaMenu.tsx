'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { CATEGORY_NAV } from '@/lib/navigation';

const SW = 1.75;

/**
 * "Tüm Kategoriler" + mega menü (eski menu.js → initMegaMenu).
 * Ana sayfada sabit açık durur (eski megaPinned="data-pinned"); diğer
 * sayfalarda butonla açılır, dışarı tıklayınca veya Esc ile kapanır.
 * Alt paneller eskisi gibi yalnızca CSS (hover / focus-within) ile açılır.
 */
export default function MegaMenu() {
  const pinned = usePathname() === '/';
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = pinned || open;

  useEffect(() => {
    if (pinned || !open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned, open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => !pinned && setOpen((v) => !v)}
        className="flex h-full w-[218px] items-center gap-3 rounded-t-md bg-brand-900 px-4 text-sm font-semibold text-white"
        aria-expanded={visible}
        aria-controls="megaMenu"
      >
        <Menu className="size-5" strokeWidth={SW} aria-hidden />
        <span>Tüm Kategoriler</span>
        <ChevronDown className="ml-auto size-4" strokeWidth={SW} aria-hidden />
      </button>

      <div
        id="megaMenu"
        hidden={!visible}
        className="absolute top-full left-0 w-[218px] rounded-b-md bg-white shadow-xl ring-1 ring-black/5"
      >
        <ul className="py-1.5 text-[13px] text-brand-800">
          {CATEGORY_NAV.map((c) => {
            const Icon = c.icon;
            const hasPanel = Boolean(c.children?.length);
            return (
              <li key={c.label} className={hasPanel ? 'group/cat' : undefined}>
                <Link
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-1.5 hover:bg-gray-50 group-hover/cat:bg-gray-100"
                >
                  <Icon className="size-5 text-brand-700" strokeWidth={SW} aria-hidden />
                  <span>{c.label}</span>
                  <ChevronRight className="ml-auto size-4" strokeWidth={SW} aria-hidden />
                </Link>

                {hasPanel && (
                  <div className="absolute top-0 left-full hidden min-h-full w-[172px] rounded-r-md border-l border-gray-100 bg-white px-3 py-3 shadow-xl group-focus-within/cat:block group-hover/cat:block">
                    <Link
                      href={c.href}
                      className="mb-2 flex items-center border-b border-gray-100 pb-2 text-xs font-semibold hover:text-wood-600"
                    >
                      {c.panelTitle ?? c.label}
                      {c.brands && <ChevronRight className="ml-auto size-3.5" strokeWidth={SW} aria-hidden />}
                    </Link>
                    <SubList links={c.children!} withChevron={Boolean(c.brands)} />

                    {c.brands && (
                      <>
                        <p className="mt-4 mb-2 border-b border-gray-100 pb-2 text-xs font-semibold">Markalar</p>
                        <SubList links={c.brands} withChevron />
                        <Link href="/#markalar" className="block py-1.5 text-xs text-gray-600 hover:text-wood-600">
                          Diğer Markalar
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SubList({ links, withChevron }: { links: { href: string; label: string }[]; withChevron?: boolean }) {
  return (
    <ul className="space-y-0.5 text-xs text-gray-600">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={`${withChevron ? 'flex items-center' : 'block'} py-1.5 hover:text-wood-600`}>
            {l.label}
            {withChevron && <ChevronRight className="ml-auto size-3.5" strokeWidth={SW} aria-hidden />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
