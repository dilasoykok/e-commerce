import { STORE } from './store-info';

/**
 * Satıcı (şirket) bilgileri — sözleşmelerde, KVKK metninde ve footer'da kullanılır.
 * TODO: [köşeli parantezli] alanları gerçek bilgilerle doldurun. Mesafeli satışta
 * bu bilgilerin eksiksiz ve doğru olması yasal zorunluluktur.
 */
export const COMPANY = {
  title: '[Şirket unvanı — ör. Soykök Ticaret Ltd. Şti.]',
  brand: 'Soykök Ticaret',
  address: STORE.addressLines.join(', '),
  phone: STORE.phone,
  email: STORE.email,
  kep: '[KEP adresi]',
  mersis: '[MERSİS no]',
  taxOffice: '[Vergi dairesi]',
  taxNumber: '[Vergi no]',
  website: '[www.alanadiniz.com]',
};

/** Yasal metinlerin son güncellenme tarihi — metni değiştirince güncelleyin */
export const LEGAL_UPDATED_AT = '[GG.AA.YYYY]';

export const LEGAL_PAGES = [
  { href: '/kvkk-aydinlatma-metni', label: 'KVKK Aydınlatma Metni' },
  { href: '/on-bilgilendirme-formu', label: 'Ön Bilgilendirme Formu' },
  { href: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış Sözleşmesi' },
  { href: '/iade-ve-degisim', label: 'İade ve Değişim' },
  { href: '/kargo-ve-teslimat', label: 'Kargo ve Teslimat' },
  { href: '/sss', label: 'Sıkça Sorulan Sorular' },
];
