'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderTree, MessageSquare, Package, ReceiptText } from 'lucide-react';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';

const TABS = [
  { href: '/admin/siparisler', label: 'Siparişler', icon: ReceiptText },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: MessageSquare },
];

/** Yönetim paneli sekmeleri */
export default function AdminNav() {
  const pathname = usePathname();
  const unread = useUnreadMessageCount();
  return (
    <nav aria-label="Yönetim paneli" className="mb-6 flex gap-1 border-b border-gray-200">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold ${
              active ? 'border-brand-900 text-brand-900' : 'border-transparent text-gray-500 hover:text-brand-900'
            }`}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden /> {label}
            {href === '/admin/mesajlar' && unread > 0 && (
              <span className="rounded-full bg-sale px-1.5 text-xs leading-5 font-semibold text-white" aria-label={`${unread} okunmamış`}>
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
