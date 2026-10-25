import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La photo de l'accueil est servie en qualité 85 : nette sur écran Retina, toujours légère.
  images: { qualities: [75, 85] },
  async headers() {
    // Les images de la mascotte et les emoji changent rarement : un jour en cache, puis rafraîchies en arrière-plan.
    const assets = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/decode/:path*', headers: assets },
      { source: '/emoji/:path*', headers: assets },
    ];
  },
};

export default nextConfig;
