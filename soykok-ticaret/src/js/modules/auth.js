/**
 * Hesap sayfası: Kayıt Ol / Giriş Yap sekmeleri ve form doğrulama.
 *
 * Şimdilik demo: formlar doğrulanır, üye "giriş yapmış" sayılır ve
 * siparişlerim sayfasına (ya da ?next= ile gelinen sayfaya) yönlendirilir.
 * Şifreler tarayıcıda HİÇBİR YERDE saklanmaz. Backend hazır olunca
 * submitRegister / submitLogin içindeki TODO kısmı API isteğine dönüşecek.
 */

import { saveProfile, signIn } from '../store/session.js';

const TABS = ['kayit', 'giris'];

/** Girişten sonra gidilecek sayfa: ?next=/odeme.html gibi (sadece site içi) */
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/siparislerim.html';
}

/* ---------- Yardımcılar ---------- */

const MESSAGES = {
  valueMissing: 'Bu alan zorunludur.',
  typeMismatch: 'Geçerli bir e-posta adresi girin.',
  tooShort: 'En az 8 karakter olmalıdır.',
};

const PASSWORD_RULES = {
  length: (v) => v.length >= 8,
  letter: (v) => /\p{L}/u.test(v), // Türkçe harfler dahil
  number: (v) => /\d/.test(v),
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
  const form = field.form;

  // Özel kurallar
  if (field.hasAttribute('data-phone')) {
    const ok = field.value === '' || /^05\d{9}$/.test(normalizePhone(field.value));
    field.setCustomValidity(ok ? '' : 'Geçerli bir cep telefonu girin (05XX XXX XX XX).');
  }
  if (field.hasAttribute('data-password-rules') && field.value) {
    const ok = Object.values(PASSWORD_RULES).every((rule) => rule(field.value));
    field.setCustomValidity(ok ? '' : 'Şifre en az 8 karakter olmalı, harf ve rakam içermelidir.');
  }
  if (field.dataset.match) {
    const other = form.elements[field.dataset.match];
    field.setCustomValidity(field.value && field.value !== other.value ? 'Şifreler eşleşmiyor.' : '');
  }

  const valid = field.checkValidity();
  field.setAttribute('aria-invalid', String(!valid));

  const errorEl = form.querySelector(`[data-error-for="${field.name}"]`);
  if (errorEl) {
    let message = '';
    if (!valid) {
      const v = field.validity;
      if (v.customError) message = field.validationMessage;
      else if (v.valueMissing && field.type === 'checkbox') message = 'Devam etmek için sözleşmeyi onaylamanız gerekir.';
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
  alert.className = `rounded px-3 py-2 text-xs ${type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-sale'}`;
}

/** Ağ isteğini taklit eder (backend gelince kaldırılacak) */
const fakeRequest = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

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

/* ---------- Formlar ---------- */

function initForm(form, onSubmit) {
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const submitBtn = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const defaultLabel = submitLabel.textContent;

  // Hata mesajlarını ekran okuyuculara bağla
  form.querySelectorAll('[data-error-for]').forEach((errorEl) => {
    errorEl.id = `${form.dataset.authForm}-err-${errorEl.dataset.errorFor}`;
    form.elements[errorEl.dataset.errorFor]?.setAttribute('aria-describedby', errorEl.id);
  });

  // Alandan çıkınca doğrula; hatalıysa yazarken güncelle
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  // Telefon biçimlendirme
  form.querySelectorAll('[data-phone]').forEach((input) =>
    input.addEventListener('input', () => (input.value = formatPhone(input.value))),
  );

  // Şifre kuralları göstergesi + tekrar alanını yeniden kontrol
  const pw = form.querySelector('[data-password-rules]');
  if (pw) {
    const hints = form.querySelectorAll('[data-password-hints] [data-rule]');
    pw.addEventListener('input', () => {
      hints.forEach((li) => (li.dataset.ok = String(PASSWORD_RULES[li.dataset.rule](pw.value))));
      const confirm = form.querySelector('[data-match]');
      if (confirm?.value) validateField(confirm);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelector('[data-form-alert]').hidden = true;

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Lütfen bekleyin…';
    try {
      await onSubmit(new FormData(form), form);
    } catch (err) {
      console.error(err);
      showAlert(form, 'error', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = defaultLabel;
    }
  });
}

async function submitRegister(data, form) {
  // TODO: backend hazır olunca:
  // await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ firstName, lastName, email, phone, password, marketingConsent }) });
  await fakeRequest();

  const firstName = data.get('firstName').trim();
  const email = data.get('email').trim();
  saveProfile({ firstName, lastName: data.get('lastName').trim(), email });
  signIn(email);

  form.reset();
  form.querySelectorAll('[data-rule]').forEach((li) => (li.dataset.ok = 'false'));
  showAlert(form, 'success', `Hoş geldiniz ${firstName}! Hesabınız oluşturuldu, yönlendiriliyorsunuz…`);
  setTimeout(() => window.location.assign(nextUrl()), 900);
}

async function submitLogin(data, form) {
  // TODO: backend hazır olunca:
  // const res = await fetch('/api/auth/login', { method: 'POST', credentials: 'include', ... });
  // Oturum, sunucunun verdiği HttpOnly çerezle tutulmalı; token'ı localStorage'a yazma.
  await fakeRequest();

  // DEMO: Şifre kontrol edilmez; backend gelince sunucu doğrulayacak.
  const user = signIn(data.get('email'), { remember: data.get('remember') === 'on' });
  form.elements.password.value = '';
  showAlert(form, 'success', `Hoş geldiniz ${user.firstName}! Yönlendiriliyorsunuz…`);
  setTimeout(() => window.location.assign(nextUrl()), 700);
}

/* ---------- Şifre göster/gizle ---------- */

function initPasswordToggles(page) {
  page.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const input = btn.parentElement.querySelector('input');
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
      btn.querySelector('[data-icon-show]').hidden = show;
      btn.querySelector('[data-icon-hide]').hidden = !show;
      input.focus();
    });
  });
}

/* ---------- Giriş noktası ---------- */

export function initAuth() {
  const page = document.querySelector('[data-auth-page]');
  if (!page) return;

  initTabs(page);
  initPasswordToggles(page);
  initForm(page.querySelector('[data-auth-form="register"]'), submitRegister);
  initForm(page.querySelector('[data-auth-form="login"]'), submitLogin);
}