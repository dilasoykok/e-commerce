import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { WithdrawalExceptions, WithdrawalRight } from '@/components/legal/ReturnPolicy';

export const metadata: Metadata = {
  title: 'İade ve Değişim',
  description: '14 gün içinde cayma hakkı, iade süreci, bedel iadesi ve değişim koşulları.',
};

export default function Page() {
  return (
    <LegalPage
      current="/iade-ve-degisim"
      title="İade ve Değişim"
      template
      sections={[
        { id: 'cayma', title: '14 gün içinde koşulsuz iade (cayma hakkı)', body: <WithdrawalRight /> },
        { id: 'istisnalar', title: 'İade edilemeyen ürünler', body: <WithdrawalExceptions /> },
        {
          id: 'hasarli',
          title: 'Hasarlı veya ayıplı ürün',
          body: (
            <>
              <p>
                Teslimat sırasında paketi kontrol edin; hasarlı paketi teslim almayın ya da kargo görevlisine tutanak tutturun.
                Hasar veya üretim hatasını fark ettiğinizde fotoğraflarıyla birlikte bize bildirin.
              </p>
              <p>
                Ayıplı ürünlerde 6502 sayılı Kanun uyarınca ücretsiz onarım, değişim, bedel indirimi veya sözleşmeden dönme
                haklarınızdan birini seçebilirsiniz. Bu durumda kargo masrafları tarafımıza aittir.
              </p>
            </>
          ),
        },
        {
          id: 'degisim',
          title: 'Değişim',
          body: (
            <p>
              Farklı renk veya model ile değişim için ürünü iade edip yeni sipariş verebilir ya da mağazamıza başvurabilirsiniz.
              Değişimde ürün kullanılmamış ve tekrar satılabilir durumda olmalıdır. [Değişim politikanızı ekleyin.]
            </p>
          ),
        },
        {
          id: 'fazla',
          title: 'Fazla alınan parke',
          body: (
            <p>
              Kullanılmayan, hasarsız paketler cayma süresi içinde yukarıdaki koşullarla iade edilebilir. [Cayma süresi dışında
              fazla paket iadesi kabul ediyorsanız koşullarını yazın.]
            </p>
          ),
        },
      ]}
    />
  );
}
