/**
 * Ana sayfadaki kayan ürün listeleri.
 *
 * Kullanım (HTML):
 *   <div data-product-slider="indirim"> ... </div>   → eski fiyatı olan ürünler
 *   <div data-product-slider="yeni"> ... </div>      → en son eklenen ürünler
 *   <div data-product-slider="populer"> ... </div>   → en çok satanlar
 *
 * İçinde data-slider-track (ul), data-slider-prev, data-slider-next ve
 * data-slider-dots bulunmalı. data-limit="10" ile ürün sayısı sınırlanabilir.
 */
import { PRODUCTS } from '../data/products.js';
import { productCard } from './product-list.js';

const indirimOrani = (p) => (p.oldPrice - p.price) / p.oldPrice;

const KAYNAKLAR = {
  indirim: () => PRODUCTS.filter((p) => p.oldPrice).sort((a, b) => indirimOrani(b) - indirimOrani(a)),
  yeni: () => [...PRODUCTS].sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
  populer: () => [...PRODUCTS].sort((a, b) => b.sales - a.sales),
};

function initSlider(slider) {
  const track = slider.querySelector('[data-slider-track]');
  const prev = slider.querySelector('[data-slider-prev]');
  const next = slider.querySelector('[data-slider-next]');
  const dotsEl = slider.querySelector('[data-slider-dots]');

  const kaynak = KAYNAKLAR[slider.dataset.productSlider];
  const limit = Number(slider.dataset.limit) || Infinity;
  const urunler = kaynak ? kaynak().slice(0, limit) : [];

  if (!urunler.length) {
    slider.hidden = true;
    return;
  }
  track.innerHTML = urunler.map(productCard).join('');

  const kartGenisligi = () => {
    const kart = track.firstElementChild;
    const bosluk = parseFloat(getComputedStyle(track).columnGap) || 0;
    return kart ? kart.offsetWidth + bosluk : track.clientWidth;
  };
  const gorunenKart = () => Math.max(1, Math.round(track.clientWidth / kartGenisligi()));
  const sayfaSayisi = () => Math.max(1, Math.ceil((urunler.length - gorunenKart()) / gorunenKart()) + 1);
  const sondaMi = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;

  function durumuGuncelle() {
    prev.disabled = track.scrollLeft <= 5;
    const aktif = sondaMi() ? sayfaSayisi() - 1 : Math.round(track.scrollLeft / (kartGenisligi() * gorunenKart()));
    dotsEl.querySelectorAll('[data-dot]').forEach((d, i) => d.setAttribute('aria-current', String(i === aktif)));
  }

  function noktalariCiz() {
    const adet = sayfaSayisi();
    dotsEl.hidden = adet < 2;
    dotsEl.innerHTML = Array.from({ length: adet }, (_, i) =>
      `<button type="button" data-dot="${i}" aria-label="${i + 1}. sayfa"
               class="h-2 w-2 rounded-full bg-gray-300 transition-all aria-[current=true]:w-6 aria-[current=true]:bg-brand-900"></button>`).join('');
    durumuGuncelle();
  }

  const kaydir = (yon) => {
    if (yon > 0 && sondaMi()) track.scrollTo({ left: 0 });
    else track.scrollBy({ left: yon * kartGenisligi() * gorunenKart() });
  };

  prev.addEventListener('click', () => kaydir(-1));
  next.addEventListener('click', () => kaydir(1));
  dotsEl.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-dot]');
    if (dot) track.scrollTo({ left: Number(dot.dataset.dot) * kartGenisligi() * gorunenKart() });
  });

  let bekle;
  track.addEventListener('scroll', () => {
    clearTimeout(bekle);
    bekle = setTimeout(durumuGuncelle, 80);
  });
  window.addEventListener('resize', noktalariCiz);

  // Otomatik kayma: fare üstündeyken, odaktayken ya da sekme gizliyken durur
  const sure = Number(slider.dataset.autoplay ?? 4000);
  let durdu = false;
  slider.addEventListener('mouseenter', () => (durdu = true));
  slider.addEventListener('mouseleave', () => (durdu = false));
  slider.addEventListener('focusin', () => (durdu = true));
  slider.addEventListener('focusout', () => (durdu = false));
  const hareketAzalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sure > 0 && !hareketAzalt) {
    setInterval(() => {
      if (!durdu && !document.hidden) kaydir(1);
    }, sure);
  }

  noktalariCiz();
}

export function initProductSliders() {
  document.querySelectorAll('[data-product-slider]').forEach(initSlider);
}
