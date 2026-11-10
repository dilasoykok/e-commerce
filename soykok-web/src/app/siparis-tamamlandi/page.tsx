import type { Metadata } from 'next';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import OrderSuccess from '@/components/checkout/OrderSuccess';

export const metadata: Metadata = { title: 'Siparişiniz Alındı', robots: { index: false } };

type Props = { searchParams: Promise<{ no?: string; odeme?: string }> };

/**
 * Sipariş onayı (eski siparis-tamamlandi.html). Sipariş, ödeme sayfasından sekme belleğiyle gelir.
 * Kartla ödemede iyzico dönüşü ?no=...&odeme=basarili ile gelir.
 */
export default async function Page({ searchParams }: Props) {
  const { no, odeme } = await searchParams;
  const paidNumber = odeme === 'basarili' && no ? no : null;
  return (
    <div className="bg-gray-50">
      <div className="container-site py-8 lg:py-12">
        <div className="flex justify-center">
          <CheckoutSteps current={2} />
        </div>
        <OrderSuccess paidNumber={paidNumber} />
      </div>
    </div>
  );
}
