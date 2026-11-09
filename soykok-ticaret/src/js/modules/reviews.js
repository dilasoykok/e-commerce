/**
 * Ürün değerlendirmeleri (ürün detay sayfası)
 *
 *  - Tıklanabilir yıldızlarla puan verme (fare ve klavye ile)
 *  - Yorum formu doğrulama
 *  - Yorum listesi + ortalama puan ve yıldız dağılımı özeti
 *
 * Şimdilik demo: yorumlar yalnızca bu tarayıcıda (localStorage) saklanır.
 * Backend gelince loadReviews / saveReview API'ye bağlanacak ve yorumlar
 * yayınlanmadan önce onaydan (moderasyon) geçecek.
 */

const STORAGE_KEY = 'soykok-reviews';
const RATING_LABELS = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Depolama (geçici) ---------- */

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function loadReviews(productId) {
  const list = loadAll()[productId];
  return Array.isArray(list) ? list : [];
}

function saveReview(productId, review) {
  const all = loadAll();
  all[productId] = [review, ...(all[productId] ?? [])];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* gizli sekme vb. – yorum yalnızca bu oturumda görünür */
  }
  return all[productId];
}

/* ---------- Hesaplama ---------- */

/**
 * Ürün verisindeki mevcut puan (rating × reviews) ile bu tarayıcıda yazılan
 * yorumları birleştirir.
 */
function summarize(product, reviews) {
  const baseCount = product.reviews ?? 0;
  const baseTotal = (product.rating ?? 0) * baseCount;
  const count = baseCount + reviews.length;
  const total = baseTotal + reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = count ? total / count : 0;

  // Dağılım yalnızca yazılı yorumlardan hesaplanır (ürün verisinde dağılım bilgisi yok)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return { average: Math.round(average * 10) / 10, count, distribution };
}

/* ---------- Şablonlar ---------- */

const stars = (rating, size = 'text-sm') => `
  <span class="relative inline-block leading-none ${size}" role="img" aria-label="5 üzerinden ${rating} puan">
    <span class="text-gray-300">★★★★★</span>
    <span class="absolute inset-0 overflow-hidden text-amber-400" style="width: ${(rating / 5) * 100}%">★★★★★</span>
  </span>`;

function reviewItem(r) {
  const date = new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `
    <li class="py-5">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        ${stars(r.rating)}
        <strong class="text-sm">${escapeHtml(r.title || RATING_LABELS[r.rating])}</strong>
      </div>
      <p class="mt-2 text-sm leading-relaxed whitespace-pre-line text-gray-700">${escapeHtml(r.comment)}</p>
      <p class="mt-2 text-[11px] text-gray-500">${escapeHtml(r.name)} · ${date}</p>
    </li>`;
}

/* ---------- Yıldız seçici ---------- */

function initStarInput(form) {
  const group = form.querySelector('[data-star-input]');
  const radios = [...group.querySelectorAll('input[type="radio"]')];
  const labels = [...group.querySelectorAll('[data-star]')];
  const caption = form.querySelector('[data-star-caption]');

  // Yıldızları belirli bir puana kadar boya
  const paint = (value) => {
    labels.forEach((label) => {
      const on = Number(label.dataset.star) <= value;
      label.classList.toggle('text-amber-400', on);
      label.classList.toggle('text-gray-300', !on);
    });
    caption.textContent = value ? RATING_LABELS[value] : 'Puan seçin';
  };

  const selected = () => Number(radios.find((r) => r.checked)?.value ?? 0);

  labels.forEach((label) => {
    label.addEventListener('mouseenter', () => paint(Number(label.dataset.star)));
  });
  group.addEventListener('mouseleave', () => paint(selected()));
  radios.forEach((r) => r.addEventListener('change', () => paint(selected())));

  paint(0);
  return { reset: () => paint(0) };
}

/* ---------- Sayfa ---------- */

export function initReviews(page, product) {
  const section = page.querySelector('[data-reviews-panel]');
  if (!section) return;

  const form = section.querySelector('[data-review-form]');
  const list = section.querySelector('[data-review-list]');
  const empty = section.querySelector('[data-review-empty]');
  const alertEl = form.querySelector('[data-form-alert]');
  const starInput = initStarInput(form);

  let reviews = loadReviews(product.id);

  function render() {
    const s = summarize(product, reviews);

    // Özet kutusu
    section.querySelector('[data-avg]').textContent = s.average.toLocaleString('tr-TR', { minimumFractionDigits: 1 });
    section.querySelector('[data-avg-stars]').innerHTML = stars(s.average, 'text-xl');
    section.querySelector('[data-avg-count]').textContent = `${s.count} değerlendirme`;

    const max = Math.max(1, ...s.distribution.map((d) => d.count));
    section.querySelector('[data-distribution]').innerHTML = s.distribution
      .map(
        (d) => `
        <li class="flex items-center gap-2 text-xs">
          <span class="w-6 text-right text-gray-600">${d.star}★</span>
          <span class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <span class="block h-full rounded-full bg-amber-400" style="width: ${(d.count / max) * 100}%"></span>
          </span>
          <span class="w-5 text-gray-500">${d.count}</span>
        </li>`,
      )
      .join('');

    // Liste
    empty.hidden = reviews.length > 0;
    list.innerHTML = reviews.map(reviewItem).join('');

    // Sayfanın üstündeki puan ve sekme başlığı
    page.querySelector('[data-rating]').textContent = s.average;
    page.querySelector('[data-reviews]').textContent = `(${s.count} değerlendirme)`;
    page.querySelector('[data-stars]').style.width = `${(s.average / 5) * 100}%`;
    page.querySelector('[data-stars-wrap]').setAttribute('aria-label', `5 üzerinden ${s.average} puan`);
    page.querySelectorAll('[data-review-tab-count]').forEach((el) => (el.textContent = s.count));
  }

  // Doğrulama
  const showError = (name, message) => {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    el.textContent = message;
    el.hidden = !message;
    const field = form.querySelector(`[name="${name}"]`);
    if (field && field.type !== 'radio') field.setAttribute('aria-invalid', String(Boolean(message)));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alertEl.hidden = true;

    const data = new FormData(form);
    const rating = Number(data.get('rating') ?? 0);
    const name = String(data.get('name') ?? '').trim();
    const title = String(data.get('title') ?? '').trim();
    const comment = String(data.get('comment') ?? '').trim();

    const errors = {
      rating: rating >= 1 && rating <= 5 ? '' : 'Lütfen 1 ile 5 arasında bir puan seçin.',
      name: name.length >= 2 ? '' : 'Lütfen adınızı yazın.',
      comment: comment.length >= 10 ? '' : 'Yorumunuz en az 10 karakter olmalıdır.',
    };
    Object.entries(errors).forEach(([field, msg]) => showError(field, msg));

    const firstError = Object.keys(errors).find((k) => errors[k]);
    if (firstError) {
      form.querySelector(`[name="${firstError}"]`).focus();
      return;
    }

    reviews = saveReview(product.id, { rating, name, title, comment, date: new Date().toISOString() });
    form.reset();
    starInput.reset();
    render();

    alertEl.textContent = 'Teşekkürler! Değerlendirmeniz eklendi.';
    alertEl.hidden = false;
    list.firstElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Hata gösterilen alan düzeltilince hatayı kaldır
  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (name && form.querySelector(`[data-error-for="${name}"]`) && !form.querySelector(`[data-error-for="${name}"]`).hidden) {
      showError(name, '');
    }
  });

  render();
}
