'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderTree, MessageSquare, Package, ReceiptText, Star } from 'lucide-react';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';
import { usePendingReviewCount } from '@/hooks/useReviews';

const TABS = [
  { href: '/admin/siparisler', label: 'Siparişler', icon: ReceiptText },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { href: '/admin/yorumlar', label: 'Yorumlar', icon: Star },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: MessageSquare },
];

/** Yönetim paneli sekmeleri */
export default function AdminNav() {
  const pathname = usePathname();
  const unread = useUnreadMessageCount();
  const pending = usePendingReviewCount();
  const badge: Record<string, { n: number; label: string }> = {
    '/admin/mesajlar': { n: unread, label: 'okunmamış' },
    '/admin/yorumlar': { n: pending, label: 'onay bekliyor' },
  };
  return (
    <nav aria-label="Yönetim paneli" className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold ${
              active ? 'border-brand-900 text-brand-900' : 'border-transparent text-gray-500 hover:text-brand-900'
            }`}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden /> {label}
            {badge[href]?.n ? (
              <span className="rounded-full bg-sale px-1.5 text-xs leading-5 font-semibold text-white" aria-label={`${badge[href].n} ${badge[href].label}`}>
                {badge[href].n}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
