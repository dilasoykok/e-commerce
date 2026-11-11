import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, Layers, Mail, MapPin, MessageCircle, Navigation, Phone, Ruler, Store, SwatchBook, Truck } from 'lucide-react';
import StoreHours from '@/components/store/StoreHours';
import { STORE } from '@/lib/store-info';

export const metadata: Metadata = {
  title: 'Mağazamız',
  description: 'Safranbolu’daki yapı malzemeleri mağazamız: adres, çalışma saatleri ve yol tarifi.',
};

const SW = 1.75;

const SERVICES = [
  { icon: Layers, title: 'Geniş Ürün Yelpazesi', text: 'Boya, hırdavat, tesisat, inşaat malzemeleri ve yapı kimyasalları aynı mağazada.' },
  { icon: SwatchBook, title: 'Renk Kartelası', text: 'Boya renklerini kartelada yerinde görün, doğru tonu birlikte seçelim.' },
  { icon: Ruler, title: 'Malzeme Danışmanlığı', text: 'İşiniz için hangi malzemeden ne kadar gerektiğini birlikte hesaplayalım.' },
  { icon: Truck, title: 'Teslimat', text: 'Mağazadan aldığınız ürünleri adresinize kadar teslim ediyoruz.' },
];

/** Mağazamız (eski magazalarimiz.html) */
export default function StoresPage() {
  return (
    <>
      {/* Sayfa başlığı */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Image src="/images/categories/magaza.jpg" alt="" fill preload sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-950/60 to-transparent" />
        <div className="container-site relative py-12 lg:py-16">
          <nav aria-label="Sayfa yolu" className="text-xs text-white/70">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white">
                  Ana Sayfa
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5" strokeWidth={SW} />
              </li>
              <li aria-current="page" className="text-white">
                Mağazamız
              </li>
            </ol>
          </nav>
          <p className="mt-6 text-[11px] font-semibold tracking-[0.2em] text-wood-400 uppercase">Mağazamız</p>
          <h1 className="mt-2 text-3xl leading-tight font-bold sm:text-4xl">Sizi mağazamızda ağırlayalım</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            Ürünlerimizi yerinde görün, uzman ekibimizle birlikte işinize en uygun malzemeyi seçin.
          </p>
        </div>
      </section>

      {/* Mağaza + harita */}
      <section className="container-site py-10 lg:py-14" aria-labelledby="storeName">
        <div className="grid overflow-hidden rounded-lg border border-gray-200 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <article className="p-6 sm:p-8">
            <p className="flex items-center gap-1.5 text-xs font-medium text-wood-600">
              <Store className="size-4" strokeWidth={SW} aria-hidden /> Merkez Mağaza
            </p>
            <h2 id="storeName" className="mt-1 text-2xl font-bold">
              {STORE.name}
            </h2>
            <p className="text-sm text-gray-500">{STORE.city}</p>

            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                <address className="not-italic">
                  {STORE.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                <a href={STORE.phoneHref} className="font-medium hover:text-wood-600">
                  {STORE.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                <a href={STORE.emailHref} className="hover:text-wood-600">
                  {STORE.email}
                </a>
              </li>
            </ul>

            <div className="mt-7">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-brand-700" strokeWidth={SW} aria-hidden /> Çalışma Saatleri
              </h3>
              <StoreHours hours={STORE.hours} />
            </div>

            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              <a
                href={STORE.directionsHref}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Navigation className="size-4" strokeWidth={SW} aria-hidden /> Yol Tarifi Al
              </a>
              <a
                href={STORE.phoneHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded border border-gray-300 text-sm font-semibold transition hover:border-brand-900"
              >
                <Phone className="size-4" strokeWidth={SW} aria-hidden /> Hemen Ara
              </a>
              {STORE.whatsappHref && (
                <a
                  href={STORE.whatsappHref}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded border border-gray-300 text-sm font-semibold transition hover:border-green-600 hover:text-green-700 sm:col-span-2"
                >
                  <MessageCircle className="size-4" strokeWidth={SW} aria-hidden /> WhatsApp&apos;tan Yazın
                </a>
              )}
            </div>
          </article>

          <div className="relative min-h-[320px] bg-gray-100 lg:min-h-full">
            <iframe
              title="Soykök Ticaret Safranbolu mağazası harita konumu"
              src={STORE.mapEmbedSrc}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Mağaza hizmetleri */}
      <section className="bg-gray-50 py-14 lg:py-16" aria-labelledby="servicesTitle">
        <div className="container-site">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-wood-600 uppercase">Mağaza Hizmetleri</p>
            <h2 id="servicesTitle" className="mt-2 text-2xl font-bold sm:text-3xl">
              Mağazamızda sizi neler bekliyor?
            </h2>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <Icon className="size-8 text-wood-600" strokeWidth={SW} aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Online yönlendirme */}
      <section className="container-site py-14 lg:py-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-gray-200 p-8 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold">Safranbolu&apos;ya uzak mısınız?</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tüm ürünlerimizi online sipariş verebilir, Türkiye&apos;nin her yerine teslimat alabilirsiniz.
            </p>
          </div>
          <Link
            href="/urunler"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded bg-wood-500 px-6 text-sm font-semibold text-white transition hover:bg-wood-600"
          >
            Online Alışverişe Başla <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
