/**
 * İletişim formu:
 *  - Alan doğrulama (Türkçe mesajlar)
 *  - Konu "Sipariş" / "İade" ise sipariş numarası alanı
 *  - Mesaj karakter sayacı, telefon biçimlendirme
 *  - ?konu=numune gibi adres parametresiyle konuyu önceden seçme
 *  - Honeypot ile basit spam koruması
 *
 * Şimdilik demo: gönderim taklit edilir. Backend ya da bir form servisi
 * (örn. Formspree, Web3Forms) bağlanınca sendMessage() içindeki TODO doldurulacak.
 */

const ORDER_SUBJECTS = ['siparis', 'iade'];

const MESSAGES = {
  valueMissing: 'Bu alan zorunludur.',
  typeMismatch: 'Geçerli bir e-posta adresi girin.',
  tooShort: 'Lütfen biraz daha ayrıntı yazın.',
};

function normalizePhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits && !digits.startsWith('0')) digits = '0' + digits;
  return digits;
}

function formatPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean).join(' ');
}

function validateField(field) {
  if (!field.name || field.disabled || !field.willValidate) return true;

  if (field.hasAttribute('data-phone')) {
    const ok = field.value === '' || /^05\d{9}$/.test(normalizePhone(field.value));
    field.setCustomValidity(ok ? '' : 'Geçerli bir cep telefonu girin (05XX XXX XX XX).');
  }

  const valid = field.checkValidity();
  field.setAttribute('aria-invalid', String(!valid));

  const errorEl = field.form.querySelector(`[data-error-for="${field.name}"]`);
  if (errorEl) {
    let message = '';
    if (!valid) {
      const v = field.validity;
      if (v.customError) message = field.validationMessage;
      else if (v.valueMissing && field.type === 'checkbox') message = 'Devam etmek için onay vermeniz gerekir.';
      else if (v.valueMissing && field.tagName === 'SELECT') message = 'Lütfen bir konu seçin.';
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

function showAlert(form, type, text) {
  const alert = form.querySelector('[data-form-alert]');
  alert.textContent = text;
  alert.hidden = false;
  alert.className = `rounded px-3 py-2.5 text-xs ${type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-sale'}`;
}

async function sendMessage(payload) {
  // TODO: gerçek gönderim. Örnek:
  // const res = await fetch('/api/contact', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Gönderilemedi');
  await new Promise((resolve) => setTimeout(resolve, 900)); // demo
  return payload;
}

export function initContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = [...form.querySelectorAll('input, select, textarea')].filter((f) => f.name !== 'website');
  const subject = form.elements.subject;
  const orderField = form.querySelector('[data-order-field]');
  const message = form.elements.message;
  const charCount = form.querySelector('[data-char-count]');
  const submitBtn = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');

  // Hata mesajlarını ekran okuyuculara bağla
  form.querySelectorAll('[data-error-for]').forEach((errorEl) => {
    errorEl.id = `contact-err-${errorEl.dataset.errorFor}`;
    form.elements[errorEl.dataset.errorFor]?.setAttribute('aria-describedby', errorEl.id);
  });

  // Alan bazlı doğrulama
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  // Telefon biçimlendirme
  form.elements.phone.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
  });

  // Konu → sipariş numarası alanı
  const toggleOrderField = () => {
    const show = ORDER_SUBJECTS.includes(subject.value);
    orderField.hidden = !show;
    orderField.disabled = !show;
  };
  subject.addEventListener('change', toggleOrderField);

  // Karakter sayacı
  const updateCount = () => {
    const len = message.value.length;
    charCount.textContent = `${len} / ${message.maxLength}`;
    charCount.classList.toggle('text-sale', len >= message.maxLength * 0.9);
  };
  message.addEventListener('input', updateCount);

  // ?konu=numune → konuyu önceden seç
  const presetSubject = new URLSearchParams(location.search).get('konu');
  if (presetSubject && [...subject.options].some((o) => o.value === presetSubject)) {
    subject.value = presetSubject;
    toggleOrderField();
  }

  // Gönder
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelector('[data-form-alert]').hidden = true;

    // Honeypot doluysa bot: sessizce "başarılı" göster, gönderme
    if (form.elements.website.value) {
      showAlert(form, 'success', 'Mesajınız alındı. Teşekkür ederiz!');
      form.reset();
      return;
    }

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const payload = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone ? normalizePhone(data.phone) : '',
      subject: data.subject,
      orderNumber: data.orderNumber?.toUpperCase() || '',
      message: data.message.trim(),
    };

    submitBtn.disabled = true;
    submitLabel.textContent = 'Gönderiliyor…';
    try {
      await sendMessage(payload);
      form.reset();
      toggleOrderField();
      updateCount();
      fields.forEach((f) => f.removeAttribute('aria-invalid'));
      showAlert(form, 'success', `Teşekkürler ${payload.name.split(' ')[0]}! Mesajınız alındı, en kısa sürede dönüş yapacağız.`);
    } catch (err) {
      console.error(err);
      showAlert(form, 'error', 'Mesajınız gönderilemedi. Lütfen tekrar deneyin ya da bizi telefonla arayın.');
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Mesajı Gönder';
    }
  });
}