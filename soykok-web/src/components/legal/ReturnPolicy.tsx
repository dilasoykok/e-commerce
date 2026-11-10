import Link from 'next/link';
import { COMPANY } from '@/lib/company';

/*
 * Cayma hakkı ve iade kuralları — Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi
 * ve İade sayfasında aynı metin kullanılır (tek yerden güncellenir).
 * Dayanak: 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği.
 */

export function WithdrawalRight() {
  return (
    <>
      <p>
        Alıcı, malın kendisine veya gösterdiği kişiye teslim edildiği tarihten itibaren <strong>14 (on dört) gün</strong> içinde
        herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
      </p>
      <p>
        Cayma hakkını kullanmak için bu süre içinde {COMPANY.email} adresine e-posta göndermeniz, {COMPANY.phone} numaralı
        telefonu aramanız ya da <Link href="/iletisim?konu=iade" className="underline">iletişim formunu</Link> &quot;İade ve
        değişim&quot; konusuyla doldurmanız yeterlidir. Bildirimde sipariş numaranızı belirtin.
      </p>
      <ul>
        <li>Cayma bildiriminizden itibaren 10 gün içinde ürünü faturasıyla birlikte bize geri göndermeniz gerekir.</li>
        <li>
          [Anlaşmalı kargo firmamız] ile gönderilen iadelerde kargo ücreti tarafımızca karşılanır. [Anlaşmalı kargo kodunu ve
          gönderim adresini yazın.]
        </li>
        <li>Ürün bedeli, cayma bildiriminin bize ulaşmasından itibaren en geç 14 gün içinde, ödemeyi yaptığınız yöntemle iade edilir.</li>
        <li>
          Ürünü inceleme amacıyla açabilirsiniz. Ancak olağan inceleme dışında kullanım (ör. döşenmiş, kesilmiş, yapıştırılmış
          ürün) nedeniyle oluşan değer kaybından alıcı sorumludur.
        </li>
      </ul>
    </>
  );
}

export function WithdrawalExceptions() {
  return (
    <>
      <p>Mesafeli Sözleşmeler Yönetmeliği uyarınca aşağıdaki durumlarda cayma hakkı kullanılamaz:</p>
      <ul>
        <li>Alıcının istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler (ör. ölçüye göre kesilen ya da özel sipariş edilen ürünler)</li>
        <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler (ör. raf ömrü kısa yapı kimyasalları — [geçerliyse belirtin])</li>
        <li>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler</li>
      </ul>
    </>
  );
}

export function DisputeResolution() {
  return (
    <p>
      Şikâyet ve itirazlarınız için, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dâhilinde yerleşim yerinizdeki
      veya işlemi yaptığınız yerdeki Tüketici Hakem Heyetine ya da Tüketici Mahkemesine başvurabilirsiniz.
    </p>
  );
}
