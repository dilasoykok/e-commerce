import Link from 'next/link';
import { Heart, LogOut, MapPin, Package, UserRound } from 'lucide-react';
import { logoutUrl } from '@/lib/auth';

const LINKS = [
  { href: '/siparislerim', label: 'Siparişlerim', icon: Package },
  { href: '/hesabim/profil', label: 'Profilim', icon: UserRound },
  { href: '/hesabim/adresler', label: 'Adreslerim', icon: MapPin },
  { href: '/favorilerim', label: 'Favorilerim', icon: Heart },
];

/** Üye sayfalarının üstündeki sekmeler: Siparişlerim · Profilim · Adreslerim · Favorilerim · Çıkış */
export default function AccountNav({ current }: { current: string }) {
  return (
    <nav aria-label="Hesabım" className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200 text-sm font-semibold">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === current;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 ${
              active ? 'border-brand-900 text-brand-900' : 'border-transparent text-gray-600 hover:text-brand-900'
            }`}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden /> {label}
          </Link>
        );
      })}
      {/* Keycloak oturumu da kapatılır: tam sayfa yönlendirme */}
      <a
        href={logoutUrl('/')}
        className="-mb-px ml-auto flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-gray-600 hover:text-sale"
      >
        <LogOut className="size-4" strokeWidth={1.75} aria-hidden /> Çıkış
      </a>
    </nav>
  );
}
