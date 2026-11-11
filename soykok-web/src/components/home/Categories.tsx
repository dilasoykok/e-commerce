import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { href: '/urunler?kategori=boya', image: 'boya.jpg', title: 'Boya ve Vernik', text: 'İç ve dış cephe, vernik, rulo ve fırça' },
  { href: '/urunler?kategori=hirdavat', image: 'hirdavat.jpg', title: 'Hırdavat', text: 'El aletleri, vida, dübel, elektrikli aletler' },
  { href: '/urunler?kategori=tesisat', image: 'tesisat.jpg', title: 'Tesisat ve Banyo', text: 'Batarya, boru, vana ve su sayacı' },
  { href: '/urunler?kategori=insaat-malzemeleri', image: 'insaat.jpg', title: 'İnşaat Malzemeleri', text: 'Çimento, alçı, alçıpan, yalıtım' },
  { href: '/urunler?kategori=kimyasal', image: 'yapi-kimyasal.jpg', title: 'Yapı Kimyasalları', text: 'Yapıştırıcı, derz, silikon, su yalıtımı' },
];

/** Kategori kartları (eski partials/home/categories.html + components/category-card.html) */
export default function Categories() {
  return (
    <section className="container-site mt-4" aria-label="Öne çıkan kategoriler">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-3.5">
        {CATEGORIES.map((c, i) => (
          // Mobilde 5. kart tam genişlik
          <li key={c.href} className={i === 4 ? 'col-span-2 md:col-span-1' : undefined}>
            <CategoryCard {...c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryCard({ href, image, title, text }: (typeof CATEGORIES)[number]) {
  return (
    <Link href={href} className="group relative block h-36 overflow-hidden rounded-md bg-brand-800 sm:h-40 lg:h-[140px]">
      <Image
        src={`/images/categories/${image}`}
        alt=""
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-brand-950/85 via-brand-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
        <div className="min-w-0">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="truncate text-[11px] text-white/85">{text}</p>
        </div>
        <ArrowRight className="ml-auto size-4 shrink-0 transition group-hover:translate-x-1" strokeWidth={1.75} aria-hidden />
      </div>
    </Link>
  );
}
