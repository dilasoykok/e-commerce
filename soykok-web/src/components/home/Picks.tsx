import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { getProductsByIds } from '@/lib/catalog';
import { BRANDS, brandHref } from '@/lib/brands';

/**
 * Elle seçilen ürünler. Eskiden fiyatlar HTML'e sabit yazılıydı; artık ürünler
 * katalogdan (API) gelir, fiyat değişince burası da güncellenir.
 * TODO: Backend'e "öne çıkan" alanı eklenince bu liste oradan yönetilebilir.
 */
const PICK_IDS = ['ic-boya-silikonlu-7-5l', 'darbeli-matkap-750w', 'seramik-yapistiricisi-25kg', 'lavabo-bataryasi-krom', 'saten-alci-25kg'];

/** Sizin İçin Seçtiklerimiz (eski partials/home/picks.html) */
export default async function Picks() {
  const products = await getProductsByIds(PICK_IDS);

  return (
    <section className="container-site mt-8" aria-labelledby="picksTitle">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="picksTitle" className="text-lg font-bold">
          Sizin İçin Seçtiklerimiz
        </h2>
        <Link href="/urunler" className="flex items-center gap-1.5 text-xs font-medium hover:text-wood-600">
          Tümünü Gör <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[238px_1fr]">
        {/* Sol sütun: Banner + Markalar */}
        <aside className="flex flex-col gap-5">
          <Link href="/iletisim" className="group relative block h-[142px] overflow-hidden rounded-md bg-brand-800">
            <Image
              src="/images/banners/toplu-alim-yapi.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 238px, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-brand-950/90 via-brand-950/50 to-brand-950/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[11px] text-white/85">Profesyonellere Özel</p>
              <h3 className="text-base font-bold">Toplu Alım Avantajları</h3>
              <span className="mt-2.5 inline-flex h-7 items-center gap-2 rounded border border-white/70 px-3 text-[11px] font-medium transition group-hover:bg-white group-hover:text-brand-900">
                Teklif Al <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
              </span>
            </div>
          </Link>

          <div>
            <h3 className="mb-2.5 text-xs font-semibold">Popüler Markalar</h3>
            <ul className="grid grid-cols-2 gap-1.5">
              {BRANDS.map((b) => (
                <li key={b.name}>
                  <Link
                    href={brandHref(b.name)}
                    className="grid h-9 place-items-center rounded border border-gray-200 bg-white px-1.5 text-center text-[11px] font-semibold text-brand-800 transition hover:border-brand-900"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Ürün kartları */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ul>
      </div>
    </section>
  );
}
