import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessagesSquare, ShieldCheck, Truck } from 'lucide-react';
import HeroSlider from './HeroSlider';

const SW = 1.75;

const SLIDES = [
  {
    image: 'hero-1.jpg',
    eyebrow: 'Doğal Güzellik, Sağlam Zeminler',
    title: ['Hayalinizdeki', 'Zemin, Doğru Adreste'],
    text: 'Parke ve yapı malzemelerinde geniş ürün yelpazesi, uygun fiyatlar ve güvenli alışveriş.',
    cta: 'Alışverişe Başla',
    href: '/urunler',
  },
  {
    image: 'hero-2.jpg',
    eyebrow: 'Sezon Kampanyası',
    title: ['Laminat Parkelerde', "%20'ye Varan İndirim"],
    text: "Krono Original, Classen ve Egger'in seçili ürünlerinde stoklarla sınırlı fırsatlar.",
    cta: 'Kampanyaları Gör',
    href: '/#kampanyalar',
  },
  {
    image: 'hero-3.jpg',
    eyebrow: 'Dış Mekan Çözümleri',
    title: ['Bahçeniz İçin', 'Dayanıklı Deck Ürünleri'],
    text: 'Kompozit ve ahşap deck seçenekleriyle her mevsime uygun yaşam alanları.',
    cta: 'Deck Ürünlerini İncele',
    href: '/urunler?kategori=deck',
  },
  {
    image: 'hero-4.jpg',
    eyebrow: 'Profesyonellere Özel',
    title: ['Projeleriniz İçin', 'Toplu Alım Avantajı'],
    text: 'Ticari ve konut projelerinize özel fiyatlandırma için hemen teklif alın.',
    cta: 'Teklif Al',
    href: '/iletisim',
  },
];

const PERKS = [
  { icon: ShieldCheck, title: 'Kaliteli Ürün', text: 'Güvenilir Marka' },
  { icon: MessagesSquare, title: 'Profesyonel Destek', text: 'Uzman Ekibimizle Yanınızdayız' },
  { icon: Truck, title: 'Hızlı Teslimat', text: "Tüm Türkiye'ye" },
];

/**
 * Hero (eski partials/home/hero.html). Slaytların içeriği sunucuda çizilir;
 * geçiş, noktalar ve kaydırma HeroSlider (client) içinde.
 */
export default function Hero() {
  const slides = SLIDES.map((s, i) => {
    const Heading = i === 0 ? 'h1' : 'h2';
    return (
      <Fragment key={s.image}>
        <Image
          src={`/images/hero/${s.image}`}
          alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-brand-950/70 via-brand-950/45 to-transparent lg:from-brand-950/30 lg:via-brand-950/55" />
        <div className="container-site relative flex h-full items-center">
          <div className="hero-copy max-w-xl text-white lg:ml-[400px]">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase">{s.eyebrow}</p>
            <Heading className="text-3xl leading-tight font-bold sm:text-4xl lg:text-[40px]">
              {s.title[0]}
              <br />
              {s.title[1]}
            </Heading>
            <p className="mt-4 max-w-md text-sm text-white/90 sm:text-base">{s.text}</p>
            <Link
              href={s.href}
              className="mt-7 inline-flex h-11 items-center gap-3 rounded-md bg-brand-900 px-5 text-sm font-semibold transition hover:bg-brand-700"
            >
              {s.cta} <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
            </Link>
          </div>
        </div>
      </Fragment>
    );
  });

  return (
    <HeroSlider
      slides={slides}
      aside={
        /* Sağdaki özellik kartı (xl ve üstü) */
        <div className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
          <div className="container-site flex h-full items-end justify-end pb-4">
            <ul className="pointer-events-auto w-[220px] space-y-5 rounded-md bg-white/85 p-5 text-brand-900 shadow-lg backdrop-blur">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-4">
                  <Icon className="size-7 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                  <div>
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="text-[11px] text-gray-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
    />
  );
}
