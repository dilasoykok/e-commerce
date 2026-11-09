import Link from 'next/link';
import { Clock, Lock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const SW = 1.75;

const FOOTER_NAV = [
  {
    id: 'ftCorporate',
    title: 'Kurumsal',
    links: [
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/magazalarimiz', label: 'Mağazalarımız' },
      { href: '#', label: 'Projeler' },
      { href: '#', label: 'Blog' },
      { href: '/iletisim', label: 'İletişim' },
    ],
  },
  {
    id: 'ftCategories',
    title: 'Kategoriler',
    links: [
      { href: '/urunler?kategori=parke', label: 'Parke' },
      { href: '/urunler?kategori=aksesuar', label: 'Aksesuarlar' },
      { href: '/urunler?kategori=kimyasal', label: 'Yapı Kimyasalları' },
      { href: '/urunler?kategori=zemin', label: 'Zemin Kaplama' },
      { href: '/urunler?kategori=duvar', label: 'Duvar Kaplama' },
      { href: '/urunler?kategori=deck', label: 'Deck (Dış Mekan)' },
    ],
  },
  {
    id: 'ftSupport',
    title: 'Müşteri Hizmetleri',
    links: [
      { href: '/siparislerim', label: 'Sipariş Takibi' },
      { href: '#', label: 'İade ve Değişim' },
      { href: '#', label: 'Kargo ve Teslimat' },
      { href: '#', label: 'Sıkça Sorulan Sorular' },
      { href: '#', label: 'Mesafeli Satış Sözleşmesi' },
      { href: '#', label: 'KVKK Aydınlatma Metni' },
    ],
  },
];

/** Footer (eski partials/footer.html). Tamamen statik, Server Component. */
export default function Footer() {
  return (
    <footer className="mt-12 bg-brand-900 text-sm text-white/75">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Marka & iletişim */}
        <div>
          <Link href="/" aria-label="Soykök Ticaret Ana Sayfa">
            <Logo id="Footer" className="block h-11 w-auto text-white" />
          </Link>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed">
            Parke ve yapı malzemelerinde güvenilir markalar, uygun fiyatlar ve uzman destek.
          </p>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <span>[Mağaza adresi]</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <a href="tel:+900000000000" className="hover:text-white">
                [Telefon]
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <a href="mailto:info@ornek.com" className="hover:text-white">
                [E-posta]
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <span>Hafta içi 09:00 – 18:00</span>
            </li>
          </ul>
        </div>

        {FOOTER_NAV.map((group) => (
          <nav key={group.id} aria-labelledby={group.id}>
            <h2 id={group.id} className="mb-4 font-semibold text-white">
              {group.title}
            </h2>
            <ul className="space-y-2.5 text-[13px]">
              {group.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Alt bar */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-5 text-xs sm:flex-row">
          {/* Yıl sunucuda hesaplanır; eskiden data-year ile JS dolduruyordu */}
          <p>© {new Date().getFullYear()} Soykök Ticaret. Tüm hakları saklıdır.</p>
          <ul className="flex flex-wrap items-center gap-2" aria-label="Ödeme ve güvenlik">
            <li className="flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1">
              <Lock className="size-3.5" strokeWidth={SW} aria-hidden />
              256 Bit SSL
            </li>
            <li className="rounded border border-white/15 px-2.5 py-1">Visa</li>
            <li className="rounded border border-white/15 px-2.5 py-1">Mastercard</li>
            <li className="rounded border border-white/15 px-2.5 py-1">Troy</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
