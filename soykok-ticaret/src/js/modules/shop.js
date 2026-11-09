import { cart } from '../store/cart.js';
import { openCart } from './cart-ui.js';

export function initShop() {
  const favBadge = document.querySelector('[data-fav-count]');
  const favorites = new Set();

  document.addEventListener('click', (e) => {
    // Sepete ekle: ürün bilgileri butonun data-* özelliklerinden okunur
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn && !addBtn.disabled) {
    const { id, name, brand, image, price, unit } = addBtn.dataset;
      // Ürün detay sayfasında miktar kutusu varsa onu kullan
      const qtyInput = addBtn.dataset.qtyFrom ? document.querySelector(addBtn.dataset.qtyFrom) : null;
      const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;
      cart.add({ id, name, brand, image, price: Number(price), unit }, qty);

      const original = addBtn.textContent;
      addBtn.textContent = 'Sepete Eklendi ✓';
      addBtn.disabled = true;
      setTimeout(() => {
        addBtn.textContent = original;
        addBtn.disabled = false;
      }, 1200);

      openCart();
      return;
    }

    // Favori
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      const active = !favorites.has(id);
      active ? favorites.add(id) : favorites.delete(id);

      favBtn.setAttribute('aria-pressed', String(active));
      favBtn.setAttribute('aria-label', active ? 'Favorilerden çıkar' : 'Favorilere ekle');
      if (favBadge) favBadge.textContent = favorites.size;
    }
  });
}
