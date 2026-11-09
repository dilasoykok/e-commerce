/** Markalar — kayan marka bandında ve "Sizin İçin Seçtiklerimiz"de kullanılır */
export const BRANDS = [
  { name: 'Krono Original', logo: 'krono-original.png' },
  { name: 'Classen', logo: 'classen.png' },
  { name: 'Egger', logo: 'egger.png' },
  { name: 'Parador', logo: 'parador.png' },
  { name: 'Quick-Step', logo: 'quick-step.png' },
];

export const brandHref = (name: string) => `/urunler?marka=${encodeURIComponent(name)}`;
