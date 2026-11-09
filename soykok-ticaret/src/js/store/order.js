/**
 * Sipariş oluşturma (geçici / demo).
 *
 * Şu an sipariş tarayıcıda oluşturulur ve yalnızca onay sayfasının
 * gösterebilmesi için sessionStorage'a yazılır (sekme kapanınca silinir).
 *
 * Backend hazır olduğunda placeOrder() şuna dönüşecek:
 *   1. POST /api/orders  → sunucu fiyatları KENDİ veritabanından yeniden hesaplar
 *   2. Kartla ödemede sunucu, ödeme sağlayıcısından (iyzico/PayTR) bir ödeme
 *      sayfası adresi alır ve müşteri oraya yönlendirilir (3D Secure).
 *   3. Sağlayıcı sonucu sunucuya bildirir (callback), sipariş "ödendi" olur.
 * Tarayıcıdan gelen fiyat ve toplamlar asla doğru kabul edilmemeli.
 */

import { normalizeEmail } from './session.js';

const LAST_ORDER_KEY = 'soykok-last-order';
// Demo "veritabanı": siparişler bu tarayıcıda saklanır. Backend gelince
// findOrder / getOrdersOf fonksiyonları API isteğine dönüşecek.
const ORDERS_KEY = 'soykok-orders';

function readOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) ?? [];
  } catch {
    return [];
  }
}

function createOrderNumber(date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replaceAll('-', '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SYK-${ymd}-${rand}`;
}

export async function placeOrder({ customer, delivery, payment, items, totals }) {
  // Ağ isteğini taklit et
  await new Promise((resolve) => setTimeout(resolve, 900));

  const order = {
    number: createOrderNumber(),
    createdAt: new Date().toISOString(),
    status: payment.method === 'transfer' ? 'awaiting_transfer' : 'paid_demo',
    demo: true,
    // Tarayıcıda yalnızca onay sayfasının gösterdiği en az bilgi tutulur;
    // adres, telefon ve fatura bilgileri backend'e gidecek, burada saklanmaz.
    customer: { firstName: customer.firstName, email: normalizeEmail(customer.email) },
    delivery: { method: delivery.method },
    payment: { method: payment.method },
    items: items.map(({ id, name, brand, image, price, unit, qty, lineTotal }) => ({ id, name, brand, image, price, unit, qty, lineTotal })),
    totals,
  };

  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()].slice(0, 50)));
  } catch {
    /* depolama kapalıysa onay sayfası genel mesaj gösterir */
  }
  return order;
}

export function getLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY));
  } catch {
    return null;
  }
}


/**
 * Misafir sipariş takibi: sipariş numarası + siparişte kullanılan e-posta
 * birlikte doğruysa sipariş döner. Sadece numara yetmez; başkasının
 * siparişini görmeyi engeller.
 * Backend: POST /api/orders/track { number, email }
 */
export function findOrder(number, email) {
  const no = String(number).trim().toUpperCase();
  const mail = normalizeEmail(email);
  return readOrders().find((o) => o.number === no && o.customer.email === mail) ?? null;
}

/** Üyenin siparişleri (yeniden eskiye). Backend: GET /api/me/orders */
export function getOrdersOf(email) {
  const mail = normalizeEmail(email);
  return readOrders().filter((o) => o.customer.email === mail);
}

/* ---------- Sipariş durumu ---------- */

export const STAGES = [
  { key: 'received', label: 'Sipariş Alındı' },
  { key: 'preparing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Kargoya Verildi', storeLabel: 'Teslimata Hazır' },
  { key: 'delivered', label: 'Teslim Edildi' },
];

/**
 * DEMO: Durum, sipariş üzerinden geçen süreye göre ilerletilir ki takip
 * ekranı denenebilsin. Backend gelince durum doğrudan sunucudan gelecek.
 * Dakika cinsinden: 0-5 alındı, 5-30 hazırlanıyor, 30-120 kargoda, sonrası teslim.
 */
const DEMO_STEPS_MIN = [5, 30, 120];

export function getOrderStage(order, now = Date.now()) {
  if (order.status === 'awaiting_transfer') return 0; // havale gelene kadar ilerlemez
  const minutes = (now - new Date(order.createdAt).getTime()) / 60000;
  return DEMO_STEPS_MIN.filter((m) => minutes >= m).length;
}
