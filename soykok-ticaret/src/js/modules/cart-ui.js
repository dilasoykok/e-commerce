import { cart, formatTL, FREE_SHIPPING_LIMIT } from '../store/cart.js';

/* ---------- Yardımcılar ---------- */

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Dinamik eklenen HTML'de lucide çalışmadığı için küçük ikonlar satır içi SVG
const svg = (paths, cls = 'size-4') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  minus: svg('<path d="M5 12h14"/>', 'size-3.5'),
  plus: svg('<path d="M5 12h14"/><path d="M12 5v14"/>', 'size-3.5'),
  trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>'),
};

export function qtyStepper(item) {
  return `
    <div class="inline-flex items-center">
      <div class="inline-flex h-8 items-center overflow-hidden rounded border border-gray-300 bg-white">
        <button type="button" data-qty="dec" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} miktarını azalt"
                class="grid h-full w-8 place-items-center transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40" ${item.qty <= 1 ? 'disabled' : ''}>${ICONS.minus}</button>
        <input type="number" min="1" max="999" inputmode="numeric" value="${item.qty}"
               data-qty-input data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} miktarı (${item.unit ?? 'm²'})"
               class="h-full w-11 border-x border-gray-300 text-center text-xs font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" data-qty="inc" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} miktarını artır"
                class="grid h-full w-8 place-items-center transition hover:bg-gray-100">${ICONS.plus}</button>
      </div>
      <span class="ml-1.5 text-[10px] text-gray-500">${item.unit ?? 'm²'}</span>
    </div>`;
}

export function shippingProgress(state) {
  const reached = state.remainingForFreeShipping === 0;
  return `
    <p class="text-[11px] ${reached ? 'font-semibold text-green-700' : 'text-gray-600'}">
      ${reached
        ? 'Kargonuz ücretsiz!'
        : `Ücretsiz kargo için <strong class="text-brand-900">${formatTL(state.remainingForFreeShipping)}</strong> daha ekleyin.`}
    </p>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200" role="progressbar"
         aria-valuemin="0" aria-valuemax="${FREE_SHIPPING_LIMIT}" aria-valuenow="${Math.round(state.subtotal)}"
         aria-label="Ücretsiz kargo ilerlemesi">
      <div class="h-full rounded-full ${reached ? 'bg-green-600' : 'bg-wood-500'} transition-all" style="width: ${state.freeShippingProgress}%"></div>
    </div>`;
}

/** Miktar butonları, input ve silme butonları için olay dinleyicileri (event delegation). */
export function bindCartActions(container) {
  container.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      cart.increment(qtyBtn.dataset.id, qtyBtn.dataset.qty === 'inc' ? 1 : -1);
      return;
    }
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) cart.remove(removeBtn.dataset.id);
  });

  container.addEventListener('change', (e) => {
    const input = e.target.closest('[data-qty-input]');
    if (input) cart.setQty(input.dataset.id, input.value);
  });
}

/* ---------- Header rozeti ---------- */

export function initCartBadge() {
  const badges = document.querySelectorAll('[data-cart-count]');
  cart.subscribe((state) => {
    badges.forEach((badge) => (badge.textContent = state.count));
  });
}

/* ---------- Sağdan açılan mini sepet ---------- */

let openDrawer = () => {};
export const openCart = () => openDrawer();

export function initCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer) return; // sepet sayfasında çekmece yok, link doğrudan sayfaya gider

  const list = drawer.querySelector('[data-cart-items]');
  const empty = drawer.querySelector('[data-cart-empty]');
  const footer = drawer.querySelector('[data-cart-footer]');
  const progress = drawer.querySelector('[data-cart-progress]');
  const titleCount = drawer.querySelector('[data-cart-title-count]');
  const subtotalEl = drawer.querySelector('[data-cart-subtotal]');
  const shippingEl = drawer.querySelector('[data-cart-shipping]');
  const totalEl = drawer.querySelector('[data-cart-total]');
  const closeBtn = drawer.querySelector('[data-cart-close]');
  let lastFocused = null;

  const setOpen = (state) => {
    drawer.classList.toggle('translate-x-full', !state);
    overlay.classList.toggle('hidden', !state);
    drawer.inert = !state;
    document.body.classList.toggle('overflow-hidden', state);
    document.querySelectorAll('[data-cart-open]').forEach((el) => el.setAttribute('aria-expanded', String(state)));

    if (state) {
      lastFocused = document.activeElement;
      closeBtn.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  };
  openDrawer = () => setOpen(true);

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener) {
      e.preventDefault();
      setOpen(true);
    }
  });
  closeBtn.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('[data-cart-dismiss]').forEach((el) => el.addEventListener('click', () => setOpen(false)));
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.inert) setOpen(false);
  });

  bindCartActions(list);

  cart.subscribe((state) => {
    const hasItems = state.items.length > 0;
    titleCount.textContent = state.count;
    empty.hidden = hasItems;
    list.hidden = !hasItems;
    footer.hidden = !hasItems;
    progress.hidden = !hasItems;
    if (!hasItems) return;

    progress.innerHTML = shippingProgress(state);
    list.innerHTML = state.items
      .map(
        (item) => `
        <li class="flex gap-3 py-4">
          <img src="/images/products/${escapeHtml(item.image)}" alt="" class="h-14 w-20 shrink-0 rounded bg-gray-100 object-cover" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-xs leading-snug font-semibold">${escapeHtml(item.name)}</p>
                <p class="mt-0.5 text-[10px] text-gray-500">${escapeHtml(item.brand)} · ${formatTL(item.price)}/${item.unit ?? 'm²'}</p>
              </div>
              <button type="button" data-remove data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} ürününü sepetten çıkar"
                      class="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-sale">${ICONS.trash}</button>
            </div>
            <div class="mt-2 flex items-center justify-between gap-2">
              ${qtyStepper(item)}
              <p class="text-sm font-bold">${formatTL(item.lineTotal)}</p>
            </div>
          </div>
        </li>`,
      )
      .join('');

    subtotalEl.textContent = formatTL(state.subtotal);
    shippingEl.textContent = state.shipping === 0 ? 'Ücretsiz' : formatTL(state.shipping);
    shippingEl.classList.toggle('text-green-700', state.shipping === 0);
    totalEl.textContent = formatTL(state.total);
  });
}
