import Link from 'next/link';
import { Clock, Lock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getSiteNav } from '@/lib/catalog';
import { STORE, hoursSummary } from '@/lib/store-info';

const SW = 1.75;

const FOOTER_NAV = [
  {
    id: 'ftCorporate',
    title: 'Kurumsal',
    links: [
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/magazalarimiz', label: 'Mağazalarımız' },
      { href: '/urunler?indirim=1', label: 'Kampanyalar' },
      { href: '/iletisim', label: 'İletişim' },
    ],
  },
  {
    id: 'ftCategories',
    title: 'Kategoriler',
    links: [
      // Menüyle aynı veriden doldurulur (aşağıda getSiteNav)
    ],
  },
  {
    id: 'ftSupport',
    title: 'Müşteri Hizmetleri',
    links: [
      { href: '/siparislerim', label: 'Sipariş Takibi' },
      { href: '/iade-ve-degisim', label: 'İade ve Değişim' },
      { href: '/kargo-ve-teslimat', label: 'Kargo ve Teslimat' },
      { href: '/sss', label: 'Sıkça Sorulan Sorular' },
      { href: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış Sözleşmesi' },
      { href: '/kvkk-aydinlatma-metni', label: 'KVKK Aydınlatma Metni' },
    ],
  },
];

/** Footer (eski partials/footer.html). Server Component; kategori sütunu menüyle aynı veriden. */
export default async function Footer() {
  const nav = await getSiteNav();
  const categoryLinks = nav.menu.filter((c) => c.href.startsWith('/urunler')).slice(0, 7);
  const columns = FOOTER_NAV.map((g) =>
    g.id === 'ftCategories' ? { ...g, links: categoryLinks.map(({ href, label }) => ({ href, label })) } : g,
  );
  return (
    <footer className="mt-12 bg-brand-900 text-sm text-white/75">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Marka & iletişim */}
        <div>
          <Link href="/" aria-label="Soykök Ticaret Ana Sayfa">
            <Logo id="Footer" className="block h-11 w-auto text-white" />
          </Link>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed">
            Safranbolu’da yapı malzemeleri, boya, hırdavat ve tesisatta güvenilir markalar, uygun fiyatlar ve uzman destek.
          </p>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <span>
                {STORE.addressLines[0]}
                <br />
                {STORE.addressLines[1]}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <a href={STORE.phoneHref} className="hover:text-white">
                {STORE.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <a href={STORE.emailHref} className="hover:text-white">
                {STORE.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-wood-400" strokeWidth={SW} aria-hidden />
              <span>
                {hoursSummary().map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        {columns.map((group) => (
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
