import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import SellerInfo from '@/components/legal/SellerInfo';
import { DisputeResolution, WithdrawalExceptions, WithdrawalRight } from '@/components/legal/ReturnPolicy';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Mesafeli Satış Sözleşmesi' };

/** Mesafeli Satış Sözleşmesi (şablon) — 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği */
export default function Page() {
  return (
    <LegalPage
      current="/mesafeli-satis-sozlesmesi"
      title="Mesafeli Satış Sözleşmesi"
      template
      sections={[
        {
          id: 'taraflar',
          title: 'Taraflar',
          body: (
            <>
              <p>
                <strong>Satıcı:</strong>
              </p>
              <SellerInfo />
              <p>
                <strong>Alıcı:</strong> Siparişi veren ve ödeme sayfasında adı, soyadı, iletişim ve teslimat bilgileri yer alan
                kişi.
              </p>
            </>
          ),
        },
        {
          id: 'konu',
          title: 'Sözleşmenin konusu',
          body: (
            <p>
              Bu sözleşmenin konusu, Alıcının {COMPANY.website} internet sitesi üzerinden elektronik ortamda sipariş verdiği,
              nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünlerin satışı ve teslimine ilişkin olarak tarafların hak
              ve yükümlülüklerinin belirlenmesidir.
            </p>
          ),
        },
        {
          id: 'urunler',
          title: 'Ürünler, fiyat ve ödeme',
          body: (
            <ul>
              <li>Ürünlerin cinsi, adedi, KDV dâhil satış fiyatı, kargo ücreti ve toplam tutar sipariş özetinde ve sipariş onayında belirtilmiştir.</li>
              <li>Sipariş anında geçerli fiyatlar uygulanır; sonradan yapılan fiyat değişiklikleri verilen siparişi etkilemez.</li>
              <li>Ödeme kartla ya da havale/EFT ile yapılır. Kart bilgileri Satıcı tarafından görülmez ve saklanmaz.</li>
            </ul>
          ),
        },
        {
          id: 'teslimat',
          title: 'Teslimat',
          body: (
            <ul>
              <li>Ürünler, Alıcının belirttiği adrese en geç 30 gün içinde kargo ile teslim edilir ya da Alıcı tercih ederse mağazadan teslim alınır.</li>
              <li>Teslimatın imkânsızlaşması halinde Satıcı durumu Alıcıya bildirir ve ödenen bedeli 14 gün içinde iade eder.</li>
              <li>Teslim sırasında hasarlı paketin kargo görevlisine tutanakla bildirilmesi Alıcının yararınadır.</li>
            </ul>
          ),
        },
        { id: 'cayma', title: 'Cayma hakkı', body: <WithdrawalRight /> },
        { id: 'istisnalar', title: 'Cayma hakkının kullanılamayacağı durumlar', body: <WithdrawalExceptions /> },
        {
          id: 'ayip',
          title: 'Ayıplı mal',
          body: (
            <p>
              Ayıplı ürünlerde Alıcı, 6502 sayılı Kanunun 11. maddesi uyarınca sözleşmeden dönme, bedel indirimi, ücretsiz onarım
              veya ayıpsız misli ile değişim haklarından birini kullanabilir.
            </p>
          ),
        },
        { id: 'uyusmazlik', title: 'Uyuşmazlıkların çözümü', body: <DisputeResolution /> },
        {
          id: 'yururluk',
          title: 'Yürürlük',
          body: (
            <p>
              Alıcı, siparişi onaylamadan önce Ön Bilgilendirme Formunu ve bu sözleşmeyi okuyup kabul ettiğini beyan eder.
              Sözleşme, siparişin onaylanmasıyla kurulur ve sipariş bilgileriyle birlikte Alıcının e-posta adresine gönderilir.
              [Sipariş e-postası gönderimi henüz yapılmadı.]
            </p>
          ),
        },
      ]}
    />
  );
}
