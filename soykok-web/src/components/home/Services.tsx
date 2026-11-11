import Link from 'next/link';
import { ArrowRight, Building, Mail, SwatchBook } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

const SERVICES = [
  {
    icon: SwatchBook,
    title: 'Renk Danışmanlığı',
    text: 'Boya renklerini kartelada görün, doğru tonu birlikte seçelim.',
    cta: 'Bize Danışın',
    href: '/iletisim?konu=numune',
  },
  {
    icon: Building,
    title: 'Proje Bazlı Çözümler',
    text: 'Ticari ve konut projeleriniz için özel fiyatlandırma.',
    cta: 'Proje Teklifi Al',
    href: '/iletisim?konu=proje',
  },
];

/** Hizmetler + e-bülten şeridi (eski partials/home/services.html) */
export default function Services() {
  return (
    <section className="container-site mt-4" aria-label="Hizmetler ve e-bülten">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr]">
        {SERVICES.map(({ icon: Icon, title, text, cta, href }) => (
          <Link
            key={title}
            href={href}
            className="group flex gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white"
          >
            <Icon className="size-7 shrink-0 text-brand-700" strokeWidth={1.75} aria-hidden />
            <div>
              <h3 className="text-xs font-semibold">{title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{text}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold group-hover:text-wood-600">
                {cta} <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden />
              </span>
            </div>
          </Link>
        ))}

        <div className="flex gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:col-span-2 lg:col-span-1">
          <Mail className="size-7 shrink-0 text-brand-700" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold">E-Bültenimize Abone Olun</h3>
            <p className="mt-0.5 text-xs text-gray-500">Kampanya ve yeniliklerden ilk siz haberdar olun.</p>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
