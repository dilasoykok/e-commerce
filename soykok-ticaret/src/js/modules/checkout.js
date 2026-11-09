import { cart, formatTL } from '../store/cart.js';
import { placeOrder } from '../store/order.js';
import { PROVINCES } from '../data/provinces.js';
import { getUser } from '../store/session.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Doğrulama ---------- */

const MESSAGES = {
  valueMissing: 'Bu alan zorunludur.',
  typeMismatch: 'Geçerli bir e-posta adresi girin.',
  tooShort: 'Lütfen daha ayrıntılı yazın.',
};

/** 05321234567 / 5321234567 / +90 532 123 45 67 → kabul */
function normalizePhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (!digits.startsWith('0')) digits = '0' + digits;
  return digits;
}

/** Yazarken 0532 123 45 67 biçimine getir */
function formatPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean).join(' ');
}

function validateField(field) {
  if (field.disabled || !field.willValidate) return true;

  // Özel kurallar
  if (field.name === 'phone') {
    const ok = field.value === '' || /^05\d{9}$/.test(normalizePhone(field.value));
    field.setCustomValidity(ok ? '' : 'Geçerli bir cep telefonu girin (05XX XXX XX XX).');
  }

  const valid = field.checkValidity();
  const errorEl = field.form.querySelector(`[data-error-for="${field.name}"]`);
  field.setAttribute('aria-invalid', String(!valid));

  if (errorEl) {
    let message = '';
    if (!valid) {
      const v = field.validity;
      if (v.customError) message = field.validationMessage;
      else if (v.valueMissing && field.type === 'checkbox') message = 'Devam etmek için sözleşmeleri onaylamanız gerekir.';
      else if (v.valueMissing && field.tagName === 'SELECT') message = 'Lütfen bir seçim yapın.';
      else if (v.patternMismatch) message = field.dataset.patternMsg || 'Geçersiz biçim.';
      else {
        const key = Object.keys(MESSAGES).find((k) => v[k]);
        message = key ? MESSAGES[key] : 'Geçersiz değer.';
      }
    }
    errorEl.textContent = message;
    errorEl.hidden = valid;
  }
  return valid;
}

/* ---------- Sayfa ---------- */

