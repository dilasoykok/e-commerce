import { cart, formatTL } from '../store/cart.js';
import { bindCartActions, qtyStepper, shippingProgress, ICONS } from './cart-ui.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function initCartPage() {
  const root = document.querySelector('[data-cart-page]');
  if (!root) return;

  const content = root.querySelector('[data-cart-content]');
  const empty = root.querySelector('[data-cart-empty]');
  const list = root.querySelector('[data-cart-page-items]');
  const progress = root.querySelector('[data-cart-progress]');
  const countEl = root.querySelector('[data-cart-page-count]');
  const subtotalEl = root.querySelector('[data-cart-subtotal]');
  const shippingEl = root.querySelector('[data-cart-shipping]');
  const totalEl = root.querySelector('[data-cart-total]');

  bindCartActions(list);

  root.querySelector('[data-cart-clear]')?.addEventListener('click', () => {
    if (confirm('Sepetteki tüm ürünler silinsin mi?')) cart.clear();
  });

  cart.subscribe((state) => {
    const hasItems = state.items.length > 0;
    content.hidden = !hasItems;
    empty.hidden = hasItems;
    countEl.textContent = state.count;
    if (!hasItems) return;

    progress.innerHTML = shippingProgress(state);

    list.innerHTML = state.items
      .map(
        (item) => `
        <li class="grid grid-cols-[80px_1fr_auto] gap-x-4 gap-y-3 py-5 md:grid-cols-[96px_1fr_110px_150px_110px_36px] md:items-center">
          <img src="/images/products/${escapeHtml(item.image)}" alt="" class="row-span-2 h-16 w-20 rounded bg-gray-100 object-cover md:row-span-1 md:h-[72px] md:w-24" />

          <div class="min-w-0">
            <p class="text-sm leading-snug font-semibold">${escapeHtml(item.name)}</p>
            <p class="mt-0.5 text-xs text-gray-500">${escapeHtml(item.brand)}</p>
          </div>

          <p class="hidden text-sm md:block">${formatTL(item.price)}<span class="text-xs text-gray-500">/${item.unit ?? 'm²'}</span></p>

          <div class="col-start-2 md:col-start-auto">${qtyStepper(item)}</div>

          <p class="col-start-3 row-start-2 self-center text-right text-sm font-bold md:col-start-auto md:row-start-auto">${formatTL(item.lineTotal)}</p>

          <button type="button" data-remove data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} ürününü sepetten çıkar"
                  class="col-start-3 row-start-1 grid size-8 place-items-center justify-self-end rounded text-gray-400 transition hover:bg-gray-100 hover:text-sale md:col-start-auto md:row-start-auto">${ICONS.trash}</button>
        </li>`,
      )
      .join('');

    subtotalEl.textContent = formatTL(state.subtotal);
    shippingEl.textContent = state.shipping === 0 ? 'Ücretsiz' : formatTL(state.shipping);
    shippingEl.classList.toggle('text-green-700', state.shipping === 0);
    totalEl.textContent = formatTL(state.total);
  });
}
