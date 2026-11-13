'use client';

import { useEffect, useRef, useState } from 'react';

type Tab = { id: string; label: React.ReactNode; content: React.ReactNode };

/**
 * Sekmeler (eski product-detail.js → initTabs). İçerikler sunucuda çizilip
 * gelir; burada yalnızca hangisinin görüneceği seçilir. Ok tuşlarıyla gezilir.
 * Adres #degerlendirmeler ya da #taksit-secenekleri ise ilgili sekme açılır.
 */
type HashTab = { hash: string; tabId: string };

export default function ProductTabs({ tabs, hashTabs = [] }: { tabs: Tab[]; hashTabs?: HashTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hashTabs.length === 0) return;
    const sync = () => {
      const match = hashTabs.find((h) => location.hash === `#${h.hash}`);
      if (!match) return;
      setActive(match.tabId);
      // Panel görünür olduktan sonra sekmelere kaydır
      requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashTabs.map((h) => h.hash).join()]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    setActive(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#tab-${next.id}`)?.focus();
  };

  return (
    <section className="mt-12">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Ürün bilgileri"
        onKeyDown={onKeyDown}
        className="flex scroll-mt-4 gap-6 overflow-x-auto border-b border-gray-200 text-sm font-semibold"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={t.id === active}
            tabIndex={t.id === active ? 0 : -1}
            onClick={() => setActive(t.id)}
            className="-mb-px shrink-0 border-b-2 border-transparent pb-3 text-gray-500 aria-selected:border-brand-900 aria-selected:text-brand-900"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active} className="py-6">
          {t.content}
        </div>
      ))}
    </section>
  );
}
