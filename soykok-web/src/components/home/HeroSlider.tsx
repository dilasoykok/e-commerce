'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  slides: React.ReactNode[];
  aside?: React.ReactNode;
  interval?: number;
};

/**
 * Hero slaytları arasında geçiş (eski hero-slider.js).
 * - 6 sn'de bir otomatik geçer; fare/klavye odağı üzerindeyken ve sekme gizliyken durur
 * - Mobilde parmakla kaydırılabilir
 * - "Hareketi azalt" açıksa otomatik geçiş yok
 */
export default function HeroSlider({ slides, aside, interval = 6000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // elle geçişte zamanlayıcıyı sıfırlamak için
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
      setTick((t) => t + 1);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      if (!document.hidden) setCurrent((c) => (c + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [paused, count, interval, tick]);

  return (
    <section
      id="hero"
      className="relative h-[460px] overflow-hidden bg-brand-900 lg:h-[400px]"
      aria-roledescription="carousel"
      aria-label="Öne çıkanlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {slides.map((slide, i) => {
        const active = i === current;
        return (
          <article
            key={i}
            data-slide
            inert={!active}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? '' : 'pointer-events-none opacity-0'}`}
          >
            {slide}
          </article>
        );
      })}

      {/* Noktalar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10">
        <div className="container-site">
          <div className="pointer-events-auto flex items-center gap-3 lg:ml-[400px]">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-current={i === current}
                aria-label={`${i + 1}. slayt`}
                className="h-2 w-2 rounded-full ring-1 ring-white transition-all aria-[current=true]:w-6 aria-[current=true]:bg-white"
              />
            ))}
          </div>
        </div>
      </div>

      {aside}
    </section>
  );
}
