/**
 * Ürün listeleme sayfası (urunler.html)
 *
 *  - Filtreler: arama, kategori, marka, fiyat aralığı, sadece indirimliler
 *  - Sıralama: önerilen, fiyat, puan, yeni, çok satan
 *  - "Daha Fazla Göster" ile sayfalama
 *  - Filtreler adres çubuğuna yazılır: ?kategori=parke&sirala=fiyat-artan
 */
import { PRODUCTS, CATEGORIES, CATEGORY_GROUPS, GROUP_LABELS, loadCatalog } from '../store/catalog.js';
import { formatTL } from '../store/cart.js';

const PAGE_SIZE = 8;

const SORTS = {
  onerilen: { label: 'Önerilen', fn: null }, // veri sırası
  populer: { label: 'Çok Satanlar', fn: (a, b) => b.sales - a.sales },
  yeni: { label: 'En Yeniler', fn: (a, b) => b.addedAt.localeCompare(a.addedAt) },
  'fiyat-artan': { label: 'Fiyat: Düşükten Yükseğe', fn: (a, b) => a.price - b.price },
  'fiyat-azalan': { label: 'Fiyat: Yüksekten Düşüğe', fn: (a, b) => b.price - a.price },
  puan: { label: 'En Yüksek Puan', fn: (a, b) => b.rating - a.rating || b.reviews - a.reviews },
};

const BADGE_COLORS = { sale: 'bg-sale', new: 'bg-green-600', info: 'bg-brand-900' };

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Türkçe karakterleri de doğru küçültür, aramada "İ/ı" sorun çıkarmaz */
const normalize = (text) => text.toLocaleLowerCase('tr-TR').trim();

const HEART_SVG =
  '<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

/* ---------- Durum <-> adres çubuğu ---------- */

function readStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const list = (key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : []);

  // ?kategori=parke → laminat, masif, vinil, spc, lvt
  const categories = list('kategori').flatMap((c) => CATEGORY_GROUPS[c] ?? [c]).filter((c) => c in CATEGORIES);

  const sort = params.get('sirala');
  return {
    q: params.get('q') ?? '',
    categories,
    brands: list('marka'),
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    discounted: params.get('indirim') === '1',
    sort: sort in SORTS ? sort : 'onerilen',
  };
}

function writeStateToUrl(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.categories.length) params.set('kategori', state.categories.join(','));
  if (state.brands.length) params.set('marka', state.brands.join(','));
  if (state.min) params.set('min', state.min);
  if (state.max) params.set('max', state.max);
  if (state.discounted) params.set('indirim', '1');
  if (state.sort !== 'onerilen') params.set('sirala', state.sort);

  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

/* ---------- Filtreleme ---------- */

function applyFilters(state) {
  const q = normalize(state.q);
  const min = state.min === '' ? 0 : Number(state.min);
  const max = state.max === '' ? Infinity : Number(state.max);

  const result = PRODUCTS.filter((p) => {
    if (q && !normalize(`${p.name} ${p.brand} ${CATEGORIES[p.category]}`).includes(q)) return false;
    if (state.categories.length && !state.categories.includes(p.category)) return false;
    if (state.brands.length && !state.brands.includes(p.brand)) return false;
    if (p.price < min || p.price > max) return false;
    if (state.discounted && !p.oldPrice) return false;
    return true;
  });

  const sortFn = SORTS[state.sort].fn;
  return sortFn ? [...result].sort(sortFn) : result;
}

/** Seçili filtreye göre sayfa başlığı: "Laminat Parke", "Aksesuarlar", "Egger", "Çok Satanlar"... */
function listTitle(state) {
  const secili = [...state.categories].sort().join(',');
  const grup = Object.entries(CATEGORY_GROUPS).find(([, list]) => [...list].sort().join(',') === secili);
  const filtreYok = !state.q && !state.brands.length && !state.min && !state.max && !state.discounted;

  if (grup && state.categories.length > 1) return GROUP_LABELS[grup[0]];
  if (state.categories.length === 1) return CATEGORIES[state.categories[0]];
  if (!state.categories.length && state.brands.length === 1) return state.brands[0];
  if (!state.categories.length && filtreYok && state.sort === 'populer') return 'Çok Satanlar';
  if (!state.categories.length && filtreYok && state.sort === 'yeni') return 'Yeni Ürünler';
  if (!state.categories.length && !state.brands.length && state.discounted) return 'İndirimli Ürünler';
  return 'Tüm Ürünler';
}

