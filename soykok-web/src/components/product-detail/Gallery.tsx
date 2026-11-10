'use client';

import { useState } from 'react';
import Image from 'next/image';

/** Ürün galerisi: büyük görsel + küçük resimler (eski product-detail.js → initGallery) */
export default function Gallery({ images, name, badge }: { images: string[]; name: string; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
        {badge}
        {current && (
          <Image
            key={current}
            src={`/images/products/${current}`}
            alt={name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            preload={active === 0}
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <li key={`${img}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1}. görseli göster`}
                aria-current={i === active}
                className="relative block aspect-[4/3] w-full overflow-hidden rounded border-2 border-transparent transition hover:border-gray-300 aria-[current=true]:border-brand-900"
              >
                <Image src={`/images/products/${img}`} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
