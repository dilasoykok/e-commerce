import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, Package, SwatchBook, Truck } from 'lucide-react';

import Gallery from '@/components/product-detail/Gallery';
import PurchasePanel from '@/components/product-detail/PurchasePanel';
import ProductTabs from '@/components/product-detail/ProductTabs';
import ProductCard from '@/components/product/ProductCard';
import { getCategories, getProduct, getProducts } from '@/lib/catalog';
import { formatTL } from '@/lib/format';
import { FREE_SHIPPING_LIMIT } from '@/lib/shipping';
import { parentGroup } from '@/lib/product-filters';
import type { CatalogCategories, Product } from '@/lib/types';

// Ürün bilgisi en fazla 60 sn önbellekte; admin değiştirince hemen yenilenir (catalog etiketi)
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

const BADGE_COLORS: Record<string, string> = { sale: 'bg-sale', new: 'bg-green-600', info: 'bg-brand-900' };
const SW = 1.75;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(decodeURIComponent((await params).id));
  if (!product) return { title: 'Ürün bulunamadı' };
  const description = product.description ?? `${product.brand} ${product.name} — ${formatTL(product.price)}/${product.unit || 'm²'}`;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: [`/images/products/${product.image}`] },
  };
}

/** Ürün detayı (eski urun.html?id=... + product-detail.js) */
export default async function ProductPage({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const [product, catalog, all] = await Promise.all([getProduct(id), getCategories(), getProducts({ limit: 100 })]);
  if (!product) notFound();

  const unit = product.unit || 'm²';
  const categoryName = catalog.categories.find((c) => c.slug === product.category)?.name ?? product.category;
  const group = parentGroup(product.category, catalog);
  const related = relatedProducts(product, all, catalog);
  const images = product.images.length ? product.images : [product.image];
  const specs = { Marka: product.brand, Kategori: categoryName, ...product.specs };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: product.id,
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    image: images.map((i) => `/images/products/${i}`),
    description: product.description ?? undefined,
    aggregateRating: product.reviews
      ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviews }
      : undefined,
    offers: { '@type': 'Offer', priceCurrency: 'TRY', price: product.price, availability: 'https://schema.org/InStock' },
  };

  return (
    <div className="container-site py-6 lg:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* Breadcrumb */}
      <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <Crumb href="/">Ana Sayfa</Crumb>
          <Crumb href="/urunler">Ürünler</Crumb>
          <Crumb href={`/urunler?kategori=${product.category}`}>{categoryName}</Crumb>
          <li aria-current="page" className="font-medium text-brand-900">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery
          images={images}
          name={product.name}
          badge={
            product.badge && (
              <span
                className={`absolute top-3 left-3 z-10 rounded-sm px-2.5 py-1 text-xs font-semibold text-white ${
                  BADGE_COLORS[product.badgeType ?? ''] ?? 'bg-brand-900'
                }`}
              >
                {product.badge}
              </span>
            )
          }
        />

        <div>
          <p className="text-xs font-medium text-wood-600">
            {product.brand} · {categoryName}
          </p>
          <h1 className="mt-1 text-2xl leading-snug font-bold sm:text-3xl">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <a href="#degerlendirmeler" className="flex items-center gap-1.5 hover:underline">
              <Stars rating={product.rating} className="text-base" />
              <strong className="text-brand-900">{product.rating}</strong>
              <span>({product.reviews} değerlendirme)</span>
            </a>
            <span aria-hidden>|</span>
            <span>
              Ürün kodu: <span className="font-medium text-brand-900">{product.id.toUpperCase()}</span>
            </span>
          </div>

          {/* Fiyat */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-3xl font-bold ${product.oldPrice ? 'text-sale' : ''}`}>
              {formatTL(product.price)} / {unit}
            </span>
            {product.oldPrice && (
              <>
                <del className="text-base text-gray-400">{formatTL(product.oldPrice)}</del>
                <span className="rounded bg-sale/10 px-2 py-0.5 text-xs font-semibold text-sale">
                  %{Math.round((1 - product.price / product.oldPrice) * 100)} indirim
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            KDV dahil
            {product.boxM2 && <span className="before:mx-1.5 before:content-['·']">1 paket = {product.boxM2.toLocaleString('tr-TR')} m²</span>}
          </p>

          {product.features.length > 0 && (
            <ul className="mt-5 space-y-1.5 text-sm">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-600" aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <PurchasePanel
            product={{ id: product.id, name: product.name, brand: product.brand, image: product.image, price: product.price, unit }}
            boxM2={product.boxM2}
          />

          {/* Güven bandı */}
          <ul className="mt-6 grid gap-3 border-t border-gray-200 pt-5 text-xs text-gray-600 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Truck className="size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden /> {formatTL(FREE_SHIPPING_LIMIT)} üzeri ücretsiz kargo
            </li>
            <li className="flex items-center gap-2">
              <SwatchBook className="size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
              <Link href="/iletisim?konu=numune" className="underline hover:text-brand-900">
                Ücretsiz numune iste
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Package className="size-5 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden /> 14 gün kolay iade
            </li>
          </ul>
        </div>
      </div>

      <ProductTabs
        hashTab={{ hash: 'degerlendirmeler', tabId: 'yorum' }}
        tabs={[
          {
            id: 'aciklama',
            label: 'Ürün Açıklaması',
            content: (
              <p className="max-w-3xl text-sm leading-relaxed text-gray-700">
                {product.description ?? 'Ürün açıklaması yakında eklenecek. Bilgi almak için bizimle iletişime geçebilirsiniz.'}
              </p>
            ),
          },
          {
            id: 'ozellik',
            label: 'Teknik Özellikler',
            content: (
              <table className="w-full max-w-2xl overflow-hidden rounded-md border border-gray-200 text-sm">
                <tbody>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k} className="odd:bg-gray-50">
                      <th scope="row" className="w-2/5 px-4 py-2.5 text-left font-medium text-gray-600">
                        {k}
                      </th>
                      <td className="px-4 py-2.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            id: 'kargo',
            label: 'Kargo ve İade',
            content: (
              <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-gray-700">
                <p>
                  <strong>Teslimat:</strong> Stokta olan ürünler 3–7 iş günü içinde kargoya verilir. {formatTL(FREE_SHIPPING_LIMIT)} ve
                  üzeri siparişlerde kargo ücretsizdir.
                </p>
                <p>
                  <strong>Mağazadan teslim:</strong> Safranbolu mağazamızdan ücretsiz teslim alabilirsiniz.
                </p>
                <p>
                  <strong>İade:</strong> Kullanılmamış ve ambalajı açılmamış ürünleri teslimattan itibaren 14 gün içinde iade edebilirsiniz.
                </p>
              </div>
            ),
          },
          {
            id: 'yorum',
            label: `Değerlendirmeler (${product.reviews})`,
            content: (
              <div className="max-w-sm rounded-lg border border-gray-200 p-5 text-center">
                <p className="text-5xl font-bold">{product.rating.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}</p>
                <Stars rating={product.rating} className="mt-2 text-2xl" />
                <p className="mt-1 text-xs text-gray-500">{product.reviews} değerlendirme</p>
                {/* TODO: backend'e değerlendirme uç noktaları (GET/POST /api/products/{id}/reviews) eklenince liste ve form */}
                <p className="mt-4 text-xs text-gray-500">Yazılı yorumlar ve değerlendirme formu yakında burada olacak.</p>
              </div>
            ),
          },
        ]}
      />

      {/* Benzer ürünler */}
      {related.length > 0 && (
        <section className="mt-10" aria-labelledby="relatedTitle">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="relatedTitle" className="text-lg font-bold">
              Benzer Ürünler
            </h2>
            <Link
              href={`/urunler?kategori=${group ?? product.category}`}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-wood-600"
            >
              Tümünü Gör <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Benzer ürünler: aynı kategori → aynı üst kategori → diğerleri; eşitlikte çok satan önce */
function relatedProducts(product: Product, all: Product[], catalog: CatalogCategories): Product[] {
  const group = parentGroup(product.category, catalog);
  return all
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score: p.category === product.category ? 2 : group && parentGroup(p.category, catalog) === group ? 1 : 0,
    }))
    .sort((a, b) => b.score - a.score || b.p.sales - a.p.sales)
    .slice(0, 4)
    .map(({ p }) => p);
}

function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <>
      <li>
        <Link href={href} className="hover:text-brand-900">
          {children}
        </Link>
      </li>
      <li aria-hidden>
        <ChevronRight className="size-3.5" strokeWidth={SW} />
      </li>
    </>
  );
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`relative inline-block leading-none ${className}`} role="img" aria-label={`5 üzerinden ${rating} puan`}>
      <span className="text-gray-300">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${(rating / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
