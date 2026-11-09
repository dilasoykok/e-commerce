'use client';

import { useEffect, useRef } from 'react';

/** Çekmece/modal açıkken sayfanın arkada kaymasını engeller. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [locked]);
}

/** active iken Esc tuşuna basılınca onEscape çağrılır. */
export function useEscape(active: boolean, onEscape: () => void) {
  const handler = useRef(onEscape);
  handler.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}
