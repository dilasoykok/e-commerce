import type { NextConfig } from 'next';

// `npm run dev` sırasında /api ve /auth istekleri Docker'daki nginx'e gider
// (eski vite.config.js'teki proxy'nin aynısı).
// Farklı bir adres için: API_PROXY=http://localhost:8080 npm run dev
const apiProxy = process.env.API_PROXY ?? 'http://localhost';

const nextConfig: NextConfig = {
  // Docker imajı için: .next/standalone altında tek başına çalışan sunucu üretir
  output: 'standalone',

  async rewrites() {
    // Production'da nginx /api ve /auth'u zaten yönlendirir; bu kurallar
    // yalnızca isteğin Next.js'e geldiği durumlarda (geliştirme) devreye girer.
    return [
      { source: '/api/:path*', destination: `${apiProxy}/api/:path*` },
      { source: '/auth/:path*', destination: `${apiProxy}/auth/:path*` },
    ];
  },
};

export default nextConfig;
