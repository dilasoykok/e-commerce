export function initNewsletter() {
  document.querySelectorAll('[data-newsletter]').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const msg = form.parentElement.querySelector('[data-newsletter-msg]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = input.value.trim() !== '' && input.checkValidity();

      input.setAttribute('aria-invalid', String(!ok));
      msg.hidden = false;
      msg.textContent = ok
        ? 'Teşekkürler! Bültenimize abone oldunuz.'
        : 'Lütfen geçerli bir e-posta adresi girin.';
      msg.classList.toggle('text-green-700', ok);
      msg.classList.toggle('text-sale', !ok);

      if (ok) {
        // TODO: backend hazır olduğunda e-postayı burada API'ye gönder
        form.reset();
      }
    });
  });
}
