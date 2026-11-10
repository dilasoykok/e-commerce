import type { Metadata } from 'next';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import OrderSuccess from '@/components/checkout/OrderSuccess';

export const metadata: Metadata = { title: 'Siparişiniz Alındı', robots: { index: false } };

/** Sipariş onayı (eski siparis-tamamlandi.html). Sipariş, ödeme sayfasından sekme belleğiyle gelir. */
export default function Page() {
  return (
    <div className="bg-gray-50">
      <div className="container-site py-8 lg:py-12">
        <div className="flex justify-center">
          <CheckoutSteps current={2} />
        </div>
        <OrderSuccess />
      </div>
    </div>
  );
}
