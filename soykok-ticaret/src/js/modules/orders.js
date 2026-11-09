/**
 * Siparişlerim / Sipariş Takibi sayfası (siparislerim.html)
 *
 *  - Üye girişi yapılmışsa: hesaba ait tüm siparişler listelenir
 *  - Giriş yapılmamışsa: sipariş numarası + e-posta ile sorgulanır
 *  - ?no=SYK-... ile gelinirse numara alanı dolu gelir (üyede o sipariş açık gelir)
 */
import { formatTL } from '../store/cart.js';
import { findOrder, getOrdersOf, getOrderStage, STAGES } from '../store/order.js';
import { getUser, signOut } from '../store/session.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const DELIVERY_LABELS = { cargo: 'Kargo ile adrese teslim', store: 'Mağazadan teslim al' };
const PAYMENT_LABELS = { card: 'Kredi / Banka Kartı', transfer: 'Havale / EFT' };

const formatDate = (iso) =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function statusBadge(order) {
  if (order.status === 'awaiting_transfer') {
    return '<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Ödeme Bekleniyor</span>';
  }
  const stage = getOrderStage(order);
  const stageInfo = STAGES[stage];
  const label = order.delivery.method === 'store' && stageInfo.storeLabel ? stageInfo.storeLabel : stageInfo.label;
  const color = stage === STAGES.length - 1 ? 'bg-green-100 text-green-700' : 'bg-brand-900/10 text-brand-900';
  return `<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}">${label}</span>`;
}

function timeline(order) {
  const current = getOrderStage(order);
  const steps = STAGES.map((s, i) => {
    const label = order.delivery.method === 'store' && s.storeLabel ? s.storeLabel : s.label;
    const done = i <= current;
    const dot = done
      ? '<span class="grid size-7 place-items-center rounded-full bg-green-600 text-xs font-bold text-white" aria-hidden="true">✓</span>'
      : `<span class="grid size-7 place-items-center rounded-full border-2 border-gray-300 bg-white text-xs text-gray-400" aria-hidden="true">${i + 1}</span>`;
    const line =
      i < STAGES.length - 1
        ? `<span class="absolute top-3.5 left-[calc(50%+1rem)] hidden h-0.5 w-[calc(100%-2rem)] sm:block ${i < current ? 'bg-green-600' : 'bg-gray-200'}" aria-hidden="true"></span>`
        : '';
    return `
      <li class="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center" ${i === current ? 'aria-current="step"' : ''}>
        ${dot}${line}
        <span class="text-xs ${done ? 'font-semibold text-brand-900' : 'text-gray-400'}">${label}</span>
      </li>`;
  }).join('');

  const transferNote =
    order.status === 'awaiting_transfer'
      ? `<p class="mt-4 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
           Havale/EFT ödemeniz bekleniyor. Ödeme açıklamasına sipariş numaranızı (<strong>${escapeHtml(order.number)}</strong>) yazmayı unutmayın;
           ödeme hesabımıza geçince siparişiniz hazırlanmaya başlar.
         </p>`
      : '';

  return `<ol class="flex flex-col gap-4 sm:flex-row sm:gap-0" aria-label="Sipariş durumu">${steps}</ol>${transferNote}`;
}

function orderDetails(order) {
  const items = order.items
    .map(
      (item) => `
      <li class="flex items-center gap-3 py-3">
        <img src="/images/products/${escapeHtml(item.image)}" alt="" class="h-12 w-16 shrink-0 rounded bg-gray-100 object-cover" />
        <span class="min-w-0 flex-1">
          <a href="/urun.html?id=${encodeURIComponent(item.id)}" class="block text-xs font-semibold hover:text-wood-600">${escapeHtml(item.name)}</a>
          <span class="block text-[10px] text-gray-500">${item.qty} ${escapeHtml(item.unit ?? 'm²')} × ${formatTL(item.price)}</span>
        </span>
        <span class="text-xs font-bold">${formatTL(item.lineTotal)}</span>
      </li>`,
    )
    .join('');

  return `
    <div class="border-t border-gray-100 p-5">
      ${timeline(order)}
      <dl class="mt-6 grid gap-3 text-xs sm:grid-cols-3">
        <div><dt class="text-gray-500">Teslimat</dt><dd class="font-semibold">${DELIVERY_LABELS[order.delivery.method] ?? '-'}</dd></div>
        <div><dt class="text-gray-500">Ödeme</dt><dd class="font-semibold">${PAYMENT_LABELS[order.payment.method] ?? '-'}</dd></div>
        <div><dt class="text-gray-500">Sipariş Tarihi</dt><dd class="font-semibold">${formatDate(order.createdAt)}</dd></div>
      </dl>
      <ul class="mt-4 divide-y divide-gray-100 border-t border-gray-200">${items}</ul>
      <dl class="mt-2 space-y-1.5 border-t border-gray-200 pt-3 text-xs">
        <div class="flex justify-between"><dt class="text-gray-600">Ara Toplam</dt><dd class="font-semibold">${formatTL(order.totals.subtotal)}</dd></div>
        <div class="flex justify-between"><dt class="text-gray-600">Kargo</dt><dd class="font-semibold">${order.totals.shipping === 0 ? 'Ücretsiz' : formatTL(order.totals.shipping)}</dd></div>
        <div class="flex justify-between text-sm"><dt class="font-bold">Toplam</dt><dd class="font-bold">${formatTL(order.totals.total)}</dd></div>
      </dl>
      ${order.demo ? '<p class="mt-4 text-[10px] text-gray-400">Demo sipariş: durum, sipariş üzerinden geçen süreye göre otomatik ilerler.</p>' : ''}
    </div>`;
}

