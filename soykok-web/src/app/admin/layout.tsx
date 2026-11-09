import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth-server';
import { isAdmin, loginUrl } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  robots: { index: false, follow: false },
};

/**
 * /admin altındaki tüm sayfalar: sunucuda oturum kontrolü.
 * Giriş yoksa Keycloak'a, admin değilse uyarı. (Asıl yetki kontrolünü backend
 * her istekte yine yapar; bu katman yalnızca doğru ekranı göstermek içindir.)
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl('/admin/urunler'));

  if (!isAdmin(user)) {
    return (
      <div className="container-site flex flex-col items-center py-20 text-center">
        <ShieldAlert className="size-10 text-sale" strokeWidth={1.75} aria-hidden />
        <h1 className="mt-4 text-lg font-bold">Bu sayfa için yetkiniz yok</h1>
        <p className="mt-1 text-sm text-gray-600">
          Yönetim paneline yalnızca &quot;admin&quot; rolündeki kullanıcılar girebilir. Rol, Keycloak&apos;ta (soykok
          realm&apos;i) kullanıcıya atanır.
        </p>
        <Link href="/" className="mt-6 h-10 rounded bg-brand-900 px-5 text-sm leading-10 font-semibold text-white">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return <div className="container-site py-8">{children}</div>;
}
