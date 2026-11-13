'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pause, Play } from 'lucide-react';
import { brandHref } from '@/lib/brands';
import type { BrandInfo } from '@/lib/types';

/**
 * Popüler markalar — yumuşak kayan bant, kenarlarda şeffaf geçiş. Logosu eklenmiş markada
 * logo, eklenmemişte adı görünür. Markalar Admin → Markalar'dan gelir (Brands.tsx).
 *   - Tamamen CSS ile kayar (animate-marquee); fare üstündeyken ya da klavyeyle bir markaya gelince durur
 *   - Durdur/Oynat düğmesi (WCAG 2.2.2: 5 sn'den uzun süren hareket durdurulabilmeli)
 *   - "Hareketi azalt" tercihinde kaymaz
 * İkinci liste kesintisiz döngü için kopyadır, ekran okuyuculardan ve klavyeden gizlenir.
 */
export default function BrandBand({ brands }: { brands: BrandInfo[] }) {
  const [paused, setPaused] = useState(false);

  return (
    <section id="markalar" className="container-site scroll-mt-28 py-8" aria-labelledby="brandsTitle">
      <div className="relative mb-5 flex items-center justify-center">
        <h2 id="brandsTitle" className="text-center text-xl font-bold tracking-wide uppercase md:text-2xl">
          Popüler Markalar
        </h2>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="absolute right-0 grid size-9 place-items-center rounded-full border border-gray-300 text-gray-600 hover:border-brand-900 hover:text-brand-900 motion-reduce:hidden"
        >
          {paused ? <Play className="size-4" strokeWidth={1.75} aria-hidden /> : <Pause className="size-4" strokeWidth={1.75} aria-hidden />}
          <span className="sr-only">{paused ? 'Marka bandını oynat' : 'Marka bandını durdur'}</span>
        </button>
      </div>

      {/* Kenarlarda şeffaf geçiş: markalar sağdan belirip solda yumuşakça kaybolur */}
      <div className="group/marquee flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className={`flex animate-marquee group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] motion-reduce:animate-none ${
            paused ? '[animation-play-state:paused]' : ''
          }`}
        >
          <BrandList brands={brands} />
          <BrandList brands={brands} hidden />
        </div>
      </div>
    </section>
  );
}

function BrandList({ brands, hidden = false }: { brands: BrandInfo[]; hidden?: boolean }) {
  // Bant genişliği dolsun diye liste iki kez tekrarlanır (az marka varsa daha fazla)
  const repeat = Math.max(2, Math.ceil(12 / Math.max(brands.length, 1)));
  const band = Array.from({ length: repeat }, () => brands).flat();
  return (
    <ul className="flex shrink-0 gap-6 pr-6" aria-hidden={hidden || undefined}>
      {band.map((b, i) => (
        <li key={`${b.name}-${i}`}>
          <Link
            href={brandHref(b.name)}
            tabIndex={hidden || i >= brands.length ? -1 : undefined}
            aria-hidden={!hidden && i >= brands.length ? true : undefined}
            className="flex h-[4.5rem] w-40 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-base font-bold tracking-wide text-brand-800 transition hover:border-brand-900 hover:bg-white sm:h-20 sm:w-44"
          >
            {b.logo ? (
              // Logo varsa logo (adı alt metinde), yoksa marka adı
              <Image src={b.logo} alt={b.name} width={140} height={48} unoptimized className="max-h-10 w-auto max-w-full object-contain sm:max-h-12" />
            ) : (
              b.name
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
