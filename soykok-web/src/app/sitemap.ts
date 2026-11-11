import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/catalog';
import { LEGAL_PAGES } from '@/lib/company';
import { productHref } from '@/lib/routes';

const SITE = (process.env.SITE_URL ?? 'http://localhost').replace(/\/$/, '');

/** /sitemap.xml — Google'ın sayfaları bulması için. Katalog değişince en geç 1 saatte yenilenir. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, products] = await Promise.all([getCategories(), getProducts({ limit: 100 })]);
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/urunler`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/hakkimizda`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/magazalarimiz`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/iletisim`, changeFrequency: 'monthly', priority: 0.5 },
    ...LEGAL_PAGES.map((p) => ({ url: `${SITE}${p.href}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];

  const categories: MetadataRoute.Sitemap = [
    ...catalog.groups.map((g) => g.slug),
    ...catalog.categories.map((c) => c.slug),
  ].map((slug) => ({ url: `${SITE}/urunler?kategori=${encodeURIComponent(slug)}`, changeFrequency: 'weekly', priority: 0.7 }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}${productHref(p.id)}`,
    lastModified: p.addedAt ? new Date(p.addedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...pages, ...categories, ...productPages];
}
