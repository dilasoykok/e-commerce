'use client';

import Link from 'next/link';
import { LayoutDashboard, User } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { ACCOUNT_HREF, ORDERS_HREF } from '@/lib/navigation';

/**
 * "Hesabım" linki (eski account-link.js): giriş yapılmışsa üyenin adını
 * gösterir ve siparişlerim sayfasına gider. Admin ise yanında panel linki çıkar.
 */
export default function AccountLink({ variant }: { variant: 'topbar' | 'drawer' }) {
  const { user, isAdmin } = useUser();
  const href = user ? ORDERS_HREF : ACCOUNT_HREF;

  if (variant === 'drawer') {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={href}
          className="flex h-11 items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white"
        >
          <User className="size-4" strokeWidth={1.75} aria-hidden />
          <span>{user ? user.firstName : 'Giriş Yap / Kayıt Ol'}</span>
        </Link>
        {isAdmin && (
          <Link
            href="/admin/urunler"
            className="flex h-10 items-center justify-center gap-2 rounded border border-gray-300 text-sm font-medium"
          >
            <LayoutDashboard className="size-4" strokeWidth={1.75} aria-hidden /> Yönetim Paneli
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {isAdmin && (
        <Link href="/admin/urunler" className="ml-4 hidden items-center gap-2 hover:text-wood-400 sm:flex">
          <LayoutDashboard className="size-4" strokeWidth={1.75} aria-hidden />
          <span>Panel</span>
        </Link>
      )}
      <Link href={href} className="ml-4 flex items-center gap-2 hover:text-wood-400">
        <User className="size-4" strokeWidth={1.75} aria-hidden />
        <span>{user ? user.firstName : 'Hesabım'}</span>
      </Link>
    </>
  );
}
