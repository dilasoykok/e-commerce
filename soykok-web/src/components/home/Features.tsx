import { Headset, Package, ShieldCheck, Star, Truck } from 'lucide-react';
import { FREE_SHIPPING_LIMIT } from '@/lib/shipping';
import { formatTL } from '@/lib/format';

const ITEMS = [
  { icon: Truck, title: 'Ücretsiz Kargo', text: `${formatTL(FREE_SHIPPING_LIMIT)} ve üzeri alışverişlerde` },
  { icon: ShieldCheck, title: 'Güvenli Ödeme', text: '256 Bit SSL ile koruma' },
  { icon: Headset, title: 'Uzman Destek', text: 'Mağazada ve telefonla' },
  { icon: Package, title: 'Kolay İade', text: '14 gün içinde iade imkanı' },
  { icon: Star, title: 'Safranbolu Mağazası', text: 'Ürünleri yerinde görün' },
];

/** Özellik şeridi (eski partials/home/features.html) */
export default function Features() {
  return (
    <section className="container-site mt-3" aria-label="Alışveriş avantajları">
      <ul className="grid grid-cols-2 gap-y-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-4 md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-gray-200 lg:px-0">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={`flex items-center gap-3 lg:px-6 ${i > 0 ? 'lg:justify-center' : ''}`}>
            <Icon className="size-7 shrink-0 text-brand-700" strokeWidth={1.75} aria-hidden />
            <div>
              <p className="text-xs font-semibold">{title}</p>
              <p className="text-xs text-gray-500">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
