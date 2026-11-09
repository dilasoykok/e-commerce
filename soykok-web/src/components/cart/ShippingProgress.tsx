import { FREE_SHIPPING_LIMIT } from '@/lib/shipping';
import type { CartSummary } from '@/store/cart';
import { formatTL } from '@/lib/format';

/** Ücretsiz kargo ilerleme çubuğu (eski cart-ui.js → shippingProgress) */
export default function ShippingProgress({ summary }: { summary: CartSummary }) {
  const reached = summary.remainingForFreeShipping === 0;

  return (
    <>
      <p className={`text-[11px] ${reached ? 'font-semibold text-green-700' : 'text-gray-600'}`}>
        {reached ? (
          'Kargonuz ücretsiz!'
        ) : (
          <>
            Ücretsiz kargo için <strong className="text-brand-900">{formatTL(summary.remainingForFreeShipping)}</strong> daha
            ekleyin.
          </>
        )}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_LIMIT}
        aria-valuenow={Math.round(summary.subtotal)}
        aria-label="Ücretsiz kargo ilerlemesi"
      >
        <div
          className={`h-full rounded-full ${reached ? 'bg-green-600' : 'bg-wood-500'} transition-all`}
          style={{ width: `${summary.freeShippingProgress}%` }}
        />
      </div>
    </>
  );
}
