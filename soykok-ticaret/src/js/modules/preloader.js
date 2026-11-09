/**
 * Preloader'ı kapatma işi partials/head.html içindeki küçük betikte yapılır
 * (<html> etiketine "is-loaded" sınıfı eklenir). Bu modül yalnızca kaybolma
 * animasyonu bitince preloader'ı sayfadan tamamen kaldırır.
 */
export function initPreloader() {
  const el = document.getElementById('preloader');
  if (!el) return;

  const root = document.documentElement;
  const remove = () => {
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => el.remove(), 400); // .35 sn'lik solma animasyonundan sonra
  };

  if (root.classList.contains('is-loaded')) {
    remove();
    return;
  }

  // Henüz kapanmadıysa, kapandığı anı bekle
  const observer = new MutationObserver(() => {
    if (root.classList.contains('is-loaded')) {
      observer.disconnect();
      remove();
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
}
