import { getUser, loadUser } from '../store/session.js';

/**
 * Header'daki "Hesabım" linki: giriş yapılmışsa üyenin adını gösterir
 * ve siparişlerim sayfasına gider. Önce önbellekteki bilgiyle hemen,
 * sonra sunucudan gelen güncel bilgiyle günceller.
 */
export async function initAccountLink() {
  const links = [...document.querySelectorAll('[data-account-link]')].map((link) => {
    const label = link.querySelector('[data-account-label]');
    return { link, label, href: link.getAttribute('href'), text: label?.textContent };
  });
  if (!links.length) return;

  const apply = (user) =>
    links.forEach(({ link, label, href, text }) => {
      link.href = user ? '/siparislerim.html' : href;
      if (label) label.textContent = user ? user.firstName : text;
    });

  apply(getUser());
  apply(await loadUser());
}
