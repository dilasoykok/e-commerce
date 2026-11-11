import { Star } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductSlider from './ProductSlider';
import { getDiscountedProducts, getProducts } from '@/lib/catalog';

/**
 * Ana sayfadaki üç ürün slider'ı (eski campaigns.html, new-products.html,
 * best-sellers.html). Ürünler sunucuda çekilir; API kapalıysa statik veri.
 */

/** Kampanyalı Ürünler — indirim oranı en yüksek olanlar önce */
export async function CampaignProducts() {
  const products = await getDiscountedProducts();
  return (
    <ProductSlider
      id="kampanyalar"
      titleId="campaignTitle"
      title="Kampanyalı Ürünler"
      description="İndirimdeki yapı malzemeleri"
      allHref="/urunler?indirim=1"
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-sale">
          % İndirimde
        </span>
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductSlider>
  );
}

/** Yeni Ürünler — en son eklenen 10 ürün */
export async function NewProducts() {
  const products = await getProducts({ sort: 'yeni', limit: 10 });
  return (
    <ProductSlider
      id="yeni-urunler"
      titleId="newTitle"
      title="Yeni Ürünler"
      description="Mağazamıza en son eklenen ürünler"
      allHref="/urunler?sirala=yeni"
      mobileAllLabel="Tüm Yeni Ürünler"
      autoplay={5000}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
          <span className="size-1.5 rounded-full bg-green-600" /> Yeni Gelenler
        </span>
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductSlider>
  );
}

/** Çok Satanlar — en çok satan 10 ürün */
export async function BestSellers() {
  const products = await getProducts({ sort: 'populer', limit: 10 });
  return (
    <ProductSlider
      id="cok-satanlar"
      titleId="bestTitle"
      title="Çok Satanlar"
      description="Müşterilerimizin en çok tercih ettiği ürünler"
      allHref="/urunler?sirala=populer"
      mobileAllLabel="Tüm Çok Satanlar"
      autoplay={4500}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
          <Star className="size-3.5" strokeWidth={1.75} aria-hidden /> En Çok Tercih Edilenler
        </span>
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductSlider>
  );
}
