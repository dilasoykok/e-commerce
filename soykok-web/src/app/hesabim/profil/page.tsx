import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import AccountNav from '@/components/account/AccountNav';
import ProfileForm from '@/components/account/ProfileForm';
import { getCurrentUser } from '@/lib/auth-server';

export const metadata: Metadata = { title: 'Profilim', robots: { index: false } };

/** Hesabım → Profilim. Giriş yapılmamışsa giriş sayfasına, dönüşte buraya gelir. */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/hesap?next=/hesabim/profil');

  return (
    <div className="container-site py-6 lg:py-10">
      <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-900">
              Ana Sayfa
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" strokeWidth={1.75} />
          </li>
          <li aria-current="page" className="font-medium text-brand-900">
            Profilim
          </li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl font-bold">Hesabım</h1>
      <AccountNav current="/hesabim/profil" />

      <div className="mt-6 max-w-2xl">
        <ProfileForm />
      </div>
    </div>
  );
}
