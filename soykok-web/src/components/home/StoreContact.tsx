import { Clock, MapPin, Phone } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/90XXXXXXXXXX?text=Merhaba,%20kampanyalar%20hakkında%20bilgi%20almak%20istiyorum.';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Safranbolu+Karabük';
const MAP_EMBED_URL = 'https://www.google.com/maps?q=Safranbolu,Karabük&output=embed';

const INFO = [
  {
    icon: MapPin,
    title: 'Adres',
    body: (
      <p className="mt-1 text-sm text-stone-600">
        [Mahalle, Cadde, No]
        <br />
        Safranbolu / Karabük
      </p>
    ),
  },
  {
    icon: Phone,
    title: 'Telefon',
    body: (
      <a href="tel:+90XXXXXXXXXX" className="mt-1 block text-sm text-stone-600 hover:text-amber-700">
        0 (XXX) XXX XX XX
      </a>
    ),
  },
  {
    icon: Clock,
    title: 'Çalışma Saatleri',
    body: (
      <p className="mt-1 text-sm text-stone-600">
        Pazartesi – Cumartesi: 08:30 – 19:00
        <br />
        Pazar: Kapalı
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
            Ürünleri yerinde görmek, numune almak ve kampanyalar hakkında bilgi almak için Safranbolu mağazamıza bekleriz.
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
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                WhatsApp&apos;tan Yaz
              </a>
              <a
                href={DIRECTIONS_URL}
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
              src={MAP_EMBED_URL}
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
