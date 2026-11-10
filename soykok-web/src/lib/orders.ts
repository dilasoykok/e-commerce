import type { DeliveryMethod, OrderStatus, PaymentMethod } from './types';

/** Takip ekranındaki adımlar (eski store/order.js → STAGES) */
export const STAGES: { status: OrderStatus; label: string; storeLabel?: string }[] = [
  { status: 'received', label: 'Sipariş Alındı' },
  { status: 'preparing', label: 'Hazırlanıyor' },
  { status: 'shipped', label: 'Kargoya Verildi', storeLabel: 'Teslimata Hazır' },
  { status: 'delivered', label: 'Teslim Edildi' },
];

export function statusLabel(status: OrderStatus, delivery: DeliveryMethod): string {
  if (status === 'awaitingPayment') return 'Ödeme Bekleniyor';
  if (status === 'cancelled') return 'İptal Edildi';
  const stage = STAGES.find((s) => s.status === status);
  return (delivery === 'store' && stage?.storeLabel) || stage?.label || status;
}

/** Zaman çizelgesinde kaçıncı adımdayız (-1: ödeme bekleniyor / iptal) */
export const stageIndex = (status: OrderStatus) => STAGES.findIndex((s) => s.status === status);

export const deliveryLabel = (d: DeliveryMethod) => (d === 'store' ? 'Mağazadan teslim' : 'Kargo ile teslimat');
export const paymentLabel = (p: PaymentMethod) => (p === 'transfer' ? 'Havale / EFT' : 'Kredi / banka kartı');

/** "10 Kasım 2026 14:05" — Türkiye saatiyle (sunucu UTC'de çalışsa da) */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });

/** Havale/EFT bilgileri — TODO: gerçek hesap bilgileriyle değiştir */
export const BANK_TRANSFER = {
  bank: '[Banka adı]',
  holder: 'Soykök Ticaret',
  iban: 'TR00 0000 0000 0000 0000 0000 00',
};

/** Durum rozetlerinin renkleri (admin paneli) */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  awaitingPayment: 'bg-amber-100 text-amber-800',
  received: 'bg-blue-100 text-blue-800',
  preparing: 'bg-violet-100 text-violet-800',
  shipped: 'bg-brand-900/10 text-brand-900',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-sale',
};
