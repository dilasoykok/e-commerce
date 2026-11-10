import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="container-site py-10">
      <div className="flex flex-col items-center rounded-md border border-dashed border-gray-300 px-6 py-20 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-400">
          <SearchX className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Ürün bulunamadı</h1>
        <p className="mt-1 text-sm text-gray-500">Aradığınız ürün kaldırılmış ya da adresi değişmiş olabilir.</p>
        <Link
          href="/urunler"
          className="mt-5 inline-flex h-10 items-center rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Tüm Ürünlere Göz At
        </Link>
      </div>
    </div>
  );
}
