import type { Metadata } from 'next';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import CheckoutPage from '@/components/checkout/CheckoutPage';

export const metadata: Metadata = {
  title: 'Ödeme',
  description: 'Teslimat ve ödeme bilgilerinizi girerek siparişinizi tamamlayın.',
  robots: { index: false },
};

/** Teslimat ve ödeme (eski odeme.html) */
export default function Page() {
  return (
    <div className="bg-gray-50">
      <div className="container-site py-6 lg:py-8">
        <CheckoutSteps current={1} />
        <h1 className="mt-5 text-2xl font-bold">Teslimat ve Ödeme</h1>
        <CheckoutPage />
      </div>
    </div>
  );
}
