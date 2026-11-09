/**
 * Ürün detay sayfası (urun.html?id=p1)
 *
 *  - Ürünü adresteki ?id= değerine göre products.js'ten bulur ve sayfayı doldurur
 *  - Görsel galerisi (küçük resimlere tıklayınca büyük görsel değişir)
 *  - m² hesaplayıcı: oda ölçüsü + fire payı → gereken m² ve paket sayısı
 *  - Miktar seçimi, sepete ekleme, sekmeler, benzer ürünler
 */
import { PRODUCTS, CATEGORIES, CATEGORY_GROUPS, PRODUCT_DETAILS, DEFAULT_DETAILS } from '../data/products.js';
import { formatTL } from '../store/cart.js';
import { productCard } from './product-list.js';
import { initReviews } from './reviews.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const BADGE_COLORS = { sale: 'bg-sale', new: 'bg-green-600', info: 'bg-brand-900' };

/** Ürünün bağlı olduğu üst kategori (örn. laminat → parke) */
function parentGroup(category) {
  return Object.entries(CATEGORY_GROUPS).find(([, list]) => list.includes(category))?.[0] ?? category;
}

/* ---------- Galeri ---------- */

function initGallery(page, images, name) {
  const main = page.querySelector('[data-gallery-main]');
  const thumbs = page.querySelector('[data-gallery-thumbs]');

  main.src = `/images/products/${images[0]}`;
  main.alt = name;

  if (images.length < 2) {
    thumbs.hidden = true;
    return;
  }

  thumbs.innerHTML = images
    .map(
      (img, i) => `
      <li>
        <button type="button" data-thumb="${i}" aria-label="${i + 1}. görseli göster" aria-current="${i === 0}"
                class="block aspect-[4/3] w-full overflow-hidden rounded border-2 border-transparent transition hover:border-gray-300 aria-[current=true]:border-brand-900">
          <img src="/images/products/${escapeHtml(img)}" alt="" class="size-full object-cover" loading="lazy" />
        </button>
      </li>`,
    )
    .join('');

  thumbs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-thumb]');
    if (!btn) return;
    main.src = `/images/products/${images[Number(btn.dataset.thumb)]}`;
    thumbs.querySelectorAll('[data-thumb]').forEach((b) => b.setAttribute('aria-current', String(b === btn)));
  });
}

/* ---------- Miktar ---------- */

function initQuantity(page) {
  const input = page.querySelector('#qty');
  const clamp = () => {
    const n = Math.floor(Number(input.value));
    input.value = Number.isFinite(n) ? Math.min(Math.max(n, 1), 999) : 1;
  };

  page.querySelector('[data-qty-dec]').addEventListener('click', () => {
    input.value = Number(input.value) - 1;
    clamp();
  });
  page.querySelector('[data-qty-inc]').addEventListener('click', () => {
    input.value = Number(input.value) + 1;
    clamp();
  });
  input.addEventListener('change', clamp);
  return input;
}

/* ---------- m² hesaplayıcı ---------- */

function initCalculator(page, product, details, qtyInput) {
  const box = page.querySelector('[data-calculator]');
  if ((product.unit ?? 'm²') !== 'm²') {
    box.hidden = true; // aksesuar / kimyasal gibi ürünlerde gösterme
    return;
  }

  const form = box.querySelector('form');
  const result = box.querySelector('[data-calc-result]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Not: form.elements.length formdaki alan SAYISINI verir; o yüzden alanları adıyla seçiyoruz
    const read = (name) => form.querySelector(`[name="${name}"]`).value;
    const width = Number(read('width').replace(',', '.'));
    const length = Number(read('length').replace(',', '.'));
    const waste = Number(read('waste'));

    if (!(width > 0) || !(length > 0)) {
      result.hidden = false;
      result.innerHTML = '<p class="text-xs text-sale">Lütfen en ve boy ölçülerini metre cinsinden girin.</p>';
      return;
    }

    const area = width * length;
    const needed = area * (1 + waste / 100);
    let total = needed;
    let boxesText = '';

    if (details.boxM2) {
      const boxes = Math.ceil(needed / details.boxM2);
      total = boxes * details.boxM2;
      boxesText = `<li class="flex justify-between"><span>Paket sayısı (${details.boxM2.toLocaleString('tr-TR')} m²/paket)</span><strong>${boxes} paket</strong></li>`;
    }

    // Sepet şimdilik tam sayı miktarla çalışıyor → yukarı yuvarla
    const qty = Math.ceil(total);
    const fmt = (n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

    result.hidden = false;
    result.innerHTML = `
      <ul class="space-y-1.5 text-xs text-gray-600">
        <li class="flex justify-between"><span>Oda alanı</span><strong>${fmt(area)} m²</strong></li>
        <li class="flex justify-between"><span>Fire payı (%${waste})</span><strong>+${fmt(needed - area)} m²</strong></li>
        ${boxesText}
        <li class="flex justify-between border-t border-gray-200 pt-1.5 text-sm text-brand-900"><span>Gereken miktar</span><strong>${qty} m²</strong></li>
        <li class="flex justify-between text-sm text-brand-900"><span>Tahmini tutar</span><strong>${formatTL(qty * product.price)}</strong></li>
      </ul>
      <button type="button" data-use-calc="${qty}"
              class="mt-3 h-9 w-full rounded border border-brand-900 text-xs font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white">
        Bu miktarı kullan (${qty} m²)
      </button>`;
  });

  result.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-use-calc]');
    if (!btn) return;
    qtyInput.value = btn.dataset.useCalc;
    qtyInput.dispatchEvent(new Event('change'));
    qtyInput.focus();
  });
}

