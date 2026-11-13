import { Clock, MapPin, Phone } from 'lucide-react';
import { STORE, hoursSummary } from '@/lib/store-info';

const INFO = [
  {
    icon: MapPin,
    title: 'Adres',
    body: (
      <p className="mt-1 text-sm text-stone-600">
        {STORE.addressLines[0]}
        <br />
        {STORE.addressLines[1]}
      </p>
    ),
  },
  {
    icon: Phone,
    title: 'Telefon',
    body: (
      <a href={STORE.phoneHref} className="mt-1 block text-sm text-stone-600 hover:text-amber-700">
        {STORE.phone}
      </a>
    ),
  },
  {
    icon: Clock,
    title: 'Çalışma Saatleri',
    body: (
      <p className="mt-1 text-sm text-stone-600">
        {hoursSummary().map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    ),
  },
];

/**
 * Mağaza ve iletişim (eski partials/home/contact.html).
 * Bölüm id'si "magaza": /iletisim artık ayrı bir sayfa olacağı için çakışmasın.
 */
export default function StoreContact() {
  return (
    <section id="magaza" className="scroll-mt-28 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
            Bizi Ziyaret Edin
          </span>
          <h2 className="mt-4 text-3xl font-bold text-stone-800 md:text-4xl">Mağazamız ve İletişim</h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600">
            Ürünleri yerinde görmek, boya renklerini kartelada seçmek ve kampanyalar hakkında bilgi almak için Safranbolu mağazamıza bekleriz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {INFO.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl bg-stone-50 p-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white">
                  <Icon className="size-6" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800">{title}</h3>
                  {body}
                </div>
              </div>
            ))}

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={STORE.whatsappHref ?? STORE.phoneHref}
                {...(STORE.whatsappHref ? { target: '_blank', rel: 'noopener' } : {})}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                {STORE.whatsappHref ? <>WhatsApp&apos;tan Yaz</> : 'Hemen Ara'}
              </a>
              <a
                href={STORE.directionsHref}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-3 font-semibold text-white transition hover:bg-amber-800"
              >
                Yol Tarifi Al
              </a>
            </div>
          </div>

          <div className="min-h-[350px] overflow-hidden rounded-2xl shadow-sm">
            <iframe
              src={STORE.mapEmbedSrc}
              className="h-full min-h-[350px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Soykök Ticaret mağaza konumu"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
