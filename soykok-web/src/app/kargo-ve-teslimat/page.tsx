import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';
import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from '@/lib/shipping';
import { formatTL } from '@/lib/format';
import { STORE } from '@/lib/store-info';

export const metadata: Metadata = {
  title: 'Kargo ve Teslimat',
  description: `Teslimat süreleri, kargo ücreti (${formatTL(FREE_SHIPPING_LIMIT)} üzeri ücretsiz) ve mağazadan teslim seçeneği.`,
};

export default function Page() {
  return (
    <LegalPage
      current="/kargo-ve-teslimat"
      title="Kargo ve Teslimat"
      sections={[
        {
          id: 'ucret',
          title: 'Kargo ücreti',
          body: (
            <ul>
              <li>
                {formatTL(FREE_SHIPPING_LIMIT)} ve üzeri siparişlerde kargo <strong>ücretsizdir</strong>.
              </li>
              <li>
                {formatTL(FREE_SHIPPING_LIMIT)} altındaki siparişlerde kargo ücreti {formatTL(SHIPPING_FEE)}&apos;dir.
              </li>
              <li>Mağazadan teslim almayı seçerseniz kargo ücreti alınmaz.</li>
            </ul>
          ),
        },
        {
          id: 'sure',
          title: 'Teslimat süresi',
          body: (
            <>
              <p>
                Stokta olan ürünler siparişiniz onaylandıktan sonra genellikle 3–7 iş günü içinde kargoya verilir. Havale/EFT ile
                verilen siparişlerde süre, ödemenin hesabımıza geçmesiyle başlar.
              </p>
              <p>Yasal azami teslim süresi, sipariş tarihinden itibaren 30 gündür.</p>
            </>
          ),
        },
        {
          id: 'takip',
          title: 'Sipariş takibi',
          body: (
            <p>
              Siparişinizin durumunu <Link href="/siparislerim" className="underline">Sipariş Takibi</Link> sayfasından sipariş
              numaranız ve e-posta adresinizle izleyebilirsiniz. Kargoya verildiğinde takip bilgisi siparişinize eklenir.
            </p>
          ),
        },
        {
          id: 'magaza',
          title: 'Mağazadan teslim',
          body: (
            <p>
              Ödeme sayfasında &quot;Mağazadan Teslim Al&quot; seçeneğini işaretleyerek ürünlerinizi {STORE.name} mağazamızdan
              alabilirsiniz. Siparişiniz hazır olduğunda size haber verilir.{' '}
              <Link href="/magazalarimiz" className="underline">
                Adres ve çalışma saatleri
              </Link>
              .
            </p>
          ),
        },
        {
          id: 'teslim-alirken',
          title: 'Teslim alırken',
          body: (
            <ul>
              <li>Paketleri kargo görevlisinin yanında kontrol edin.</li>
              <li>Hasarlı paketi teslim almayın ya da hasar tespit tutanağı tutturun; ardından bize bildirin.</li>
              <li>Çimento, alçı, alçıpan gibi ağır ürünler bina girişine teslim edilir. [Kata çıkarma hizmeti varsa koşullarını yazın.]</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
