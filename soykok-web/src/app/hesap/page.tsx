import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Heart, Package, Star } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import AuthTabs from '@/components/account/AuthTabs';
import { getCurrentUser } from '@/lib/auth-server';
import { loginUrl, registerUrl } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Hesabım',
  description: "Soykök Ticaret'e üye olun veya hesabınıza giriş yapın.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

/** Girişten sonra gidilecek sayfa: ?next=/odeme gibi (yalnızca site içi) */
const safeNext = (next?: string) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/siparislerim');

/**
 * Giriş / kayıt sayfası (eski hesap.html + auth.js). Formlar Keycloak'ın güvenli
 * sayfasındadır; buradaki butonlar oraya yönlendirir, şifre bu siteye hiç gelmez.
 * Zaten giriş yapılmışsa doğrudan hedef sayfaya gider.
 */
export default async function AccountPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="bg-gray-50">
      <div className="container-site py-8 lg:py-12">
        <div className="mx-auto grid max-w-5xl items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white lg:grid-cols-[1fr_1.1fr]">
          {/* Sol: tanıtım paneli (masaüstü) */}
          <aside className="relative hidden overflow-hidden bg-brand-900 p-10 text-white lg:flex lg:flex-col">
            <Image src="/images/hero/yapi-1.jpg" alt="" fill sizes="40vw" className="object-cover opacity-25" />
            <div className="relative flex flex-1 flex-col">
              <Logo id="Auth" className="block h-11 w-auto text-white" />
              <h2 className="mt-auto text-2xl leading-snug font-bold">
                Yapınız için gereken her şey
                <br />
                bir tık uzağınızda.
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-white/85">
                <li className="flex items-center gap-3">
                  <Package className="size-5 text-wood-400" strokeWidth={1.75} aria-hidden /> Siparişlerinizi kolayca takip edin
                </li>
                <li className="flex items-center gap-3">
                  <Heart className="size-5 text-wood-400" strokeWidth={1.75} aria-hidden /> Favori ürünlerinizi kaydedin
                </li>
                <li className="flex items-center gap-3">
                  <Star className="size-5 text-wood-400" strokeWidth={1.75} aria-hidden /> Üyelere özel kampanyalardan yararlanın
                </li>
              </ul>
            </div>
          </aside>

          <section className="p-6 sm:p-10">
            <AuthTabs loginHref={loginUrl(next)} registerHref={registerUrl(next)} />
          </section>
        </div>
      </div>
    </div>
  );
}
