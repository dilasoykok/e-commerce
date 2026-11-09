/**
 * Sepet deposu (geçici).
 *
 * Ürünler bir dizide tutulur. Sayfa yenilenince ve sayfalar arasında
 * kaybolmasın diye dizi localStorage'a da yazılır. Backend hazır olduğunda
 * yalnızca load/save fonksiyonları API çağrısıyla değiştirilecek.
 *
 * Arayüz, subscribe() ile değişiklikleri dinler; diziyi doğrudan değiştirmez.
 */

export const FREE_SHIPPING_LIMIT = 1000; // TL – "Ücretsiz Kargo 1000 TL ve üzeri"
export const SHIPPING_FEE = 149;         // TL – TODO: gerçek kargo ücretiyle değiştir
const MAX_QTY = 999;
const STORAGE_KEY = 'soykok-cart';

let items = load();
const listeners = new Set();

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* gizli sekme vb. – dizi bellekte çalışmaya devam eder */
  }
}

function clampQty(qty) {
  const n = Math.floor(Number(qty));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_QTY) : 1;
}

export function getState() {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;

  return {
    items: items.map((item) => ({ ...item, lineTotal: item.price * item.qty })),
    count: items.length, // header rozetinde farklı ürün sayısı gösterilir
    subtotal,
    shipping,
    total: subtotal + shipping,
    remainingForFreeShipping: Math.max(0, FREE_SHIPPING_LIMIT - subtotal),
    freeShippingProgress: Math.min(100, (subtotal / FREE_SHIPPING_LIMIT) * 100),
  };
}

function emit() {
  save();
  const state = getState();
  listeners.forEach((fn) => fn(state));
}

export const cart = {
  /** Değişiklikleri dinle. Hemen bir kez çağrılır. Dinlemeyi bırakan fonksiyon döner. */
  subscribe(fn) {
    listeners.add(fn);
    fn(getState());
    return () => listeners.delete(fn);
  },

  /** product: { id, name, brand, image, price } */
  add(product, qty = 1) {
    const existing = items.find((item) => item.id === product.id);
    if (existing) {
      existing.qty = clampQty(existing.qty + qty);
    } else {
      items.push({
        id: product.id,
        name: product.name,
        brand: product.brand ?? '',
        image: product.image ?? '',
        price: Number(product.price) || 0,
        unit: product.unit || 'm²',
        qty: clampQty(qty),
      });
    }
    emit();
  },

  setQty(id, qty) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.qty = clampQty(qty);
    emit();
  },

  increment(id, step = 1) {
    const item = items.find((i) => i.id === id);
    if (item) this.setQty(id, item.qty + step);
  },

  remove(id) {
    items = items.filter((item) => item.id !== id);
    emit();
  },

  clear() {
    items = [];
    emit();
  },
};

// Başka sekmede sepet değişirse bu sekmeyi de güncelle
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  items = load();
  listeners.forEach((fn) => fn(getState()));
});

/** 1062 → "1.062 TL", 1062.5 → "1.062,50 TL" */
export function formatTL(value) {
  return (
    value.toLocaleString('tr-TR', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }) + ' TL'
  );
}
