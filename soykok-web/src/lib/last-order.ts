import type { OrderDetail } from './types';

/**
 * Son verilen sipariş — yalnızca onay sayfası gösterebilsin diye sekme boyunca
 * (sessionStorage) tutulur. Sekme kapanınca silinir; kalıcı kayıt backend'dedir.
 */
const KEY = 'soykok-last-order';

export function saveLastOrder(order: OrderDetail) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* depolama kapalıysa onay sayfası genel mesaj gösterir */
  }
}

export function readLastOrder(): OrderDetail | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}