export function initCheckout() {
  const page = document.querySelector('[data-checkout-page]');
  if (!page) return;

  const form = document.getElementById('checkoutForm');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const corporateFields = form.querySelector('[data-corporate-fields]');
  const summaryList = page.querySelector('[data-summary-items]');
  const subtotalEl = page.querySelector('[data-sum-subtotal]');
  const shippingEl = page.querySelector('[data-sum-shipping]');
  const totalEl = page.querySelector('[data-sum-total]');
  const cargoPriceEl = page.querySelector('[data-cargo-price]');
  const alertEl = page.querySelector('[data-form-alert]');
  const submitBtn = page.querySelector('[data-submit]');
  const submitLabel = page.querySelector('[data-submit-label]');

  let placing = false;

  // Üye girişi yapılmışsa ad, soyad ve e-postayı doldur; sipariş hesaba bağlanır
  const user = getUser();
  if (user) {
    for (const key of ['firstName', 'lastName', 'email']) {
      if (form.elements[key] && !form.elements[key].value && user[key]) form.elements[key].value = user[key];
    }
  }
  page.querySelector('[data-guest-hint]')?.toggleAttribute('hidden', Boolean(user));
  let state = null;

  // İl listesi
  const citySelect = form.querySelector('[data-province-select]');
  [...PROVINCES]
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .forEach((name) => citySelect.add(new Option(name, name)));

  // Telefon biçimlendirme
  const phone = form.elements.phone;
  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
  });

  // Fatura türü: kurumsal alanları aç/kapa
  form.querySelectorAll('[name="invoiceType"]').forEach((radio) =>
    radio.addEventListener('change', () => {
      const corporate = form.elements.invoiceType.value === 'corporate';
      corporateFields.hidden = !corporate;
      corporateFields.disabled = !corporate;
    }),
  );

  // Hata mesajlarını ekran okuyucular için alanlara bağla
  form.querySelectorAll('[data-error-for]').forEach((errorEl) => {
    errorEl.id = `err-${errorEl.dataset.errorFor}`;
    form.elements[errorEl.dataset.errorFor]?.setAttribute('aria-describedby', errorEl.id);
  });

  // Alan bazlı doğrulama: alandan çıkınca kontrol et, hata varsa yazarken güncelle
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  // Teslimat yöntemi değişince özeti yeniden hesapla
  form.querySelectorAll('[name="delivery"]').forEach((r) => r.addEventListener('change', () => renderSummary()));

  const computeTotals = () => {
    const shipping = form.elements.delivery.value === 'store' ? 0 : state.shipping;
    return { subtotal: state.subtotal, shipping, total: state.subtotal + shipping };
  };

  function renderSummary() {
    if (!state) return;
    const totals = computeTotals();

    summaryList.innerHTML = state.items
      .map(
        (item) => `
        <li class="flex gap-3 py-3">
          <span class="relative shrink-0">
            <img src="/images/products/${escapeHtml(item.image)}" alt="" class="h-12 w-16 rounded bg-gray-100 object-cover" />
            <span class="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-900 px-1 text-[10px] font-semibold text-white">${item.qty}</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-xs leading-snug font-semibold">${escapeHtml(item.name)}</span>
            <span class="mt-0.5 block text-[10px] text-gray-500">${item.qty} ${item.unit ?? 'm²'} × ${formatTL(item.price)}</span>
          </span>
          <span class="text-xs font-bold">${formatTL(item.lineTotal)}</span>
        </li>`,
      )
      .join('');

    subtotalEl.textContent = formatTL(totals.subtotal);
    shippingEl.textContent = totals.shipping === 0 ? 'Ücretsiz' : formatTL(totals.shipping);
    shippingEl.classList.toggle('text-green-700', totals.shipping === 0);
    totalEl.textContent = formatTL(totals.total);

    cargoPriceEl.textContent = state.shipping === 0 ? 'Ücretsiz' : formatTL(state.shipping);
    cargoPriceEl.classList.toggle('text-green-700', state.shipping === 0);
  }

  cart.subscribe((s) => {
    if (placing) return; // sipariş sonrası sepet boşalınca yönlendirmeyi engelleme
    if (s.items.length === 0) {
      window.location.replace('/sepet.html');
      return;
    }
    state = s;
    renderSummary();
  });

  // Gönder
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (placing) return;

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      alertEl.textContent = 'Lütfen işaretli alanları kontrol edin.';
      alertEl.hidden = false;
      invalid[0].focus();
      return;
    }
    alertEl.hidden = true;

    const data = Object.fromEntries(new FormData(form));
    placing = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Sipariş oluşturuluyor…';

    try {
      await placeOrder({
        customer: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: normalizePhone(data.phone),
        },
        delivery: {
          method: data.delivery,
          city: data.city,
          district: data.district.trim(),
          address: data.address.trim(),
          postalCode: data.postalCode || '',
          note: data.note?.trim() || '',
        },
        invoice:
          data.invoiceType === 'corporate'
            ? { type: 'corporate', companyName: data.companyName, taxOffice: data.taxOffice, taxNumber: data.taxNumber }
            : { type: 'individual' },
        payment: { method: data.payment },
        marketingConsent: data.marketing === 'on',
        items: state.items,
        totals: computeTotals(),
      });

      cart.clear();
      window.location.href = '/siparis-tamamlandi.html';
    } catch (err) {
      console.error(err);
      placing = false;
      submitBtn.disabled = false;
      submitLabel.textContent = 'Siparişi Onayla';
      alertEl.textContent = 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.';
      alertEl.hidden = false;
    }
  });
}
