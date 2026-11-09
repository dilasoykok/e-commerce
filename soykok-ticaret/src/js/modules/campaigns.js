// Kampanya geri sayımı
export function initCampaignCountdown() {
  const sayaclar = document.querySelectorAll('.geri-sayim');
  if (!sayaclar.length) return;

  const guncelle = () => {
    sayaclar.forEach((sayac) => {
      const kalan = new Date(sayac.dataset.bitis).getTime() - Date.now();

      if (kalan <= 0) {
        sayac.textContent = 'Kampanya sona erdi';
        sayac.classList.replace('text-red-600', 'text-stone-400');
        return;
      }

      const gun = Math.floor(kalan / 86400000);
      const saat = Math.floor((kalan / 3600000) % 24);
      const dakika = Math.floor((kalan / 60000) % 60);
      const saniye = Math.floor((kalan / 1000) % 60);

      sayac.textContent = `${gun} gün ${saat} sa ${dakika} dk ${saniye} sn`;
    });
  };

  guncelle();
  setInterval(guncelle, 1000);
}

// Sayfa içi linklerle (#kampanyalar, /#sss ...) bölüme yumuşak kaydırma
export function initSmoothAnchors() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    const [yol, hedefId] = href.split('#');
    if (!hedefId) return;

    // "/#kampanyalar" gibi linkler sadece ana sayfadayken burada yakalanır
    const anaSayfada = ['/', '/index.html'].includes(location.pathname);
    if (yol && !(yol === '/' && anaSayfada)) return;

    const hedef = document.getElementById(hedefId);
    if (!hedef) return;

    e.preventDefault();

    // Mobil menü açıksa kapat
    const drawer = document.getElementById('mobileDrawer');
    if (drawer && !drawer.classList.contains('-translate-x-full')) {
      document.getElementById('drawerClose')?.click();
    }

    hedef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', '#' + hedefId);
  });
}
