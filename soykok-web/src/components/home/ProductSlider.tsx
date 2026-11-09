'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Props = {
  id: string;
  titleId: string;
  badge: React.ReactNode;
  title: string;
  description: string;
  allHref: string;
  /** Mobilde altta çıkan "Tüm ..." butonunun yazısı (verilmezse buton yok) */
  mobileAllLabel?: string;
  /** ms; 0 → otomatik kayma yok */
  autoplay?: number;
  /** Sunucuda çizilmiş <ProductCard /> listesi */
  children: React.ReactNode;
};

const navBtn =
  'grid size-10 place-items-center rounded-full border border-gray-300 bg-white transition hover:border-brand-900 hover:bg-brand-900 hover:text-white disabled:opacity-40';

/**
 * Yatay kayan ürün listesi (eski product-slider.js). Kartlar sunucuda çizilip
 * children olarak gelir; bu bileşen yalnızca kaydırma, noktalar ve otomatik
 * kaymayı yönetir.
 */
export default function ProductSlider({
  id,
  titleId,
  badge,
  title,
  description,
  allHref,
  mobileAllLabel,
  autoplay = 0,
  children,
}: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [paused, setPaused] = useState(false);
  const itemCount = Children.count(children);

  /* ---------- Ölçüler ---------- */

  const metrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return null;
    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardWidth = card ? card.offsetWidth + gap : track.clientWidth;
    const visible = Math.max(1, Math.round(track.clientWidth / cardWidth));
    const pages = Math.max(1, Math.ceil((itemCount - visible) / visible) + 1);
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    return { track, cardWidth, visible, pages, atEnd };
  }, [itemCount]);

  const update = useCallback(() => {
    const m = metrics();
    if (!m) return;
    setPageCount(m.pages);
    setAtStart(m.track.scrollLeft <= 5);
    setActivePage(m.atEnd ? m.pages - 1 : Math.round(m.track.scrollLeft / (m.cardWidth * m.visible)));
  }, [metrics]);

  const scrollByPage = useCallback(
    (dir: 1 | -1) => {
      const m = metrics();
      if (!m) return;
      if (dir > 0 && m.atEnd) m.track.scrollTo({ left: 0 });
      else m.track.scrollBy({ left: dir * m.cardWidth * m.visible });
    },
    [metrics],
  );

  const goToPage = (page: number) => {
    const m = metrics();
    m?.track.scrollTo({ left: page * m.cardWidth * m.visible });
  };

  /* ---------- Olaylar ---------- */

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    update();

    let wait: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(wait);
      wait = setTimeout(update, 80);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(wait);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  // Otomatik kayma: fare üstündeyken, odaktayken ya da sekme gizliyken durur
  useEffect(() => {
    if (!autoplay || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => !document.hidden && scrollByPage(1), autoplay);
    return () => clearInterval(timer);
  }, [autoplay, paused, scrollByPage]);

  if (itemCount === 0) return null;

  return (
    <section id={id} className="container-site scroll-mt-28 py-10" aria-labelledby={titleId}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {badge}
            <h2 id={titleId} className="mt-2 text-xl font-bold md:text-2xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={allHref} className="mr-2 hidden items-center gap-1.5 text-xs font-medium hover:text-wood-600 sm:flex">
              Tümünü Gör <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
            </Link>
            <button type="button" onClick={() => scrollByPage(-1)} disabled={atStart} aria-label="Önceki ürünler" className={navBtn}>
              <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
            <button type="button" onClick={() => scrollByPage(1)} aria-label="Sonraki ürünler" className={navBtn}>
              <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <ul
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li]:w-[calc((100%_-_0.75rem)/2)] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%_-_1.5rem)/3)] lg:[&>li]:w-[calc((100%_-_2.25rem)/4)] xl:[&>li]:w-[calc((100%_-_3rem)/5)]"
        >
          {children}
        </ul>

        {pageCount > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                aria-current={i === activePage}
                aria-label={`${i + 1}. sayfa`}
                className="h-2 w-2 rounded-full bg-gray-300 transition-all aria-[current=true]:w-6 aria-[current=true]:bg-brand-900"
              />
            ))}
          </div>
        )}

        {mobileAllLabel && (
          <Link
            href={allHref}
            className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded border border-gray-300 text-sm font-medium sm:hidden"
          >
            {mobileAllLabel} <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
