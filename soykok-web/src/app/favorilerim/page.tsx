import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import FavoritesPage from '@/components/favorites/FavoritesPage';

export const metadata: Metadata = { title: 'Favorilerim', robots: { index: false } };

export default function Page() {
  return (
    <div className="container-site py-6 lg:py-8">
      <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-900">
              Ana Sayfa
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" strokeWidth={1.75} />
          </li>
          <li aria-current="page" className="font-medium text-brand-900">
            Favorilerim
          </li>
        </ol>
      </nav>
      <h1 className="mt-3 text-2xl font-bold">Favorilerim</h1>
      <FavoritesPage />
    </div>
  );
}
