import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import SellerInfo from '@/components/legal/SellerInfo';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metni.',
};

/** 6698 sayılı KVKK m.10 kapsamında aydınlatma metni (şablon) */
export default function Page() {
  return (
    <LegalPage
      current="/kvkk-aydinlatma-metni"
      title="KVKK Aydınlatma Metni"
      template
      intro={
        <p>
          {COMPANY.title} (&quot;{COMPANY.brand}&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
          kapsamında veri sorumlusu sıfatıyla, internet sitemizi ve mağazamızı kullanan müşterilerimizin kişisel verilerini
          hangi amaçla ve nasıl işlediğimizi bu metinle açıklıyoruz.
        </p>
      }
      sections={[
        { id: 'veri-sorumlusu', title: 'Veri sorumlusu', body: <SellerInfo /> },
        {
          id: 'islenen-veriler',
          title: 'İşlenen kişisel veriler',
          body: (
            <ul>
              <li>
                <strong>Kimlik:</strong> ad, soyad; kurumsal faturada T.C. kimlik / vergi numarası
              </li>
              <li>
                <strong>İletişim:</strong> e-posta adresi, cep telefonu, teslimat adresi
              </li>
              <li>
                <strong>Müşteri işlem:</strong> sipariş, sepet, fatura, iade ve talep/şikâyet bilgileri
              </li>
              <li>
                <strong>Finans:</strong> ödeme yöntemi ve ödeme sonucu (kart bilgileriniz sitemizde işlenmez ve saklanmaz; ödeme
                kuruluşunun güvenli sayfasında girilir)
              </li>
              <li>
                <strong>İşlem güvenliği:</strong> oturum bilgileri, IP adresi, tarayıcı ve cihaz bilgileri, işlem kayıtları
              </li>
              <li>
                <strong>Pazarlama:</strong> kampanya iletisi izni ve tercihleriniz (yalnızca izin vermeniz halinde)
              </li>
            </ul>
          ),
        },
        {
          id: 'amaclar',
          title: 'İşleme amaçları',
          body: (
            <ul>
              <li>Üyelik hesabının oluşturulması ve yönetilmesi</li>
              <li>Siparişlerin alınması, ödemenin tahsili, ürünlerin teslimi, fatura düzenlenmesi</li>
              <li>İade, değişim, cayma hakkı ve garanti süreçlerinin yürütülmesi</li>
              <li>Müşteri talep ve şikâyetlerinin yanıtlanması</li>
              <li>Yasal yükümlülüklerin (vergi, ticaret, tüketici mevzuatı) yerine getirilmesi</li>
              <li>Bilgi güvenliğinin sağlanması ve kötüye kullanımın önlenmesi</li>
              <li>İzin vermeniz halinde kampanya ve fırsatlara ilişkin ticari elektronik ileti gönderilmesi</li>
            </ul>
          ),
        },
        {
          id: 'hukuki-sebepler',
          title: 'Hukuki sebepler',
          body: (
            <>
              <p>Kişisel verileriniz KVKK m.5/2 kapsamında aşağıdaki hukuki sebeplere dayanılarak işlenir:</p>
              <ul>
                <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (sipariş ve teslimat)</li>
                <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (fatura, saklama yükümlülükleri)</li>
                <li>Bir hakkın tesisi, kullanılması veya korunması</li>
                <li>Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatimiz (işlem güvenliği)</li>
              </ul>
              <p>Ticari elektronik ileti gönderimi ise yalnızca açık rızanıza / onayınıza dayanır ve dilediğiniz an geri alınabilir.</p>
            </>
          ),
        },
        {
          id: 'aktarim',
          title: 'Kişisel verilerin aktarılması',
          body: (
            <>
              <p>Kişisel verileriniz yukarıdaki amaçlarla ve gerektiği ölçüde şu taraflara aktarılabilir:</p>
              <ul>
                <li>Kargo ve lojistik firmaları (teslimat için ad, telefon, adres)</li>
                <li>Ödeme kuruluşları ve bankalar (ödemenin alınması için)</li>
                <li>Mali müşavir, e-fatura/e-arşiv hizmet sağlayıcısı</li>
                <li>Barındırma (sunucu) ve e-posta/SMS hizmet sağlayıcıları — [yurt dışında sunucu kullanılıyorsa belirtin]</li>
                <li>Talep halinde yetkili kamu kurum ve kuruluşları ile yargı mercileri</li>
              </ul>
            </>
          ),
        },
        {
          id: 'toplama',
          title: 'Toplama yöntemi',
          body: (
            <p>
              Kişisel verileriniz internet sitemizdeki üyelik, sipariş, iletişim formları ve çerezler aracılığıyla elektronik
              ortamda; mağazamızda ise sözlü veya yazılı olarak toplanır.
            </p>
          ),
        },
        {
          id: 'haklar',
          title: 'KVKK m.11 kapsamındaki haklarınız',
          body: (
            <>
              <p>Veri sorumlusuna başvurarak;</p>
              <ul>
                <li>kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,</li>
                <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
                <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme,</li>
                <li>düzeltme, silme ve yok etme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme,</li>
                <li>münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
                <li>kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>
              <p>haklarına sahipsiniz.</p>
            </>
          ),
        },
        {
          id: 'basvuru',
          title: 'Başvuru',
          body: (
            <p>
              Taleplerinizi kimliğinizi doğrulayan bilgilerle birlikte {COMPANY.email} adresine kayıtlı e-postanızdan, {COMPANY.kep}{' '}
              KEP adresine ya da {COMPANY.address} adresine yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde
              ücretsiz olarak sonuçlandırılır.
            </p>
          ),
        },
      ]}
    />
  );
}
