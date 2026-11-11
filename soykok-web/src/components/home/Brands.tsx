import Link from 'next/link';
import { BRANDS, brandHref } from '@/lib/brands';

/**
 * Popüler markalar. Eskiden sürekli kayan bir banttı; durdurulamayan hareket WCAG 2.2.2'ye
 * aykırı olduğu ve küçük ekranda okunması zor olduğu için sabit, satır sonunda sarılan liste.
 */
export default function Brands() {
  return (
    <section id="markalar" className="container-site scroll-mt-28 py-8" aria-labelledby="brandsTitle">
      <h2 id="brandsTitle" className="mb-5 text-center text-xl font-bold tracking-wide uppercase md:text-2xl">
        Popüler Markalar
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3">
        {BRANDS.map((b) => (
          <li key={b.name}>
            <Link
              href={brandHref(b.name)}
              className="flex min-h-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-base font-bold tracking-wide text-brand-800 transition hover:border-brand-900 hover:bg-white"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
