import { formatTL } from '../store/cart.js';
import { getLastOrder } from '../store/order.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const DELIVERY_LABELS = { cargo: 'Kargo ile adrese teslim', store: 'Mağazadan teslim al' };
const PAYMENT_LABELS = { card: 'Kredi / Banka Kartı', transfer: 'Havale / EFT (ödeme bekleniyor)' };

export function initOrderSuccess() {
  const page = document.querySelector('[data-order-success]');
  if (!page) return;

  const order = getLastOrder();
  if (!order) {
    page.querySelector('[data-order-missing]').hidden = false;
    return;
  }

  const set = (selector, text) => page.querySelectorAll(selector).forEach((el) => (el.textContent = text));

  page.querySelector('[data-order-content]').hidden = false;
  set('[data-order-name]', order.customer.firstName);
  set('[data-order-number]', order.number);
  set('[data-order-email]', order.customer.email);
  set('[data-order-delivery]', DELIVERY_LABELS[order.delivery.method] ?? '');
  set('[data-order-payment]', PAYMENT_LABELS[order.payment.method] ?? '');
  set('[data-order-subtotal]', formatTL(order.totals.subtotal));
  set('[data-order-shipping]', order.totals.shipping === 0 ? 'Ücretsiz' : formatTL(order.totals.shipping));
  set('[data-order-total]', formatTL(order.totals.total));
  set('[data-transfer-amount]', formatTL(order.totals.total));
  page.querySelectorAll('[data-track-link]').forEach((a) => (a.href = `/siparislerim.html?no=${encodeURIComponent(order.number)}`));

  page.querySelector('[data-order-demo]').hidden = !order.demo;
  page.querySelector('[data-transfer-info]').hidden = order.payment.method !== 'transfer';

  page.querySelector('[data-order-items]').innerHTML = order.items
    .map(
      (item) => `
      <li class="flex items-center gap-3 py-3">
        <img src="/images/products/${escapeHtml(item.image)}" alt="" class="h-12 w-16 shrink-0 rounded bg-gray-100 object-cover" />
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-semibold">${escapeHtml(item.name)}</span>
          <span class="block text-[10px] text-gray-500">${item.qty} ${item.unit ?? 'm²'} × ${formatTL(item.price)}</span>
        </span>
        <span class="text-xs font-bold">${formatTL(item.lineTotal)}</span>
      </li>`,
    )
    .join('');
}
