import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, ChevronRight, CircleCheck, Eye, Handshake, Leaf, MapPin, Target, Users } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import { BRANDS } from '@/lib/brands';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'Parke, zemin kaplama ve yapı malzemelerinde doğru ürünü, doğru fiyatla ve uzman desteğiyle sunuyoruz.',
};

const SW = 1.75;

// TODO: [köşeli parantezli] alanları ve sayıları gerçek bilgilerle güncelleyin
const STATS = [
  { to: 20, suffix: '+', label: 'Yıllık tecrübe' },
  { to: 12450, suffix: '+', label: 'Mutlu müşteri' },
  { to: 1500, suffix: '+', label: 'Ürün çeşidi' },
  { to: 81, suffix: '', label: 'İle teslimat' },
];

const VALUES = [
  { icon: Award, title: 'Kalite', text: 'Yalnızca güvendiğimiz, belgeli ve garantili ürünleri satışa sunarız.' },
  { icon: Handshake, title: 'Güven', text: 'Şeffaf fiyat, açık iletişim ve verdiğimiz sözün arkasında durmak.' },
  { icon: Users, title: 'Uzmanlık', text: 'Ürün seçiminden uygulamaya kadar her adımda deneyimli ekibimizle yanınızdayız.' },
  { icon: Leaf, title: 'Sorumluluk', text: 'Çevreye duyarlı üretim yapan markaları ve sürdürülebilir ürünleri önceliklendiririz.' },
];

const TIMELINE = [
  { year: '[Yıl]', title: 'İlk mağazamız açıldı', text: '[Kısa açıklama]' },
  { year: '[Yıl]', title: 'Ürün yelpazemizi genişlettik', text: '[Kısa açıklama]' },
  { year: '[Yıl]', title: 'Proje ve toplu satış birimi kuruldu', text: '[Kısa açıklama]' },
  { year: '[Yıl]', title: 'Online mağazamız yayında', text: "Artık Türkiye'nin her yerinden sipariş verebilirsiniz." },
];

