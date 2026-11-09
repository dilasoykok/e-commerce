import { getUser } from '../store/session.js';

/**
 * Header'daki "Hesabım" linki: giriş yapılmışsa üyenin adını gösterir
 * ve siparişlerim sayfasına gider.
 */
export function initAccountLink() {
  const user = getUser();
  if (!user) return;

  document.querySelectorAll('[data-account-link]').forEach((link) => {
    link.href = '/siparislerim.html';
    const label = link.querySelector('[data-account-label]');
    if (label) label.textContent = user.firstName;
  });
}
