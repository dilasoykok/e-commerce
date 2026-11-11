import type { Metadata, Viewport } from 'next';
import './globals.css';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ClientInit from '@/components/providers/ClientInit';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  // Paylaşım önizlemelerindeki (Open Graph) görsel adresleri bununla tamamlanır
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost'),
  title: {
    default: 'Soykök Ticaret | Yapı Malzemeleri Mağazası – Safranbolu',
    template: '%s | Soykök Ticaret',
  },
  description:
    'Safranbolu’da yapı malzemeleri mağazası: boya, hırdavat, tesisat, inşaat malzemeleri ve yapı kimyasalları. Uygun fiyat, güvenli alışveriş.',
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export const viewport: Viewport = {
  themeColor: '#1f2a36',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>
        <a href="#icerik" className="skip-link">
          İçeriğe geç
        </a>
        {/* API verisi (oturum, admin listeleri) için TanStack Query önbelleği */}
        <QueryProvider>
          {/* Sepet ve favorileri tarayıcıda bir kez yükler (görünür bir şey çizmez) */}
          <ClientInit />

          <Header />
          <CartDrawer />

          <main id="icerik" tabIndex={-1} className="outline-none">
            {children}
          </main>

          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
