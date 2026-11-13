import type { MetadataRoute } from 'next';

const SITE = (process.env.SITE_URL ?? 'http://localhost').replace(/\/$/, '');

/** /robots.txt — kişisel ve işlem sayfaları arama motorlarına kapalı. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/hesap', '/hesabim', '/sepet', '/odeme', '/siparis-tamamlandi', '/siparislerim', '/favorilerim'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
