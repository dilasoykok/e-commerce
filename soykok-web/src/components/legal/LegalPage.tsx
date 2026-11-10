import Link from 'next/link';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { LEGAL_PAGES, LEGAL_UPDATED_AT } from '@/lib/company';

export type LegalSection = { id: string; title: string; body: React.ReactNode };

type Props = {
  title: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
  /** Sözleşme şablonlarında hukukçu kontrolü uyarısı */
  template?: boolean;
  current: string;
};

/**
 * Yasal / bilgi sayfası düzeni: başlık, içindekiler, bölümler ve diğer yasal sayfalara linkler.
 * Metin sunucuda çizilir, JavaScript gerekmez.
 */
export default function LegalPage({ title, intro, sections, template = false, current }: Props) {
  return (
    <div className="container-site py-6 lg:py-10">
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
            {title}
          </li>
        </ol>
      </nav>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[240px_1fr]">
        {/* Diğer sayfalar */}
        <aside className="lg:sticky lg:top-4">
          <nav aria-label="Yasal metinler ve yardım" className="rounded-md border border-gray-200 p-2 text-sm">
            {LEGAL_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={p.href === current ? 'page' : undefined}
                className="block rounded px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-brand-900 aria-[current=page]:bg-brand-900 aria-[current=page]:font-semibold aria-[current=page]:text-white"
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-xs text-gray-500">Son güncelleme: {LEGAL_UPDATED_AT}</p>

          {template && (
            <p className="mt-4 flex gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <TriangleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {/* TODO: Yayına almadan önce bu kutuyu kaldırın */}
              Bu metin bir şablondur. Köşeli parantezli alanları doldurun ve yayına almadan önce bir hukukçuya kontrol ettirin.
            </p>
          )}

          {intro && <div className="mt-5 text-sm leading-relaxed text-gray-700">{intro}</div>}

          {sections.length > 3 && (
            <nav aria-label="İçindekiler" className="mt-6 rounded-md bg-gray-50 p-4 text-sm">
              <p className="mb-2 font-semibold">İçindekiler</p>
              <ol className="list-decimal space-y-1 pl-5 text-gray-600">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="hover:text-brand-900 hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-8 space-y-8">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-6">
                <h2 id={`${s.id}-t`} className="text-lg font-bold">
                  {sections.length > 3 && `${i + 1}. `}
                  {s.title}
                </h2>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-gray-700 [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:space-y-1">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
