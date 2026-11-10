import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';
import SellerInfo from '@/components/legal/SellerInfo';
import { DisputeResolution, WithdrawalExceptions, WithdrawalRight } from '@/components/legal/ReturnPolicy';
import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from '@/lib/shipping';
import { formatTL } from '@/lib/format';

export const metadata: Metadata = { title: 'Ön Bilgilendirme Formu' };

/**
 * Mesafeli Sözleşmeler Yönetmeliği m.5 kapsamında ön bilgilendirme (şablon).
 * Siparişe özel bilgiler (ürünler, tutar, alıcı, teslimat adresi) ödeme sayfasındaki
 * sipariş özetinde ve sipariş onayında yer alır.
 */
export default function Page() {
  return (
    <LegalPage
      current="/on-bilgilendirme-formu"
      title="Ön Bilgilendirme Formu"
      template
      intro={<p>Bu form, siparişinizi onaylamadan önce 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca bilgilendirilmeniz amacıyla hazırlanmıştır.</p>}
      sections={[
        { id: 'satici', title: 'Satıcı bilgileri', body: <SellerInfo /> },
        {
          id: 'urun',
          title: 'Ürün ve fiyat bilgileri',
          body: (
            <>
              <p>
                Sözleşme konusu ürünlerin temel nitelikleri, adetleri, KDV dâhil birim ve toplam fiyatları ödeme sayfasındaki
                &quot;Sipariş Özeti&quot; bölümünde ve sipariş onayında gösterilir. Listelenen fiyatlar KDV dâhildir ve
                sipariş anındaki fiyat geçerlidir.
              </p>
              <p>
                Kargo ücreti: {formatTL(FREE_SHIPPING_LIMIT)} ve üzeri siparişlerde ücretsiz, altında {formatTL(SHIPPING_FEE)}.
                Mağazadan teslimde kargo ücreti alınmaz.
              </p>
            </>
          ),
        },
        {
          id: 'odeme-teslimat',
          title: 'Ödeme ve teslimat',
          body: (
            <ul>
              <li>Ödeme kredi/banka kartı (ödeme kuruluşunun 3D Secure sayfasında) veya havale/EFT ile yapılır.</li>
              <li>Havale/EFT ile verilen siparişlerde ödemenin 24 saat içinde yapılması gerekir; aksi halde sipariş iptal edilebilir.</li>
              <li>
                Ürünler en geç 30 gün içinde, alıcının belirttiği adrese teslim edilir. Ayrıntılar:{' '}
                <Link href="/kargo-ve-teslimat" className="underline">
                  Kargo ve Teslimat
                </Link>
                .
              </li>
            </ul>
          ),
        },
        { id: 'cayma', title: 'Cayma hakkı', body: <WithdrawalRight /> },
        { id: 'istisnalar', title: 'Cayma hakkının kullanılamayacağı durumlar', body: <WithdrawalExceptions /> },
        { id: 'sikayet', title: 'Şikâyet ve itiraz', body: <DisputeResolution /> },
      ]}
    />
  );
}
