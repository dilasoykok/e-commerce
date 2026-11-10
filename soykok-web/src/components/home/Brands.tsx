import Image from 'next/image';
import Link from 'next/link';
import { BRANDS, brandHref } from '@/lib/brands';

// Bant genişliği dolsun diye marka listesi iki kez tekrarlanır (eskisi gibi 10 logo)
const BAND = [...BRANDS, ...BRANDS];

/**
 * Popüler markalar — kayan bant (eski partials/home/brands.html).
 * Tamamen CSS ile kayar (animate-marquee); fare üstündeyken durur.
 * İkinci liste kesintisiz döngü için kopyadır, ekran okuyuculardan gizlenir.
 */
export default function Brands() {
  return (
    <section id="markalar" className="container-site scroll-mt-28 py-8" aria-labelledby="brandsTitle">
      <h2 id="brandsTitle" className="mb-5 text-center text-xl font-bold tracking-wide uppercase md:text-2xl">
        Popüler Markalar
      </h2>

      <div className="group/marquee flex overflow-hidden">
        <div className="flex animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
          <BrandList />
          <BrandList hidden />
        </div>
      </div>
    </section>
  );
}

function BrandList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 gap-6 pr-6" aria-hidden={hidden || undefined}>
      {BAND.map((b, i) => (
        <li key={`${b.name}-${i}`}>
          <Link
            href={brandHref(b.name)}
            title={b.name}
            tabIndex={hidden ? -1 : undefined}
            className="flex h-[88px] w-[160px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-gray-300 hover:bg-white sm:h-[96px] sm:w-[180px]"
          >
            <Image src={`/images/brands/${b.logo}`} alt={b.name} width={156} height={72} className="max-h-full object-contain"
                      style={{ width: 'auto', height: 'auto' }} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
