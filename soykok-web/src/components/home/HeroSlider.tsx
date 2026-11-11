'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

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
 * - Görünür Durdur/Oynat butonu (WCAG 2.2.2: kendiliğinden hareket eden içerik durdurulabilmeli)
 */
export default function HeroSlider({ slides, aside, interval = 6000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false); // fare/odak üzerindeyken geçici
  const [stopped, setStopped] = useState(false); // kullanıcı Durdur'a bastı

  // Sistemde "hareketi azalt" seçiliyse durmuş başlar
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStopped(true);
  }, []);
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
    if (paused || stopped || count < 2) return;

    const id = setInterval(() => {
      if (!document.hidden) setCurrent((c) => (c + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [paused, stopped, count, interval, tick]);

  return (
    <section
      id="hero"
      className="relative h-[28.75rem] overflow-hidden bg-brand-900 lg:h-[25rem]" /* rem: tarayıcı yazı boyutuyla büyür */
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
          <div className="pointer-events-auto flex items-center gap-1 lg:ml-[400px]">
            {count > 1 && (
              <button
                type="button"
                onClick={() => setStopped((v) => !v)}
                aria-label={stopped ? 'Slaytları oynat' : 'Slaytları durdur'}
                className="mr-1 grid size-7 place-items-center rounded-full bg-black/30 text-white transition hover:bg-black/50"
              >
                {stopped ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
              </button>
            )}
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-current={i === current}
                aria-label={`${i + 1}. slayt`}
                className="group/dot grid h-6 min-w-6 place-items-center"
              >
                <span className="h-2 w-2 rounded-full ring-1 ring-white transition-all group-aria-[current=true]/dot:w-6 group-aria-[current=true]/dot:bg-white" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {aside}
    </section>
  );
}
