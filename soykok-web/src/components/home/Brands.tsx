import BrandBand from './BrandBand';
import { getBrands } from '@/lib/catalog';

/** Popüler Markalar — markalar Admin → Markalar'dan gelir; hiç marka yoksa bölüm gösterilmez. */
export default async function Brands() {
  const brands = await getBrands();
  if (brands.length === 0) return null;
  return <BrandBand brands={brands} />;
}
