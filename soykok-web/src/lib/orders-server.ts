import 'server-only';

import { cookies } from 'next/headers';
import { api } from './api/endpoints';
import type { OrderSummary } from './types';

/** Giriş yapmış üyenin siparişleri (sunucuda, tarayıcının oturum çereziyle) */
export async function getMyOrders(): Promise<{ orders: OrderSummary[]; error: string | null }> {
  try {
    const cookie = (await cookies()).toString();
    return { orders: await api.orders.mine({ cookie }), error: null };
  } catch (err) {
    console.warn('[orders] Siparişler alınamadı.', err);
    return { orders: [], error: err instanceof Error ? err.message : 'Siparişler alınamadı.' };
  }
}