/** Hakkımızda (eski hakkimizda.html) */
export default function AboutPage() {
  return (
    <>
      {/* Sayfa başlığı */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Image src="/images/hero/hero-1.jpg" alt="" fill preload sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-950/60 to-transparent" />
        <div className="container-site relative py-14 lg:py-20">
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
                Hakkımızda
              </li>
            </ol>
          </nav>
          <p className="mt-6 text-[11px] font-semibold tracking-[0.2em] text-wood-400 uppercase">Hakkımızda</p>
          <h1 className="mt-2 max-w-2xl text-3xl leading-tight font-bold sm:text-4xl lg:text-[44px]">
            Sağlam zeminler,
            <br />
            güvenilir bir adres.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">
            [Kuruluş yılı]&apos;den bu yana parke, zemin kaplama ve yapı malzemelerinde doğru ürünü, doğru fiyatla ve uzman
            desteğiyle sunuyoruz.
          </p>
        </div>
      </section>

      {/* Hikâyemiz */}
      <section className="container-site py-14 lg:py-20" aria-labelledby="storyTitle">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src="/images/categories/parke.jpg" alt="Mağazamızdaki parke örnekleri" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -right-2 -bottom-6 hidden aspect-[4/3] w-2/5 overflow-hidden rounded-lg border-4 border-white shadow-xl sm:block lg:-right-6">
              <Image src="/images/categories/deck.jpg" alt="Dış mekan deck uygulaması" fill sizes="20vw" className="object-cover" />
            </div>
            <div className="absolute -top-4 -left-2 rounded-lg bg-wood-500 px-5 py-4 text-white shadow-lg lg:-left-6">
              <p className="text-3xl leading-none font-bold">[XX]+</p>
              <p className="mt-1 text-[11px] font-medium">yıllık tecrübe</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-wood-600 uppercase">Hikâyemiz</p>
            <h2 id="storyTitle" className="mt-2 text-2xl font-bold sm:text-3xl">
              Küçük bir mağazadan Türkiye&apos;nin her yerine
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-600">
              <p>
                [Şirketin nasıl kurulduğunu anlatan 2–3 cümle. Örneğin: kurucunun kim olduğu, ilk mağazanın nerede açıldığı ve
                hangi ihtiyaçtan doğduğu.]
              </p>
              <p>
                [Bugün gelinen noktayı anlatan 2–3 cümle. Örneğin: kaç şehirde hizmet verildiği, hangi ürün gruplarına
                genişlendiği, online satışa ne zaman başlandığı.]
              </p>
              <p>
                Amacımız değişmedi: her müşterimize, evine ya da projesine en uygun zemini seçerken güvenle danışabileceği bir
                adres olmak.
              </p>
            </div>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {['Orijinal ve garantili ürünler', 'Ücretsiz numune hizmeti', 'Uzman ekipten keşif ve danışmanlık', 'Türkiye geneline hızlı teslimat'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CircleCheck className="size-5 shrink-0 text-wood-600" strokeWidth={SW} aria-hidden /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Sayılarla Soykök */}
      <section className="bg-gray-50 py-12 lg:py-16" aria-label="Sayılarla Soykök">
        <div className="container-site">
          <ul className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4 lg:divide-x lg:divide-gray-200">
            {STATS.map((s) => (
              <li key={s.label}>
                <p className="text-3xl font-bold text-brand-900 sm:text-4xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-gray-500">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Misyon & vizyon */}
      <section className="container-site py-14 lg:py-20" aria-label="Misyon ve vizyon">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-lg border border-gray-200 p-7">
            <span className="grid size-12 place-items-center rounded-lg bg-wood-500/10 text-wood-600">
              <Target className="size-6" strokeWidth={SW} aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-bold">Misyonumuz</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Parke ve yapı malzemelerinde kaliteli ürünleri adil fiyatlarla sunmak; satış öncesinde ve sonrasında
              müşterilerimizin yanında olarak her projeyi sorunsuz tamamlamalarına yardımcı olmak.
            </p>
          </article>
          <article className="rounded-lg bg-brand-900 p-7 text-white">
            <span className="grid size-12 place-items-center rounded-lg bg-white/10 text-wood-400">
              <Eye className="size-6" strokeWidth={SW} aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-bold">Vizyonumuz</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Zemin ve yapı malzemeleri denince akla ilk gelen, güvenilirliği ve uzmanlığıyla Türkiye&apos;nin her yerinden
              ulaşılabilen bir marka olmak.
            </p>
          </article>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="bg-gray-50 py-14 lg:py-20" aria-labelledby="valuesTitle">
        <div className="container-site">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-wood-600 uppercase">Değerlerimiz</p>
            <h2 id="valuesTitle" className="mt-2 text-2xl font-bold sm:text-3xl">
              Bizi biz yapan ilkeler
            </h2>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
              >
                <Icon className="size-8 text-wood-600" strokeWidth={SW} aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Yolculuğumuz */}
      <section className="container-site py-14 lg:py-20" aria-labelledby="timelineTitle">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-wood-600 uppercase">Yolculuğumuz</p>
          <h2 id="timelineTitle" className="mt-2 text-2xl font-bold sm:text-3xl">
            Yıllar içinde Soykök
          </h2>
        </div>
        <ol className="relative mx-auto mt-10 max-w-3xl border-l-2 border-gray-200 pl-8 md:border-l-0 md:pl-0">
          <span className="absolute inset-y-0 left-1/2 hidden w-0.5 -translate-x-1/2 bg-gray-200 md:block" aria-hidden />
          {TIMELINE.map((t, i) => {
            const last = i === TIMELINE.length - 1;
            return (
              <li key={t.title} className={`relative md:grid md:grid-cols-2 md:gap-12 ${last ? '' : 'mb-10'}`}>
                <span
                  className={`absolute top-1 -left-[41px] size-4 rounded-full border-4 border-white md:left-1/2 md:-translate-x-1/2 ${
                    last ? 'bg-brand-900 ring-2 ring-brand-900' : 'bg-wood-500 ring-2 ring-wood-500'
                  }`}
                  aria-hidden
                />
                <div className={i % 2 === 0 ? 'md:text-right' : 'md:col-start-2'}>
                  <p className="text-sm font-bold text-wood-600">{t.year}</p>
                  <h3 className="mt-1 font-semibold">{t.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Markalar */}
      <section className="border-y border-gray-200 py-10" aria-labelledby="partnerBrands">
        <div className="container-site">
          <h2 id="partnerBrands" className="text-center text-sm font-semibold text-gray-500">
            Yetkili satıcısı olduğumuz markalar
          </h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {BRANDS.map((b) => (
              <li key={b.name}>
                <Image
                  src={`/images/brands/${b.logo}`}
                  alt={b.name}
                  width={120}
                  height={40}
                  className="h-10 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
                  style={{ width: 'auto' }}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Kapanış */}
      <section className="container-site py-14 lg:py-20">
        <div className="relative overflow-hidden rounded-xl bg-brand-900 px-6 py-12 text-center text-white sm:px-12">
          <Image src="/images/categories/duvar.jpg" alt="" fill sizes="100vw" className="object-cover opacity-15" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">Projeniz için birlikte çalışalım</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
              Mağazamızı ziyaret edin ya da uzman ekibimizden ücretsiz danışmanlık ve proje teklifi alın.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/iletisim?konu=proje"
                className="inline-flex h-11 items-center justify-center gap-2 rounded bg-wood-500 px-6 text-sm font-semibold transition hover:bg-wood-600"
              >
                Proje Teklifi Al <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
              </Link>
              <Link
                href="/magazalarimiz"
                className="inline-flex h-11 items-center justify-center gap-2 rounded border border-white/40 px-6 text-sm font-semibold transition hover:bg-white hover:text-brand-900"
              >
                <MapPin className="size-4" strokeWidth={SW} aria-hidden /> Mağazalarımız
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
