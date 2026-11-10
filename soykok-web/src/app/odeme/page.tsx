import type { Metadata } from 'next';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import CheckoutPage from '@/components/checkout/CheckoutPage';

export const metadata: Metadata = {
  title: 'Ödeme',
  description: 'Teslimat ve ödeme bilgilerinizi girerek siparişinizi tamamlayın.',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ odeme?: string; mesaj?: string }> };

/** Teslimat ve ödeme (eski odeme.html). Kart ödemesi başarısız olursa iyzico dönüşü buraya ?odeme=basarisiz ile gelir. */
export default async function Page({ searchParams }: Props) {
  const { odeme, mesaj } = await searchParams;
  const paymentError =
    odeme === 'basarisiz'
      ? `Ödemeniz tamamlanamadı${mesaj ? `: ${mesaj.slice(0, 300)}` : '.'} Kartınızdan çekim yapılmadı; sepetiniz duruyor, tekrar deneyebilirsiniz.`
      : null;

  return (
    <div className="bg-gray-50">
      <div className="container-site py-6 lg:py-8">
        <CheckoutSteps current={1} />
        <h1 className="mt-5 text-2xl font-bold">Teslimat ve Ödeme</h1>
        <CheckoutPage paymentError={paymentError} />
      </div>
    </div>
  );
}
