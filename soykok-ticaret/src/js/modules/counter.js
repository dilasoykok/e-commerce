/**
 * data-count-to özelliği olan sayıları, ekrana girdiklerinde 0'dan hedefe doğru saydırır.
 *
 * <span data-count-to="12450" data-suffix="+">12.450+</span>
 *
 * HTML'de son değer zaten yazılı olduğu için JS çalışmazsa da doğru sayı görünür.
 * "Hareketi azalt" ayarı açık olan kullanıcılarda animasyon oynamaz.
 */
export function initCounters({ duration = 1600 } = {}) {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const format = (n) => n.toLocaleString('tr-TR');
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const run = (el) => {
    const target = Number(el.dataset.countTo);
    const suffix = el.dataset.suffix ?? '';
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = format(Math.round(target * easeOut(progress))) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target); // yalnızca bir kez say
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((el) => {
    el.textContent = '0' + (el.dataset.suffix ?? '');
    observer.observe(el);
  });
}