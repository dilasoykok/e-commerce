/**
 * Hesap sayfası (hesap.html): Kayıt Ol / Giriş Yap sekmeleri.
 *
 * Formlar Keycloak'ın güvenli sayfasındadır; buradaki butonlar oraya yönlendirir.
 * Şifre bu siteye hiç gelmez. İşlem bitince ?next= ile gelinen sayfaya
 * (yoksa siparişlerim sayfasına) dönülür.
 */

import { loadUser, loginUrl, registerUrl } from '../store/session.js';

const TABS = ['kayit', 'giris'];

/** Girişten sonra gidilecek sayfa: ?next=/odeme.html gibi (sadece site içi) */
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/siparislerim.html';
}

/* ---------- Sekmeler ---------- */

function initTabs(page) {
  const tabs = [...page.querySelectorAll('[data-auth-tab]')];
  const panels = [...page.querySelectorAll('[data-auth-panel]')];

  const select = (name, { focus = false, updateHash = true } = {}) => {
    if (!TABS.includes(name)) name = 'kayit';

    tabs.forEach((tab) => {
      const active = tab.dataset.authTab === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => (panel.hidden = panel.dataset.authPanel !== name));

    if (updateHash) history.replaceState(null, '', `#${name}`);
    document.title = `${name === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'} | Soykök Ticaret`;
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => select(tab.dataset.authTab)));

  // Klavye: sol/sağ ok ile sekme değiştir
  page.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const current = TABS.indexOf(tabs.find((t) => t.getAttribute('aria-selected') === 'true').dataset.authTab);
    const next = TABS[(current + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
    select(next, { focus: true });
  });

  // "Zaten üye misiniz? Giriş yapın" gibi linkler
  page.querySelectorAll('[data-auth-switch]').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      select(link.dataset.authSwitch);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }),
  );

  // Adres #giris ise giriş sekmesiyle aç, yoksa kayıt
  select(location.hash.slice(1), { updateHash: false });
  window.addEventListener('hashchange', () => select(location.hash.slice(1), { updateHash: false }));
}

/* ---------- Giriş noktası ---------- */

export async function initAuth() {
  const page = document.querySelector('[data-auth-page]');
  if (!page) return;

  initTabs(page);

  const next = nextUrl();
  page.querySelectorAll('[data-auth-action="login"]').forEach((a) => (a.href = loginUrl(next)));
  page.querySelectorAll('[data-auth-action="register"]').forEach((a) => (a.href = registerUrl(next)));

  // Zaten giriş yapılmışsa bu sayfada durmaya gerek yok
  if (await loadUser()) location.replace(next);
}
