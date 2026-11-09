import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Categories from '@/components/home/Categories';
import Brands from '@/components/home/Brands';
import Picks from '@/components/home/Picks';
import Services from '@/components/home/Services';
import Faq from '@/components/home/Faq';
import StoreContact from '@/components/home/StoreContact';
import { BestSellers, CampaignProducts, NewProducts } from '@/components/home/ProductSections';

// Ürün listeleri en fazla 60 sn'de bir yenilenir (lib/catalog.ts)
export const revalidate = 60;

/** Ana sayfa (eski index.html) — bölüm sırası aynı */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <CampaignProducts />
      <Brands />
      <NewProducts />
      <BestSellers />
      <Picks />
      <Services />
      <Faq />
      <StoreContact />
    </>
  );
}