/* ---------- Şablonlar ---------- */

 export function productCard(p) {
  const unit = p.unit ?? 'm²';
  const ratingWidth = `${(p.rating / 5) * 100}%`;
  const badge = p.badge
    ? `<span class="absolute top-2 left-2 z-10 rounded-sm px-2 py-0.5 text-[10px] font-semibold text-white ${BADGE_COLORS[p.badgeType] ?? 'bg-brand-900'}">${escapeHtml(p.badge)}</span>`
    : '';
  const price = p.oldPrice
    ? `<del class="text-[11px] text-gray-400">${formatTL(p.oldPrice)}</del>
       <ins class="text-sm font-bold text-sale no-underline">${formatTL(p.price)}/${unit}</ins>`
    : `<span class="text-sm font-bold">${formatTL(p.price)}/${unit}</span>`;

  return `
    <li class="relative flex flex-col rounded-md border border-gray-200 bg-white p-3 transition hover:shadow-lg">
      ${badge}
            <a href="/urun.html?id=${encodeURIComponent(p.id)}" class="block aspect-[2/1] overflow-hidden rounded-sm bg-gray-100">
        <img src="/images/products/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" class="size-full object-cover" />
      </a>
      <h3 class="mt-3 text-xs leading-snug font-semibold"><a href="/urun.html?id=${encodeURIComponent(p.id)}" class="hover:text-wood-600">${escapeHtml(p.name)}</a></h3>
      <p class="mt-0.5 text-[10px] text-gray-500">${escapeHtml(p.brand)}</p>
      <div class="mt-1.5 flex items-center gap-1.5 text-[10px] text-gray-500">
        <span class="relative inline-block leading-none" role="img" aria-label="5 üzerinden ${p.rating} puan">
          <span class="text-gray-300">★★★★★</span>
          <span class="absolute inset-0 overflow-hidden text-amber-400" style="width: ${ratingWidth}">★★★★★</span>
        </span>
        ${p.rating} (${p.reviews})
      </div>
      <p class="mt-1.5 flex items-baseline gap-2">${price}</p>
      <div class="mt-auto flex items-center gap-2 pt-3">
        <button type="button" data-add-to-cart data-id="${escapeHtml(p.id)}"
                data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}"
                data-image="${escapeHtml(p.image)}" data-price="${p.price}" data-unit="${unit}"
                class="h-9 flex-1 rounded bg-brand-900 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-80">Sepete Ekle</button>
        <button type="button" data-fav="${escapeHtml(p.id)}" aria-pressed="false" aria-label="Favorilere ekle"
                class="grid size-9 place-items-center rounded transition hover:text-sale aria-pressed:text-sale aria-pressed:[&_svg]:fill-current">
          ${HEART_SVG}
        </button>
      </div>
    </li>`;
}

function checkboxList(name, options, selected, counts) {
  return options
    .map(
      ({ value, label }) => `
      <li>
        <label class="flex cursor-pointer items-center gap-2.5 py-1 text-sm hover:text-wood-600">
          <input type="checkbox" name="${name}" value="${escapeHtml(value)}" ${selected.includes(value) ? 'checked' : ''}
                 class="size-4 accent-brand-900" />
          <span class="flex-1">${escapeHtml(label)}</span>
          <span class="text-[11px] text-gray-400">${counts[value] ?? 0}</span>
        </label>
      </li>`,
    )
    .join('');
}

/* ---------- Sayfa ---------- */

