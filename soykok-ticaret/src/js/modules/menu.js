export function initMegaMenu() {
  const btn = document.getElementById('allCategoriesBtn');
  const menu = document.getElementById('megaMenu');
  const wrap = document.getElementById('megaWrap');
  if (!btn || !menu) return;

  const pinned = menu.hasAttribute('data-pinned');

  const setOpen = (state) => {
    menu.classList.toggle('hidden', !state);
    btn.setAttribute('aria-expanded', String(state));
  };

  if (pinned) setOpen(true);

  btn.addEventListener('click', () => {
    setOpen(menu.classList.contains('hidden'));
  });

  document.addEventListener('click', (e) => {
    if (pinned || wrap.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pinned) setOpen(false);
  });
}

export function initMobileDrawer() {
  const openBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('drawerClose');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (!openBtn || !drawer) return;

  const setOpen = (state) => {
    drawer.classList.toggle('-translate-x-full', !state);
    overlay.classList.toggle('hidden', !state);
    drawer.inert = !state;
    document.body.classList.toggle('overflow-hidden', state);
    openBtn.setAttribute('aria-expanded', String(state));
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));

  // Masaüstüne geçilirse çekmeceyi kapat
  window.matchMedia('(width >= 64rem)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}
