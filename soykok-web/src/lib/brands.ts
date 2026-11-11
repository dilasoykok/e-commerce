/**
 * Markalar — kayan marka bandında, "Sizin İçin Seçtiklerimiz"de ve Hakkımızda'da isim olarak gösterilir.
 * Katalogdaki marka adlarıyla aynı yazılmalı (tıklayınca /urunler?marka=... filtresi açılır).
 * Logo kullanmak isterseniz markanın izin verdiği logoyu public/images/brands altına koyup buraya ekleyin.
 */
export const BRANDS = [
  { name: 'Filli Boya' },
  { name: 'Marshall' },
  { name: 'Dyo' },
  { name: 'Kalekim' },
  { name: 'Knauf' },
  { name: 'Bosch' },
  { name: 'Artema' },
  { name: 'Akfix' },
];

export const brandHref = (name: string) => `/urunler?marka=${encodeURIComponent(name)}`;