export async function initProductList() {
  const page = document.querySelector('[data-product-list]');
  if (!page) return;

  await loadCatalog(); // ürünler API'den (yoksa statik veriden)

  const form = page.querySelector('[data-filters]');
  const grid = page.querySelector('[data-products]');
  const countEl = page.querySelector('[data-result-count]');
  const emptyEl = page.querySelector('[data-empty]');
  const moreBtn = page.querySelector('[data-load-more]');
  const chipsEl = page.querySelector('[data-active-filters]');
  const sortSelect = page.querySelector('[data-sort]');
  const filterPanel = page.querySelector('[data-filter-panel]');
  const filterToggle = page.querySelector('[data-filter-toggle]');

  let state = readStateFromUrl();
  let visible = PAGE_SIZE;

  // Sıralama seçenekleri
  sortSelect.innerHTML = Object.entries(SORTS)
    .map(([value, { label }]) => `<option value="${value}">${label}</option>`)
    .join('');

  // Kategori ve marka listeleri (yanlarında ürün sayısı)
  const categoryCounts = {};
  const brandCounts = {};
  PRODUCTS.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    brandCounts[p.brand] = (brandCounts[p.brand] ?? 0) + 1;
  });
  const categoryOptions = Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }));
  const brandOptions = Object.keys(brandCounts)
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .map((b) => ({ value: b, label: b }));

  // Header'daki arama kutusunu mevcut aramayla doldur
  const headerSearch = document.getElementById('q');
  if (headerSearch) headerSearch.value = state.q;

  function syncForm() {
    form.querySelector('[data-category-list]').innerHTML = checkboxList('kategori', categoryOptions, state.categories, categoryCounts);
    form.querySelector('[data-brand-list]').innerHTML = checkboxList('marka', brandOptions, state.brands, brandCounts);
    form.elements.min.value = state.min;
    form.elements.max.value = state.max;
    form.elements.indirim.checked = state.discounted;
    sortSelect.value = state.sort;
  }

  function readForm() {
    const data = new FormData(form);
    return {
      ...state,
      categories: data.getAll('kategori'),
      brands: data.getAll('marka'),
      min: data.get('min') || '',
      max: data.get('max') || '',
      discounted: data.get('indirim') === 'on',
    };
  }

  function renderChips() {
    const chips = [];
    if (state.q) chips.push({ key: 'q', label: `"${state.q}"` });
    state.categories.forEach((c) => chips.push({ key: 'kategori', value: c, label: CATEGORIES[c] }));
    state.brands.forEach((b) => chips.push({ key: 'marka', value: b, label: b }));
    if (state.min || state.max) {
      chips.push({ key: 'fiyat', label: `${state.min ? formatTL(Number(state.min)) : '0 TL'} – ${state.max ? formatTL(Number(state.max)) : '∞'}` });
    }
    if (state.discounted) chips.push({ key: 'indirim', label: 'İndirimli' });

    chipsEl.hidden = chips.length === 0;
    chipsEl.innerHTML =
      chips
        .map(
          (c) => `
        <button type="button" data-remove-filter="${c.key}" data-value="${escapeHtml(c.value ?? '')}"
                class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white py-1 pr-2 pl-3 text-xs hover:border-brand-900">
          ${escapeHtml(c.label)}
          <span aria-hidden="true" class="text-gray-400">✕</span>
          <span class="sr-only">filtresini kaldır</span>
        </button>`,
        )
        .join('') +
      (chips.length > 1
        ? '<button type="button" data-clear-filters class="text-xs font-medium text-gray-500 underline hover:text-sale">Tümünü temizle</button>'
        : '');
  }

  function render() {
    const baslik = listTitle(state);
    page.querySelector('[data-list-title]').textContent = baslik;
    page.querySelector('[data-list-crumb]').textContent = baslik;
    document.title = `${baslik} | Soykök Ticaret`;
    const results = applyFilters(state);

    countEl.textContent = results.length;
    emptyEl.hidden = results.length > 0;
    grid.hidden = results.length === 0;
    grid.innerHTML = results.slice(0, visible).map(productCard).join('');

    const remaining = results.length - visible;
    moreBtn.hidden = remaining <= 0;
    moreBtn.textContent = `Daha Fazla Göster (${Math.max(remaining, 0)})`;

    renderChips();
  }

  function update(newState, { resetPage = true } = {}) {
    state = newState;
    if (resetPage) visible = PAGE_SIZE;
    writeStateToUrl(state);
    render();
  }

  // Olaylar
  form.addEventListener('change', () => update(readForm()));
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // fiyat alanında Enter
    update(readForm());
  });

  sortSelect.addEventListener('change', () => update({ ...state, sort: sortSelect.value }));

  moreBtn.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
  });

  chipsEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-filters]')) {
      update({ q: '', categories: [], brands: [], min: '', max: '', discounted: false, sort: state.sort });
      if (headerSearch) headerSearch.value = '';
      syncForm();
      return;
    }
    const chip = e.target.closest('[data-remove-filter]');
    if (!chip) return;

    const { removeFilter: key, value } = chip.dataset;
    const next = { ...state };
    if (key === 'q') {
      next.q = '';
      if (headerSearch) headerSearch.value = '';
    }
    if (key === 'kategori') next.categories = state.categories.filter((c) => c !== value);
    if (key === 'marka') next.brands = state.brands.filter((b) => b !== value);
    if (key === 'fiyat') Object.assign(next, { min: '', max: '' });
    if (key === 'indirim') next.discounted = false;
    update(next);
    syncForm();
  });

  page.querySelector('[data-empty-reset]')?.addEventListener('click', () => {
    update({ q: '', categories: [], brands: [], min: '', max: '', discounted: false, sort: 'onerilen' });
    if (headerSearch) headerSearch.value = '';
    syncForm();
  });

  // Mobilde filtre panelini aç/kapa
  filterToggle?.addEventListener('click', () => {
    const open = filterPanel.classList.toggle('max-lg:hidden') === false;
    filterToggle.setAttribute('aria-expanded', String(open));
  });

  syncForm();
  render();
}