import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatTL } from '@/lib/format';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';
import { productHref } from '@/lib/routes';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const BADGE_COLORS: Record<string, string> = { sale: 'bg-sale', new: 'bg-green-700', info: 'bg-brand-900' };

export { productHref };

/**
 * Ürün kartı (eski partials/components/product-card.html + product-list.js → productCard).
 * Server Component; yalnızca "Sepete Ekle" ve favori butonları tarayıcıda çalışır.
 */
export default function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const unit = p.unit || 'm²';
  const href = productHref(p.id);

  return (
    <li className="relative flex flex-col rounded-md border border-gray-200 bg-white p-3 transition hover:shadow-lg">
      {p.badge && (
        <span
          className={`absolute top-2 left-2 z-10 rounded-sm px-2 py-0.5 text-xs font-semibold text-white ${
            BADGE_COLORS[p.badgeType ?? ''] ?? 'bg-brand-900'
          }`}
        >
          {p.badge}
        </span>
      )}

      <Link href={href} className="relative block aspect-[2/1] overflow-hidden rounded-sm bg-gray-100">
        <Image
          src={productImageSrc(p.image)}
          unoptimized={isUploadedImage(p.image)}
          alt={p.name}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          preload={priority}
          className={`object-cover ${p.stock === 0 ? 'opacity-60 grayscale' : ''}`}
        />
        {p.stock === 0 && (
          <span className="absolute right-2 bottom-2 rounded-sm bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white">
            Tükendi
          </span>
        )}
      </Link>

      <h3 className="mt-3 text-xs leading-snug font-semibold">
        <Link href={href} className="hover:text-wood-600">
          {p.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-xs text-gray-500">{p.brand}</p>

      {p.reviews > 0 && (
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
        <span className="relative inline-block leading-none" role="img" aria-label={`5 üzerinden ${p.rating} puan`}>
          <span className="text-gray-300">★★★★★</span>
          <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${(p.rating / 5) * 100}%` }}>
            ★★★★★
          </span>
        </span>
        {p.rating} ({p.reviews})
      </div>
      )}

      <p className="mt-1.5 flex items-baseline gap-2">
        {p.oldPrice ? (
          <>
            <del className="text-xs text-gray-500">{formatTL(p.oldPrice)}</del>
            <ins className="text-sm font-bold text-sale no-underline">
              {formatTL(p.price)}/{unit}
            </ins>
          </>
        ) : (
          <span className="text-sm font-bold">
            {formatTL(p.price)}/{unit}
          </span>
        )}
      </p>

      <div className="mt-auto flex items-center gap-2 pt-3">
        <AddToCartButton
          product={{ id: p.id, name: p.name, brand: p.brand, image: p.image, price: p.price, unit }}
          soldOut={p.stock === 0}
          className="h-9 flex-1 rounded bg-brand-900 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-80"
        />
        <FavoriteButton id={p.id} />
      </div>
    </li>
  );
}
