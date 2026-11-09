export function initHeroSlider(root = document.getElementById('hero'), { interval = 6000 } = {}) {
  if (!root) return;

  const slides = [...root.querySelectorAll('[data-slide]')];
  const dots = [...root.querySelectorAll('[data-dot]')];
  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer = null;

  const go = (index) => {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('opacity-0', !active);
      slide.classList.toggle('pointer-events-none', !active);
      slide.inert = !active;
    });

    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  };

  const stop = () => clearInterval(timer);
  const start = () => {
    if (reduceMotion) return;
    stop();
    timer = setInterval(() => go(current + 1), interval);
  };

  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => { go(i); start(); })
  );

  // Fare veya klavye odağı slider üzerindeyken otomatik geçişi durdur
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  // Mobilde kaydırma
  let startX = null;
  root.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { go(current + (dx < 0 ? 1 : -1)); start(); }
    startX = null;
  });

  // Sekme arka plandayken durdur
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  go(0);
  start();
}