/* ---------- Sekmeler ---------- */

function initTabs(page) {
  const tabs = [...page.querySelectorAll('[data-tab]')];
  const panels = [...page.querySelectorAll('[data-tab-panel]')];

  const select = (name) => {
    tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach((p) => (p.hidden = p.dataset.tabPanel !== name));
  };

  tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.tab)));

  // Başlıktaki yıldızlar gibi "data-goto-tab" linkleri ilgili sekmeyi açıp oraya kaydırır
  page.querySelectorAll('[data-goto-tab]').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      select(link.dataset.gotoTab);
      page.querySelector(`[data-tab="${link.dataset.gotoTab}"]`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );

  // Adres #degerlendirmeler ile açılırsa doğrudan yorumlar sekmesi
  select(location.hash === '#degerlendirmeler' ? 'yorum' : tabs[0].dataset.tab);
}

/* ---------- Sayfa ---------- */

export function initProductDetail() {
  const page = document.querySelector('[data-product-detail]');
  if (!page) return;

  const id = new URLSearchParams(location.search).get('id');
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    page.querySelector('[data-not-found]').hidden = false;
    document.title = 'Ürün bulunamadı | Soykök Ticaret';
    return;
  }

  const details = { ...DEFAULT_DETAILS, ...PRODUCT_DETAILS[product.id] };
  const unit = product.unit ?? 'm²';
  const categoryLabel = CATEGORIES[product.category];
  const set = (selector, value) => page.querySelectorAll(selector).forEach((el) => (el.textContent = value));

  page.querySelector('[data-content]').hidden = false;

  // Başlık ve meta
  document.title = `${product.name} | Soykök Ticaret`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', details.description);

  // Breadcrumb
  const categoryLink = page.querySelector('[data-crumb-category]');
  categoryLink.textContent = categoryLabel;
  categoryLink.href = `/urunler.html?kategori=${product.category}`;
  set('[data-crumb-name]', product.name);

  // Üst bilgiler
  set('[data-name]', product.name);
  set('[data-brand]', product.brand);
  set('[data-category]', categoryLabel);
  set('[data-rating]', product.rating);
  set('[data-reviews]', `(${product.reviews} değerlendirme)`);
  page.querySelector('[data-stars]').style.width = `${(product.rating / 5) * 100}%`;
  page.querySelector('[data-stars-wrap]').setAttribute('aria-label', `5 üzerinden ${product.rating} puan`);
  set('[data-sku]', product.id.toUpperCase());

  // Etiket
  const badge = page.querySelector('[data-badge]');
  if (product.badge) {
    badge.textContent = product.badge;
    badge.classList.add(BADGE_COLORS[product.badgeType] ?? 'bg-brand-900');
    badge.hidden = false;
  }

  // Fiyat
  const priceEl = page.querySelector('[data-price]');
  priceEl.textContent = `${formatTL(product.price)} / ${unit}`;
  if (product.oldPrice) {
    priceEl.classList.add('text-sale');
    const old = page.querySelector('[data-old-price]');
    old.textContent = formatTL(product.oldPrice);
    old.hidden = false;
    const save = page.querySelector('[data-saving]');
    save.textContent = `%${Math.round((1 - product.price / product.oldPrice) * 100)} indirim`;
    save.hidden = false;
  }
  set('[data-unit]', unit);

  // Paket bilgisi
  if (details.boxM2) {
    const pack = page.querySelector('[data-pack]');
    pack.textContent = `1 paket = ${details.boxM2.toLocaleString('tr-TR')} m²`;
    pack.hidden = false;
  }

  // Öne çıkanlar
  page.querySelector('[data-features]').innerHTML = details.features
    .map((f) => `<li class="flex items-center gap-2"><span class="text-green-600" aria-hidden="true">✓</span>${escapeHtml(f)}</li>`)
    .join('');

  // Sepete ekle / favori butonlarına ürün bilgilerini yaz
  const addBtn = page.querySelector('[data-add-to-cart]');
  Object.assign(addBtn.dataset, {
    id: product.id,
    name: product.name,
    brand: product.brand,
    image: product.image,
    price: String(product.price),
    unit,
  });
  page.querySelector('[data-fav]').dataset.fav = product.id;

  // Sekme içerikleri
  page.querySelector('[data-description]').textContent = details.description;
  const specs = { Marka: product.brand, Kategori: categoryLabel, ...details.specs };
  page.querySelector('[data-specs]').innerHTML = Object.entries(specs)
    .map(
      ([k, v]) => `
      <tr class="odd:bg-gray-50">
        <th scope="row" class="w-2/5 px-4 py-2.5 text-left font-medium text-gray-600">${escapeHtml(k)}</th>
        <td class="px-4 py-2.5">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join('');

  // Benzer ürünler: aynı kategori → aynı üst kategori → diğerleri
  const group = parentGroup(product.category);
  const related = PRODUCTS.filter((p) => p.id !== product.id)
    .map((p) => ({ p, score: p.category === product.category ? 2 : parentGroup(p.category) === group ? 1 : 0 }))
    .sort((a, b) => b.score - a.score || b.sales - a.sales)
    .slice(0, 4)
    .map(({ p }) => p);
  page.querySelector('[data-related]').innerHTML = related.map(productCard).join('');
  page.querySelector('[data-related-link]').href = `/urunler.html?kategori=${group}`;

  initGallery(page, details.images ?? [product.image], product.name);
  const qtyInput = initQuantity(page);
  initCalculator(page, product, details, qtyInput);
  initTabs(page);
  initReviews(page, product);
}
