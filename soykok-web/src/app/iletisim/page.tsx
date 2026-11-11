import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import { STORE, hoursSummary } from '@/lib/store-info';

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'Ürün seçimi, siparişleriniz veya projeleriniz için bize telefon, WhatsApp, e-posta ya da form ile ulaşın.',
};

const SW = 1.75;

const FAQ = [
  {
    q: 'Siparişim ne zaman teslim edilir?',
    a: 'Stokta olan ürünler genellikle 3–7 iş günü içinde kargoya verilir. Siparişinizin durumunu Sipariş Takibi sayfasından izleyebilirsiniz.',
  },
  {
    q: 'Numune nasıl talep edebilirim?',
    a: 'Bu formda konu olarak "Numune talebi"ni seçip istediğiniz ürünleri yazmanız yeterli. Mağazamızdan da ücretsiz numune alabilirsiniz.',
  },
  {
    q: 'İade süresi ne kadar?',
    a: 'Teslimattan itibaren 14 gün içinde, kullanılmamış ve ambalajı açılmamış ürünleri iade edebilirsiniz.',
  },
  {
    q: 'Uygulama (montaj) hizmeti veriyor musunuz?',
    a: 'Montaj ve uygulama talepleriniz için mağazamızı arayın; ürüne ve bölgenize göre bilgi verelim.',
  },
];

type Props = { searchParams: Promise<{ konu?: string }> };

/** İletişim (eski iletisim.html). ?konu=numune gibi adreslerle konu önceden seçili gelir. */
export default async function ContactPage({ searchParams }: Props) {
  const { konu } = await searchParams;

  const channels = [
    {
      href: STORE.phoneHref,
      icon: Phone,
      iconClass: 'bg-brand-900 text-white',
      hover: 'hover:border-brand-900',
      label: 'Telefon',
      value: STORE.phone,
      hint: hoursSummary()[0],
    },
    {
      href: STORE.whatsappHref ?? '',
      external: true,
      icon: MessageCircle,
      iconClass: 'bg-green-700 text-white',
      hover: 'hover:border-green-600',
      label: 'WhatsApp',
      value: 'Mesaj gönderin',
      hint: 'Hızlı yanıt için',
    },
    {
      href: STORE.emailHref,
      icon: Mail,
      iconClass: 'bg-wood-600 text-white',
      hover: 'hover:border-brand-900',
      label: 'E-posta',
      value: STORE.email,
      hint: '1 iş günü içinde yanıt',
    },
  ].filter((c) => c.href); // WhatsApp numarası yoksa kart gösterilmez

  return (
    <>
      <section className="bg-gray-50">
        <div className="container-site py-10 lg:py-14">
          <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-brand-900">
                  Ana Sayfa
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5" strokeWidth={SW} />
              </li>
              <li aria-current="page" className="font-medium text-brand-900">
                İletişim
              </li>
            </ol>
          </nav>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Size nasıl yardımcı olabiliriz?</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
            Ürün seçimi, siparişleriniz veya projeleriniz için bize dilediğiniz kanaldan ulaşın. Mesajlarınızı en geç 1 iş günü
            içinde yanıtlıyoruz.
          </p>
        </div>
      </section>

      {/* İletişim kanalları */}
      <section className="container-site -mt-1 py-8" aria-label="İletişim kanalları">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ href, external, icon: Icon, iconClass, hover, label, value, hint }) => (
            <li key={label}>
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                className={`group flex h-full gap-4 rounded-lg border border-gray-200 p-5 transition hover:shadow-md ${hover}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${iconClass}`}>
                  <Icon className="size-5" strokeWidth={SW} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-gray-500">{label}</span>
                  <span className="block truncate font-semibold group-hover:text-wood-600">{value}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
                </span>
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/magazalarimiz"
              className="group flex h-full gap-4 rounded-lg border border-gray-200 p-5 transition hover:border-brand-900 hover:shadow-md"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gray-100 text-brand-900">
                <MapPin className="size-5" strokeWidth={SW} aria-hidden />
              </span>
              <span>
                <span className="block text-xs text-gray-500">Mağazamız</span>
                <span className="block font-semibold group-hover:text-wood-600">
                  {STORE.name} / {STORE.city}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">Adres ve yol tarifi →</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {/* Form + yan bilgi */}
      <section className="container-site pb-14 lg:pb-20" aria-labelledby="formTitle">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="relative rounded-lg border border-gray-200 p-6 sm:p-8">
            <h2 id="formTitle" className="text-xl font-bold">
              Bize Yazın
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              <span className="text-sale">*</span> ile işaretli alanlar zorunludur.
            </p>
            <ContactForm initialSubject={konu} />
          </div>

          <aside className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="relative h-52 bg-gray-100">
                <iframe
                  title="Soykök Ticaret Safranbolu konumu"
                  src={STORE.mapEmbedSrc}
                  className="absolute inset-0 size-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-5">
                <p className="font-semibold">{STORE.name} Mağazası</p>
                <address className="mt-1 text-xs leading-relaxed text-gray-600 not-italic">
                  {STORE.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
                <Link href="/magazalarimiz" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:text-wood-600">
                  Çalışma saatleri ve yol tarifi <ArrowRight className="size-3.5" strokeWidth={SW} aria-hidden />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold">Sıkça Sorulan Sorular</h2>
              <div className="mt-3 divide-y divide-gray-100 text-sm">
                {FAQ.map(({ q, a }) => (
                  <details key={q} className="group py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                      {q}
                      <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" strokeWidth={SW} aria-hidden />
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
