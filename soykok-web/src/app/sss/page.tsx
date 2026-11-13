import type { Metadata } from 'next';
import Link from 'next/link';
import Faq from '@/components/home/Faq';
import { LEGAL_PAGES } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'Boya hesabı, toplu alım, teslimat, ödeme, taksit ve iade hakkında sıkça sorulan sorular.',
};

/** SSS — ana sayfadaki SSS bölümünün aynısı + yardım sayfalarına linkler */
export default function Page() {
  return (
    <>
      <h1 className="sr-only">Sıkça Sorulan Sorular</h1>
      <Faq />
      <nav aria-label="Diğer yardım sayfaları" className="container-site pb-14">
        <ul className="flex flex-wrap justify-center gap-2">
          {LEGAL_PAGES.filter((p) => p.href !== '/sss').map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="inline-flex h-9 items-center rounded-full border border-gray-300 px-4 text-xs font-medium hover:border-brand-900">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