function orderHeader(order) {
  const count = order.items.length;
  return `
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 p-5">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold">${escapeHtml(order.number)}</p>
        <p class="text-[11px] text-gray-500">${formatDate(order.createdAt)} · ${count} ürün</p>
      </div>
      ${statusBadge(order)}
      <p class="text-sm font-bold">${formatTL(order.totals.total)}</p>
    </div>`;
}

/* ---------- Üye görünümü ---------- */

function renderMember(page, user, openNo) {
  page.querySelector('[data-member-view]').hidden = false;
  page.querySelector('[data-orders-crumb]').textContent = 'Siparişlerim';
  document.title = 'Siparişlerim | Soykök Ticaret';
  page.querySelector('[data-user-name]').textContent = user.firstName;
  page.querySelector('[data-user-email]').textContent = user.email;

  const orders = getOrdersOf(user.email);
  page.querySelector('[data-orders-empty]').hidden = orders.length > 0;

  page.querySelector('[data-order-list]').innerHTML = orders
    .map(
      (order, i) => `
      <li>
        <details class="group overflow-hidden rounded-md border border-gray-200 bg-white open:shadow-md" ${order.number === openNo || (!openNo && i === 0) ? 'open' : ''}>
          <summary class="cursor-pointer list-none hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
            ${orderHeader(order)}
          </summary>
          ${orderDetails(order)}
        </details>
      </li>`,
    )
    .join('');

  page.querySelector('[data-logout]').addEventListener('click', () => {
    signOut();
    window.location.assign('/siparislerim.html');
  });
}

/* ---------- Misafir görünümü ---------- */

function renderGuest(page, prefillNo) {
  page.querySelector('[data-guest-view]').hidden = false;
  document.title = 'Sipariş Takibi | Soykök Ticaret';

  const form = page.querySelector('[data-track-form]');
  const alertEl = page.querySelector('[data-track-alert]');
  const result = page.querySelector('[data-track-result]');

  if (prefillNo) form.elements.number.value = prefillNo;
  (prefillNo ? form.elements.email : form.elements.number).focus();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alertEl.hidden = true;
    result.innerHTML = '';

    const number = form.elements.number.value.trim();
    const email = form.elements.email.value.trim();
    if (!number || !form.elements.email.checkValidity() || !email) {
      alertEl.textContent = 'Lütfen sipariş numaranızı ve geçerli bir e-posta adresi girin.';
      alertEl.hidden = false;
      return;
    }

    const order = findOrder(number, email);
    if (!order) {
      // Hangisinin yanlış olduğunu söylemiyoruz: başkasının siparişini tahmin etmeyi zorlaştırır
      alertEl.textContent = 'Bu bilgilerle eşleşen bir sipariş bulunamadı. Numarayı ve e-postayı kontrol edin.';
      alertEl.hidden = false;
      return;
    }

    result.innerHTML = `
      <div class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        ${orderHeader(order)}
        ${orderDetails(order)}
      </div>`;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function initOrders() {
  const page = document.querySelector('[data-orders-page]');
  if (!page) return;

  const no = (new URLSearchParams(location.search).get('no') ?? '').trim().toUpperCase();
  const user = getUser();
  if (user) renderMember(page, user, no);
  else renderGuest(page, no);
}
